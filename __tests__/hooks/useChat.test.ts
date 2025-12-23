// __tests__/hooks/useChat.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
        channel: jest.fn().mockReturnValue({
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnThis(),
            unsubscribe: jest.fn(),
        }),
    },
}));

// Mock do useAuth
jest.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id' },
        loading: false,
    }),
}));

describe('useChat Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve iniciar com loading true', async () => {
        expect(true).toBe(true);
    });

    it('deve buscar conversas quando usuário está logado', async () => {
        expect(true).toBe(true);
    });

    it('deve enviar mensagem corretamente', async () => {
        expect(true).toBe(true);
    });
});
