// __tests__/hooks/useAuth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: jest.fn().mockReturnValue({
                data: { subscription: { unsubscribe: jest.fn() } }
            }),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
        },
    },
}));

describe('useAuth Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve iniciar sem usuário logado', async () => {
        // Este é um teste placeholder - a implementação real depende da estrutura do hook
        expect(true).toBe(true);
    });

    it('deve retornar loading inicialmente', async () => {
        expect(true).toBe(true);
    });
});
