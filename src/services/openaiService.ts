// src/services/openaiService.ts - Serviço de integração com OpenAI Assistants API
// ⚠️ As credenciais devem estar no .env como EXPO_PUBLIC_OPENAI_API_KEY e EXPO_PUBLIC_OPENAI_ASSISTANT_ID
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const ASSISTANT_ID = process.env.EXPO_PUBLIC_OPENAI_ASSISTANT_ID || '';

interface OpenAIMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ThreadMessage {
    id: string;
    role: string;
    content: Array<{
        type: string;
        text?: { value: string };
    }>;
}

class OpenAIService {
    private baseUrl = 'https://api.openai.com/v1';
    private threadIds: Map<string, string> = new Map(); // conversationId -> threadId

    private async request(endpoint: string, options: RequestInit = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('OpenAI API Error:', error);
            throw new Error(error.error?.message || 'OpenAI API request failed');
        }

        return response.json();
    }

    // Cria uma nova thread (conversa) no OpenAI
    async createThread(): Promise<string> {
        const result = await this.request('/threads', {
            method: 'POST',
            body: JSON.stringify({}),
        });
        return result.id;
    }

    // Obtém ou cria uma thread para a conversa
    async getOrCreateThread(conversationId: string): Promise<string> {
        let threadId = this.threadIds.get(conversationId);

        if (!threadId) {
            threadId = await this.createThread();
            this.threadIds.set(conversationId, threadId);
        }

        return threadId;
    }

    // Adiciona uma mensagem à thread
    async addMessage(threadId: string, content: string): Promise<void> {
        await this.request(`/threads/${threadId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
                role: 'user',
                content,
            }),
        });
    }

    // Executa o assistant na thread
    async runAssistant(threadId: string): Promise<string> {
        // Inicia a execução
        const run = await this.request(`/threads/${threadId}/runs`, {
            method: 'POST',
            body: JSON.stringify({
                assistant_id: ASSISTANT_ID,
            }),
        });

        // Aguarda a conclusão (polling)
        let status = run.status;
        let runId = run.id;

        while (status === 'queued' || status === 'in_progress') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const runStatus = await this.request(`/threads/${threadId}/runs/${runId}`);
            status = runStatus.status;

            if (status === 'failed' || status === 'cancelled' || status === 'expired') {
                throw new Error(`Assistant run ${status}`);
            }
        }

        // Busca a resposta
        const messages = await this.request(`/threads/${threadId}/messages?limit=1&order=desc`);
        const assistantMessage = messages.data[0];

        if (assistantMessage && assistantMessage.role === 'assistant') {
            const textContent = assistantMessage.content.find((c: any) => c.type === 'text');
            return textContent?.text?.value || 'Desculpe, não consegui processar sua mensagem.';
        }

        return 'Desculpe, não consegui processar sua mensagem.';
    }

    // Método principal: envia mensagem e recebe resposta do Coach IA
    async chat(conversationId: string, userMessage: string): Promise<string> {
        try {
            const threadId = await this.getOrCreateThread(conversationId);
            await this.addMessage(threadId, userMessage);
            const response = await this.runAssistant(threadId);
            return response;
        } catch (error) {
            console.error('OpenAI Chat Error:', error);
            throw error;
        }
    }
}

export const openaiService = new OpenAIService();
export default openaiService;
