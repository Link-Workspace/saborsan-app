export const products = [
  {
    id: 'pao-queijo-tradicional',
    name: 'Pão de Queijo Tradicional',
    category: 'Pão de queijo',
    price: 'Sob consulta',
    badge: 'Mais procurado',
    image: '/images/pao-de-queijo-real.jpg',
    description: 'Clássico, prático e perfeito para padarias, cafeterias e mercados.',
    details: 'Produto congelado com preparo rápido, textura macia e sabor marcante para operações comerciais que buscam praticidade e alto giro.',
    weight: 'Pacotes comerciais sob consulta',
    conservation: 'Manter congelado',
    preparation: 'Forno ou air fryer',
    idealFor: 'Padarias, cafeterias, hotéis e mercados'
  },
  {
    id: 'assados-congelados',
    name: 'Assados Congelados',
    category: 'Assados',
    price: 'Sob consulta',
    badge: 'Vitrine',
    image: '/images/assados-real.png',
    description: 'Produtos para alto giro, preparo rápido e ótima apresentação.',
    details: 'Linha ideal para compor vitrines, cardápios e combos com facilidade no preparo e excelente apresentação para o cliente final.',
    weight: 'Caixas para food service',
    conservation: 'Congelado',
    preparation: 'Assar até dourar',
    idealFor: 'Lanchonetes, cafeterias e conveniências'
  },
  {
    id: 'acai-premium',
    name: 'Açaí Premium',
    category: 'Açaí',
    price: 'Sob consulta',
    badge: 'Verão',
    image: '/images/acai-real.avif',
    description: 'Ideal para tigelas, copos, sobremesas e combos comerciais.',
    details: 'Açaí cremoso para operações que precisam de sabor, praticidade e grande potencial de venda em dias quentes ou cardápios de sobremesa.',
    weight: 'Baldes e unidades sob consulta',
    conservation: 'Congelado',
    preparation: 'Servir conforme operação',
    idealFor: 'Açaíterias, mercados e lanchonetes'
  },
  {
    id: 'croissant-congelado',
    name: 'Croissant Congelado',
    category: 'Croissant',
    price: 'Sob consulta',
    badge: 'Cafeterias',
    image: '/images/croissant-real.avif',
    description: 'Uma opção charmosa para cafés, hotéis, padarias e conveniências.',
    details: 'Produto versátil para ampliar o mix do estabelecimento, podendo ser servido puro, recheado ou como opção diferenciada de lanche.',
    weight: 'Unidades comerciais sob consulta',
    conservation: 'Congelado',
    preparation: 'Forno até dourar',
    idealFor: 'Cafeterias, hotéis e padarias'
  },
  {
    id: 'mini-pizza',
    name: 'Mini Pizza',
    category: 'Assados',
    price: 'Sob consulta',
    badge: 'Alto giro',
    image: '/images/mini-pizza-1.jpg',
    description: 'Perfeita para lanches rápidos, vitrines e combos de grande saída.',
    details: 'Mini pizza prática para estabelecimentos que querem oferecer uma opção saborosa, com boa apresentação e preparo simples.',
    weight: 'Formatos comerciais sob consulta',
    conservation: 'Manter congelado',
    preparation: 'Assar até aquecer e derreter o queijo',
    idealFor: 'Lanchonetes, mercados e cafeterias'
  },
  {
    id: 'salgados-revenda',
    name: 'Salgados para Revenda',
    category: 'Salgados',
    price: 'Sob consulta',
    badge: 'Food service',
    image: '/images/salgados-real.jpg',
    description: 'Linha de salgados congelados para ampliar o catálogo do seu ponto de venda.',
    details: 'Alternativas práticas para quem deseja variedade, giro e facilidade na operação, com opções para diferentes momentos de consumo.',
    weight: 'Mix sob consulta',
    conservation: 'Manter congelado',
    preparation: 'Conforme o produto',
    idealFor: 'Mercados, bares e conveniências'
  },
  {
    id: 'linha-mercados',
    name: 'Linha para Mercados',
    category: 'Muito mais',
    price: 'Sob consulta',
    badge: 'Mercados',
    image: '/images/linha-mercados-real.png',
    description: 'Produtos congelados para compor gôndolas, freezers e pontos de venda.',
    details: 'Soluções para varejo alimentar com variedade e atendimento próximo, ajudando sua loja a oferecer opções práticas para os clientes.',
    weight: 'Pedidos sob demanda',
    conservation: 'Congelado',
    preparation: 'Conforme categoria',
    idealFor: 'Mercados e empórios'
  },
  {
    id: 'linha-food-service',
    name: 'Linha para Food Service',
    category: 'Muito mais',
    price: 'Sob consulta',
    badge: 'Comercial',
    image: '/images/linha-food-service-real.jpeg',
    description: 'Produtos voltados para restaurantes, hotéis, cafeterias e cozinhas profissionais.',
    details: 'Mix de alimentos para apoiar operações comerciais que precisam de praticidade, consistência e variedade no cardápio.',
    weight: 'Formatos comerciais',
    conservation: 'Congelado',
    preparation: 'Conforme operação',
    idealFor: 'Restaurantes, hotéis e cafeterias'
  }
]

export const upcomingProducts = [
  {
    title: 'Nova linha de empanadas',
    description: 'Sabores especiais para conquistar o paladar dos clientes em vitrines e combos.',
    month: 'Em breve',
    image: '/images/salgados-real.jpg'
  },
  {
    title: 'Polpas selecionadas',
    description: 'Mais sabores para sucos naturais, vitaminas e bebidas comerciais.',
    month: 'Novidade',
    image: '/images/acai-real.avif'
  },
  {
    title: 'Assados para cafeteria',
    description: 'Linha pensada para cafeterias, hotéis e padarias com preparo prático.',
    month: 'Chegando',
    image: '/images/croissant-real.avif'
  }
]

export const demoOrders = [
  {
    id: 'SAB-1024',
    product: 'Pão de Queijo Tradicional',
    date: 'Hoje',
    orderDate: '15/06/2026',
    deliveryDate: '18/06/2026',
    quantity: '5 pacotes',
    status: 'Solicitado',
    step: 1,
    observations: 'Entregar no período da manhã.'
  },
  {
    id: 'SAB-1018',
    product: 'Açaí Premium',
    date: 'Ontem',
    orderDate: '14/06/2026',
    deliveryDate: '17/06/2026',
    quantity: '2 baldes',
    status: 'Em separação',
    step: 2,
    observations: ''
  },
  {
    id: 'SAB-1007',
    product: 'Assados Congelados',
    date: '12/06',
    orderDate: '12/06/2026',
    deliveryDate: '15/06/2026',
    quantity: '10 caixas',
    status: 'Saiu para entrega',
    step: 3,
    observations: 'Ligar antes de entregar.'
  }
]

export const citiesData = [
  {
    name: 'Lages',
    clients: [
      { id: 1, name: 'Mercado Central', segment: 'Supermercado' },
      { id: 2, name: 'Padaria Bom Pão', segment: 'Padaria' },
      { id: 3, name: 'Lanchonete Avenida', segment: 'Lanchonete' },
      { id: 4, name: 'Restaurante Sabor Caseiro', segment: 'Restaurante' },
      { id: 5, name: 'Mercado Bom Preço', segment: 'Supermercado' }
    ]
  },
  {
    name: 'Florianópolis',
    clients: [
      { id: 6, name: 'Cafeteria Ilha', segment: 'Cafeteria' },
      { id: 7, name: 'Padaria do Porto', segment: 'Padaria' },
      { id: 8, name: 'Restaurante Mar Aberto', segment: 'Restaurante' }
    ]
  },
  {
    name: 'Blumenau',
    clients: [
      { id: 9, name: 'Mercado Bela Vista', segment: 'Supermercado' },
      { id: 10, name: 'Lanchonete Rápido', segment: 'Lanchonete' }
    ]
  },
  {
    name: 'Joinville',
    clients: [
      { id: 11, name: 'Hotel Norte', segment: 'Hotel' },
      { id: 12, name: 'Cafeteria Central', segment: 'Cafeteria' },
      { id: 13, name: 'Mercado Norte Sul', segment: 'Supermercado' }
    ]
  }
]

export const sellerDemoData = {
  name: 'João Silva',
  city: 'Lages',
  goal: 4000,
  sold: 1850,
  visitedClients: 5,
  totalClients: 12,
  priorityRemaining: 4,
  alerts: [
    { id: 1, type: 'warning', text: 'Mercado Bom Preço parado há 45 dias — alto potencial de reativação.' },
    { id: 2, type: 'info', text: 'Croissant Congelado em destaque esta semana — boa abertura para oferta.' },
    { id: 3, type: 'goal', text: 'Meta 46% alcançada. Faltam R$ 2.150 — 4 clientes prioritários disponíveis.' }
  ],
  clients: [
    {
      id: 1,
      name: 'Mercado Central',
      segment: 'Supermercado',
      priority: 'alta',
      priorityReason: 'Alto ticket e 22 dias sem compra.',
      tag: 'Recompra iminente',
      lastPurchase: '22 dias atrás',
      lastValue: 'R$ 1.240',
      avgTicket: 'R$ 980',
      topProducts: ['Pão de Queijo', 'Assados Congelados'],
      recommended: ['Açaí Premium', 'Croissant Congelado'],
      suggestion: 'Cliente compra pão de queijo a cada ~20 dias. Nunca comprou açaí premium — leve uma amostra e ofereça combo com croissant para aumentar o ticket.',
      pendency: 'Nenhuma',
      bestDay: 'Terças e quintas',
      orders: [
        { id: 'SAB-1045', date: '22 dias atrás', value: 'R$ 1.240', items: 'Pão de Queijo, Assados' },
        { id: 'SAB-1032', date: '42 dias atrás', value: 'R$ 890', items: 'Pão de Queijo' },
        { id: 'SAB-1018', date: '63 dias atrás', value: 'R$ 1.100', items: 'Assados, Açaí' }
      ]
    },
    {
      id: 2,
      name: 'Padaria Bom Pão',
      segment: 'Padaria',
      priority: 'alta',
      priorityReason: 'Compra pão de queijo sempre, nunca comprou croissant.',
      tag: 'Cross-sell',
      lastPurchase: '11 dias atrás',
      lastValue: 'R$ 520',
      avgTicket: 'R$ 490',
      topProducts: ['Pão de Queijo Tradicional'],
      recommended: ['Croissant Congelado', 'Mini Pizza'],
      suggestion: 'Padaria com bom giro de pão de queijo mas mix limitado. Nunca experimentou croissant — excelente oportunidade para ampliar o portfólio.',
      pendency: 'Nenhuma',
      bestDay: 'Segundas',
      orders: [
        { id: 'SAB-1041', date: '11 dias atrás', value: 'R$ 520', items: 'Pão de Queijo' },
        { id: 'SAB-1029', date: '28 dias atrás', value: 'R$ 460', items: 'Pão de Queijo' }
      ]
    },
    {
      id: 3,
      name: 'Lanchonete Avenida',
      segment: 'Lanchonete',
      priority: 'média',
      priorityReason: 'Cliente parado há 40 dias — risco de perda.',
      tag: 'Reativação',
      lastPurchase: '40 dias atrás',
      lastValue: 'R$ 380',
      avgTicket: 'R$ 410',
      topProducts: ['Salgados para Revenda', 'Mini Pizza'],
      recommended: ['Salgados para Revenda', 'Pão de Queijo'],
      suggestion: 'Parou de comprar há 40 dias. Provável estoque cheio ou mudança de fornecedor. Leve uma proposta de reativação com condição especial.',
      pendency: 'Nenhuma',
      bestDay: 'Quartas',
      orders: [
        { id: 'SAB-1010', date: '40 dias atrás', value: 'R$ 380', items: 'Salgados, Mini Pizza' },
        { id: 'SAB-0998', date: '60 dias atrás', value: 'R$ 440', items: 'Salgados' }
      ]
    },
    {
      id: 4,
      name: 'Restaurante Sabor Caseiro',
      segment: 'Restaurante',
      priority: 'média',
      priorityReason: 'Ticket alto, sem visita há 30 dias.',
      tag: 'Alto valor',
      lastPurchase: '30 dias atrás',
      lastValue: 'R$ 1.780',
      avgTicket: 'R$ 1.650',
      topProducts: ['Assados Congelados', 'Açaí Premium'],
      recommended: ['Croissant Congelado', 'Pão de Queijo'],
      suggestion: 'Maior ticket médio da rota. Compra regularmente mas há 30 dias sem visita — priorize para manter fidelidade e ofereça novos produtos.',
      pendency: 'Nenhuma',
      bestDay: 'Quintas',
      orders: [
        { id: 'SAB-1038', date: '30 dias atrás', value: 'R$ 1.780', items: 'Assados, Açaí' },
        { id: 'SAB-1021', date: '58 dias atrás', value: 'R$ 1.520', items: 'Assados' }
      ]
    },
    {
      id: 5,
      name: 'Mercado Bom Preço',
      segment: 'Supermercado',
      priority: 'baixa',
      priorityReason: 'Parado há 45 dias — reativação urgente.',
      tag: 'Reativação urgente',
      lastPurchase: '45 dias atrás',
      lastValue: 'R$ 690',
      avgTicket: 'R$ 720',
      topProducts: ['Açaí Premium'],
      recommended: ['Açaí Premium', 'Salgados para Revenda'],
      suggestion: 'Cliente parado há 45 dias. Pode ter trocado de fornecedor. Chegue com uma proposta especial de reativação e escute o motivo da pausa.',
      pendency: 'Verificar',
      bestDay: 'Sextas',
      orders: [
        { id: 'SAB-0988', date: '45 dias atrás', value: 'R$ 690', items: 'Açaí' },
        { id: 'SAB-0975', date: '72 dias atrás', value: 'R$ 750', items: 'Açaí, Salgados' }
      ]
    }
  ]
}
