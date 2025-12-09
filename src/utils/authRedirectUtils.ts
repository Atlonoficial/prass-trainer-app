import { supabase } from '@/integrations/supabase/client';

export interface AuthActionData {
  type: string;
  token_hash?: string;
  email?: string;
  redirect_to?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
}

export const parseAuthParams = (searchParams: URLSearchParams): AuthActionData => {
  // First try to get from search params (query)
  let authData: AuthActionData = {
    type: searchParams.get('type') || '',
    token_hash: searchParams.get('token_hash') || undefined,
    email: searchParams.get('email') || undefined,
    redirect_to: searchParams.get('redirect_to') || undefined,
    error: searchParams.get('error') || undefined,
    error_code: searchParams.get('error_code') || undefined,
    error_description: searchParams.get('error_description') || undefined,
  };

  // If no type found in search params, check URL fragment (hash)
  if (!authData.type && window.location.hash) {
    const fragmentParams = new URLSearchParams(window.location.hash.substring(1));

    authData = {
      type: fragmentParams.get('type') || 'recovery', // Default to recovery for fragment tokens
      token_hash: fragmentParams.get('access_token') || fragmentParams.get('token_hash') || undefined,
      email: fragmentParams.get('email') || undefined,
      redirect_to: fragmentParams.get('redirect_to') || undefined,
      error: fragmentParams.get('error') || undefined,
      error_code: fragmentParams.get('error_code') || undefined,
      error_description: fragmentParams.get('error_description') || undefined,
    };
  }

  return authData;
};

export const calculateIntelligentRedirect = (metadata: any, userType?: 'student' | 'teacher'): string => {
  // Determinar user type final (prioriza o parâmetro, depois metadata)
  const metadataUserType = metadata?.user_type;
  const finalUserType = userType || metadataUserType;

  // Prioridade 1: Professor → Dashboard
  if (finalUserType === 'teacher') {
    return '/dashboard-professor';
  }

  // Prioridade 2: Aluno ou padrão → Home
  return '/';
};

export const getRedirectPath = async (userType?: 'student' | 'teacher'): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const metadata = user.user_metadata;

      // Se não tiver userType passado, buscar do profile
      let finalUserType = userType;
      if (!finalUserType) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        finalUserType = profile?.user_type as 'student' | 'teacher';
      }

      // Usar função de cálculo inteligente
      return calculateIntelligentRedirect(metadata, finalUserType);
    }
  } catch (error) {
    // Silenciar erros de navegação
  }

  // Fallback seguro
  return '/';
};

export const processAuthAction = async (actionData: AuthActionData) => {
  const { type, token_hash, error } = actionData;

  if (error) {
    throw new Error(actionData.error_description || error);
  }

  if (!token_hash) {
    throw new Error('Token de autenticação não encontrado');
  }

  switch (type) {
    case 'signup':
    case 'email_confirmation':
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email'
      });

      if (verifyError) {
        // ✅ BUILD 35: Detectar OTP expirado especificamente
        if (verifyError.message?.includes('expired') ||
          verifyError.message?.includes('otp_expired') ||
          verifyError.message?.includes('invalid') ||
          verifyError.status === 401) {
          throw new Error('Link de confirmação expirado ou inválido. Solicite um novo email de confirmação.');
        }

        console.warn('processAuthAction: OTP verification error');
        throw verifyError;
      }

      // Esperar sessão ser estabelecida (até 5 segundos)
      let sessionFound = false;
      for (let i = 0; i < 10; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          sessionFound = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      break;

    case 'recovery':
    case 'password_recovery':
      // For password recovery from fragment, Supabase handles it automatically
      break;

    case 'email_change':
      const { error: emailChangeError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email_change'
      });
      if (emailChangeError) throw emailChangeError;
      break;

    case 'invite':
    case 'magiclink':
      const { error: magicLinkError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'magiclink'
      });
      if (magicLinkError) throw magicLinkError;
      break;

    default:
      throw new Error(`Tipo de ação não reconhecido: ${type}`);
  }
};

export const getActionTitle = (type: string): string => {
  switch (type) {
    case 'signup':
    case 'email_confirmation':
      return 'Confirmação de Email';
    case 'recovery':
    case 'password_recovery':
      return 'Recuperação de Senha';
    case 'email_change':
      return 'Alteração de Email';
    case 'invite':
      return 'Convite Aceito';
    case 'magiclink':
      return 'Login por Link Mágico';
    default:
      return 'Autenticação';
  }
};

export const getActionDescription = (type: string): string => {
  switch (type) {
    case 'signup':
    case 'email_confirmation':
      return 'Sua conta foi confirmada com sucesso!';
    case 'recovery':
    case 'password_recovery':
      return 'Agora você pode definir uma nova senha.';
    case 'email_change':
      return 'Seu email foi alterado com sucesso!';
    case 'invite':
      return 'Convite aceito! Bem-vindo à Prass Trainer!';
    case 'magiclink':
      return 'Login realizado com sucesso!';
    default:
      return 'Processando sua solicitação...';
  }
};
