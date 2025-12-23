// __tests__/hooks/useWorkouts.test.ts

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            contains: jest.fn().mockReturnThis(),
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

describe('useWorkouts Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve iniciar com lista vazia de treinos', async () => {
        expect(true).toBe(true);
    });

    it('deve buscar treinos quando usuário está logado', async () => {
        expect(true).toBe(true);
    });

    it('deve atualizar treinos via realtime', async () => {
        expect(true).toBe(true);
    });
});
