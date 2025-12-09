import { useState, useEffect } from 'react';
import { signInUser, signUpUser, resetPasswordForEmail } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { ShapeProLogo } from '@/components/ui/ShapeProLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDeviceContext } from '@/hooks/useDeviceContext';

export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [lastResetTime, setLastResetTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [emailExistsStatus, setEmailExistsStatus] = useState<'checking' | 'exists' | 'available' | null>(null);
  const [emailCheckingLogin, setEmailCheckingLogin] = useState(false);
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isNative } = useDeviceContext();
  const [searchParams] = useSearchParams();

  // ✅ BUILD 36: Auto-focar no login se vier de confirmação de email
  useEffect(() => {
    const autoLogin = searchParams.get('autoLogin');
    const confirmed = searchParams.get('confirmed');

    if (autoLogin === 'true' || confirmed === 'true') {
      setActiveTab('signin');

      // Mostrar toast de sucesso
      if (confirmed === 'true') {
        toast({
          title: "✅ Email confirmado com sucesso!",
          description: "Faça login para acessar sua conta.",
        });
      }
    }
  }, [searchParams, toast]);

  // Gerenciar cooldown
  useEffect(() => {
    if (resetCooldown > 0) {
      const timer = setTimeout(() => {
        setResetCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resetCooldown]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ✅ BUILD 40.2 FASE 4: Função de retry com backoff exponencial
    const loginWithRetry = async (maxRetries = 2) => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            // Aguardar antes de retry (2s, 4s, 8s...)
            const waitTime = Math.pow(2, attempt) * 1000;

            toast({
              title: `🔄 Tentativa ${attempt + 1}/${maxRetries + 1}`,
              description: `Aguardando ${waitTime / 1000}s antes de tentar novamente...`,
            });

            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

          // Tentar login
          await signInUser(email, password);

          // Sucesso!
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo de volta ao Prass Trainer.",
          });

          return; // Sair do loop

        } catch (error: any) {
          // Se for último retry, propagar erro
          if (attempt === maxRetries) {
            throw error;
          }

          // Se não for erro de timeout, não fazer retry
          if (!error.message.includes('timeout') &&
            !error.message.includes('não está respondendo') &&
            !error.message.includes('Problema de conexão')) {
            throw error;
          }

          // Continuar para próximo retry
          console.log(`[Login] Tentativa ${attempt + 1} falhou, tentando novamente...`);
        }
      }
    };

    try {
      await loginWithRetry(2); // Até 3 tentativas (0, 1, 2)
    } catch (error: any) {
      // ✅ Detectar timeout do banco
      if (error.message.includes('timeout') ||
        error.message.includes('não está respondendo') ||
        error.message.includes('Problema de conexão')) {
        toast({
          title: "⏱️ Servidor está demorando",
          description: "O banco de dados pode estar acordando. Aguarde 10 segundos e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // ✅ Detectar erro de email não confirmado
      if (error.message.includes('não confirmado')) {
        toast({
          title: "⚠️ Email não confirmado",
          description: "Verifique sua caixa de entrada antes de fazer login.",
          variant: "destructive",
        });

        setTimeout(() => {
          toast({
            title: "💡 Dica",
            description: "Não recebeu o email? Clique em 'Criar Conta' novamente para reenviar.",
          });
        }, 2000);

        return;
      }

      // Erro genérico
      toast({
        title: "Erro no login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar aceitação dos termos
    if (!termsAccepted) {
      toast({
        title: "⚠️ Termos não aceitos",
        description: "Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // FASE 1: Validação proativa - verificar se email já existe
      const { exists, confirmed } = await checkEmailExistsFull(email);

      if (exists) {
        if (confirmed) {
          // Email existe e está confirmado → redirecionar para login
          toast({
            title: "Email já cadastrado",
            description: "Este email já possui uma conta. Faça login.",
            variant: "destructive",
          });
          setActiveTab('signin');
          setLoading(false);
          return;
        } else {
          // Email existe mas não está confirmado → reenviar email

          const { detectOrigin, calculateRedirectUrl } = await import('@/utils/domainDetector');
          const meta = detectOrigin('student');
          const redirectUrl = calculateRedirectUrl(meta);

          const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
              emailRedirectTo: redirectUrl
            }
          });

          if (error) {
            // ✅ BUILD 35: Detectar erro de template
            if (error.message?.includes('template') ||
              error.message?.includes('function') ||
              error.message?.includes('date') ||
              error.message?.includes('Error rendering email')) {
              toast({
                title: "⚠️ Erro no servidor de email",
                description: "Entre em contato com suporte. Erro técnico: template de email incorreto.",
                variant: "destructive",
              });
              setLoading(false);
              return;
            }

            toast({
              title: "Email já cadastrado",
              description: "Complete a confirmação do email. Verifique sua caixa de entrada.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Email de confirmação reenviado",
              description: "Verifique sua caixa de entrada e spam.",
            });
          }

          navigate(`/auth/verify?email=${encodeURIComponent(email)}`);
          setLoading(false);
          return;
        }
      }

      // Email não existe → continuar com signup normal
      const result = await signUpUser(email, password, name, 'student', isNative);

      if (result?.session) {
        toast({
          title: "✅ Conta criada!",
          description: "Bem-vindo ao Prass Trainer!",
        });
        navigate('/', { replace: true });
      } else {
        toast({
          title: "📧 Email de confirmação enviado!",
          description: `Verifique sua caixa de entrada em ${email}`,
        });
        navigate(`/auth/verify?email=${encodeURIComponent(email)}`, { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Não foi possível criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setEmailExists(null);
      setEmailCheckingLogin(false);
      return;
    }

    setEmailCheckingLogin(true);

    try {
      const { getSupabase } = await import('@/integrations/supabase/client');
      const supabaseClient = getSupabase();
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', emailToCheck.toLowerCase().trim())
        .maybeSingle();

      setEmailExists(!!data);
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      setEmailExists(null);
    } finally {
      setEmailCheckingLogin(false);
    }
  };

  // Verificar se email existe e se está confirmado (para Fase 1)
  const checkEmailExistsFull = async (email: string): Promise<{ exists: boolean; confirmed: boolean }> => {
    try {
      const { getSupabase } = await import('@/integrations/supabase/client');
      const supabaseClient = getSupabase();
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error || !data) {
        return { exists: false, confirmed: false };
      }

      // Tentar verificar se o usuário está confirmado
      // Como não temos acesso direto ao auth.users, vamos tentar fazer login sem senha
      // para verificar se o email está confirmado
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      // Se não houver usuário logado, assumimos que existe mas não está confirmado
      // (método alternativo já que não temos acesso direto ao auth.users)
      return { exists: true, confirmed: false };
    } catch (error) {
      return { exists: false, confirmed: false };
    }
  };

  // Verificar email em tempo real (debounced) - Fase 3
  useEffect(() => {
    if (activeTab === 'signup' && email && email.includes('@')) {
      const timeoutId = setTimeout(async () => {
        setEmailExistsStatus('checking');
        const { getSupabase } = await import('@/integrations/supabase/client');
        const supabaseClient = getSupabase();
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();

        if (data && !error) {
          setEmailExistsStatus('exists');
          setIsEmailConfirmed(true); // Assumir que está confirmado se existe no profiles
        } else {
          setEmailExistsStatus('available');
          setIsEmailConfirmed(false);
        }
      }, 800);

      return () => clearTimeout(timeoutId);
    } else {
      setEmailExistsStatus(null);
      setIsEmailConfirmed(false);
    }
  }, [email, activeTab]);

  const handleResetPassword = async () => {
    // Verificar cooldown
    if (resetCooldown > 0) {
      toast({
        title: "⏱️ Aguarde",
        description: `Você poderá solicitar novamente em ${resetCooldown}s`,
        variant: "destructive",
      });
      return;
    }

    if (!email) {
      toast({
        title: "Informe seu email",
        description: "Digite seu email para receber o link de recuperação.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@') || email.length < 5) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido para continuar.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      // Verificar se o email existe no sistema
      await checkEmailExists(email);

      if (emailExists === false) {
        toast({
          title: "Email não encontrado",
          description: "Este email não está cadastrado no sistema.",
          variant: "destructive",
        });
        return;
      }

      // Tentar enviar o email de reset
      await resetPasswordForEmail(email, isNative);

      toast({
        title: "Email enviado com sucesso!",
        description: "Verifique sua caixa de entrada e spam. O link é válido por 1 hora.",
      });

      // Opcional: Mostrar informações adicionais sobre onde verificar
      setTimeout(() => {
        toast({
          title: "💡 Dica importante",
          description: "Se não receber o email, verifique a pasta de spam ou lixo eletrônico.",
        });
      }, 3000);

    } catch (error: any) {
      // Mensagens de erro mais específicas
      let errorMessage = "Tente novamente mais tarde.";

      if (error.message?.includes('network')) {
        errorMessage = "Verifique sua conexão com a internet.";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Muitas tentativas. Aguarde alguns minutos.";
      } else if (error.message?.includes('invalid')) {
        errorMessage = "Email inválido ou não encontrado.";
      }

      toast({
        title: "Erro ao enviar email",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/prass-trainer-icon.png"
            alt="Prass Trainer - Transforme sua vida"
            className="h-32 w-auto mx-auto mb-4 rounded-2xl"
          />
          <p className="text-muted-foreground">Transforme sua vida com muscula��o especializada</p>

          {/* Health Disclaimer - Google Play Compliance */}
          <div className="mt-6 px-4 text-[10px] text-muted-foreground/40 text-center leading-tight">
            <p>
              <strong>Aviso de Sa�de:</strong> Este aplicativo oferece sugest�es de exerc�cios e nutri��o para fins informativos.
              Consulte um m�dico antes de iniciar qualquer programa.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/50 border border-primary/30">
            <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-black font-semibold">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-black font-semibold">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card className="bg-black/40 border-primary/20">
              <CardHeader>
                <CardTitle>Fazer Login</CardTitle>
                <CardDescription>Entre com sua conta para acessar seus treinos e dietas</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="��������" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" variant="link" size="sm" onClick={handleResetPassword} disabled={resetLoading || resetCooldown > 0} className="flex items-center gap-2 text-primary">
                      {resetLoading ? <><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />Enviando...</> : resetCooldown > 0 ? <><Mail className="h-3 w-3" />Aguarde {resetCooldown}s</> : <><Mail className="h-3 w-3" />Esqueceu a senha?</>}
                    </Button>
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-bold" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="bg-black/40 border-primary/20">
              <CardHeader>
                <CardTitle>Criar Conta</CardTitle>
                <CardDescription>Crie sua conta gratuita e comece sua transforma��o</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" type="text" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pr-10" />
                      {emailExistsStatus && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {emailExistsStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          {emailExistsStatus === 'exists' && <XCircle className="h-4 w-4 text-destructive" />}
                          {emailExistsStatus === 'available' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      )}
                    </div>
                    {emailExistsStatus === 'exists' && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />Email j� cadastrado.{' '}<button type="button" onClick={() => setActiveTab('signin')} className="underline font-medium hover:text-destructive/80">Fazer login</button>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="��������" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} className="mt-1" />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      Li e concordo com os{' '}<span className="text-primary underline hover:text-primary/80 font-medium cursor-pointer">Termos de Uso</span>{' '}e a{' '}<span className="text-primary underline hover:text-primary/80 font-medium cursor-pointer">Pol�tica de Privacidade</span>
                    </Label>
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-bold" disabled={loading || !termsAccepted || (emailExistsStatus === 'exists' && isEmailConfirmed)}>
                    {loading ? "Criando conta..." : (emailExistsStatus === 'exists' && isEmailConfirmed) ? "Email j� cadastrado" : "Criar Conta"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
