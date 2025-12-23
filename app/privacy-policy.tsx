// app/privacy-policy.tsx - Política de Privacidade
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/ui/AppHeader';
import Colors from '@/constants/Colors';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    const sections = [
        {
            title: '1. Introdução',
            content: `O Prass Trainer respeita sua privacidade e está comprometido com a proteção dos seus dados pessoais. Esta política descreve como coletamos, usamos e protegemos suas informações.`,
        },
        {
            title: '2. Dados Coletados',
            content: `Coletamos os seguintes tipos de dados:

• Informações de conta: nome, email, telefone
• Dados de treino: exercícios realizados, séries, repetições
• Dados corporais: peso, altura, medidas, fotos de progresso
• Dados de nutrição: refeições registradas, macros
• Dados de saúde: histórico médico (anamnese), exames
• Dados de uso: logs de acesso, preferências do app`,
        },
        {
            title: '3. Uso dos Dados',
            content: `Utilizamos seus dados para:

• Fornecer e personalizar nossos serviços
• Gerar relatórios de progresso
• Comunicação entre você e seu treinador
• Melhorar a experiência do usuário
• Análises e estatísticas (dados agregados)
• Suporte ao cliente`,
        },
        {
            title: '4. Compartilhamento',
            content: `Seus dados são compartilhados apenas com:

• Seu treinador designado na plataforma
• Provedores de serviços essenciais (hospedagem, analytics)
• Quando exigido por lei

Nunca vendemos ou alugamos seus dados pessoais a terceiros.`,
        },
        {
            title: '5. Armazenamento e Segurança',
            content: `Seus dados são protegidos através de:

• Criptografia em trânsito (HTTPS/TLS)
• Criptografia em repouso no banco de dados
• Controles de acesso rigorosos
• Backups regulares
• Servidores seguros na nuvem`,
        },
        {
            title: '6. Seus Direitos',
            content: `Você tem direito a:

• Acessar seus dados pessoais
• Corrigir informações incorretas
• Solicitar exclusão dos seus dados
• Exportar seus dados
• Revogar consentimento a qualquer momento

Para exercer esses direitos, entre em contato conosco.`,
        },
        {
            title: '7. Retenção de Dados',
            content: `Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta, removemos seus dados em até 30 dias, exceto quando houver obrigação legal de retenção.`,
        },
        {
            title: '8. Cookies e Rastreamento',
            content: `O aplicativo pode utilizar tecnologias de rastreamento para:

• Manter você conectado
• Lembrar suas preferências
• Analisar uso do aplicativo

Você pode desativar cookies nas configurações do dispositivo.`,
        },
        {
            title: '9. Alterações na Política',
            content: `Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas através do aplicativo ou email.`,
        },
        {
            title: '10. Contato',
            content: `Para dúvidas sobre privacidade, entre em contato:

Email: privacidade@prasstrainer.com
Responsável: Equipe Prass Trainer`,
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader title="Política de Privacidade" showBack />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Ionicons name="shield-checkmark" size={48} color={Colors.primary} />
                    <Text style={styles.lastUpdated}>Última atualização: Dezembro 2024</Text>
                </View>

                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionContent}>{section.content}</Text>
                    </View>
                ))}

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>

                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    lastUpdated: {
        color: '#666',
        fontSize: 12,
        marginTop: 12,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    sectionContent: {
        color: '#ccc',
        fontSize: 14,
        lineHeight: 22,
    },
    backButton: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
});
