// Configuração do Supabase
// Substitua pelos valores do seu projeto no Supabase (https://app.supabase.com)
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANONIMA_AQUI';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Categorias
const CATEGORIES = [
    "Moradia (Aluguer/Hipoteca)",
    "Alimentação (Supermercado/Restaurantes)",
    "Transporte (Combustível/Transportes Públicos)",
    "Contas (Água/Eletricidade/Gás/Internet)",
    "Saúde (Médico/Farmácia)",
    "Educação (Propinas/Cursos)",
    "Lazer (Cinema/Viagens/Hobbies)",
    "Compras (Roupa/Eletrónicos)",
    "Outros"
];

const INCOME_CATEGORIES = [
    "Ordenado",
    "Trabalho Extra",
    "Investimentos (Dividendos/Juros)",
    "Vendas",
    "Rendas Recebidas",
    "Outros Rendimentos"
];
