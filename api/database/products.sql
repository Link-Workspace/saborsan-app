-- Criação da tabela de produtos
CREATE TABLE Products (
  id NVARCHAR(100) NOT NULL CONSTRAINT PK_Products PRIMARY KEY,
  name NVARCHAR(255) NOT NULL,
  category NVARCHAR(100) NOT NULL,
  price NVARCHAR(100) NOT NULL DEFAULT 'Sob consulta',
  badge NVARCHAR(100) NULL,
  description NVARCHAR(500) NULL,
  details NVARCHAR(MAX) NULL,
  packaging NVARCHAR(255) NULL,       -- Embalagem
  conservation NVARCHAR(255) NULL,    -- Conservação
  preparation NVARCHAR(255) NULL,     -- Preparo
  idealFor NVARCHAR(255) NULL,        -- Ideal para
  availableQuantity INT NOT NULL DEFAULT 0,
  imageUrl NVARCHAR(500) NULL,
  active BIT NOT NULL DEFAULT 1,
  createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Inserção dos produtos
INSERT INTO Products (id, name, category, price, badge, description, details, packaging, conservation, preparation, idealFor, availableQuantity, imageUrl) VALUES
(
  'pao-queijo-tradicional',
  'Pão de Queijo Tradicional',
  'Pão de queijo',
  'Sob consulta',
  'Mais procurado',
  'Clássico, prático e perfeito para padarias, cafeterias e mercados.',
  'Produto congelado com preparo rápido, textura macia e sabor marcante para operações comerciais que buscam praticidade e alto giro.',
  'Pacotes comerciais sob consulta',
  'Manter congelado',
  'Forno ou air fryer',
  'Padarias, cafeterias, hotéis e mercados',
  0,
  'images/pao-de-queijo-real.jpg'
),
(
  'assados-congelados',
  'Assados Congelados',
  'Assados',
  'Sob consulta',
  'Vitrine',
  'Produtos para alto giro, preparo rápido e ótima apresentação.',
  'Linha ideal para compor vitrines, cardápios e combos com facilidade no preparo e excelente apresentação para o cliente final.',
  'Caixas para food service',
  'Congelado',
  'Assar até dourar',
  'Lanchonetes, cafeterias e conveniências',
  0,
  'images/assados-real.png'
),
(
  'acai-premium',
  'Açaí Premium',
  'Açaí',
  'Sob consulta',
  'Verão',
  'Ideal para tigelas, copos, sobremesas e combos comerciais.',
  'Açaí cremoso para operações que precisam de sabor, praticidade e grande potencial de venda em dias quentes ou cardápios de sobremesa.',
  'Baldes e unidades sob consulta',
  'Congelado',
  'Servir conforme operação',
  'Açaíterias, mercados e lanchonetes',
  0,
  'images/acai-real.avif'
),
(
  'croissant-congelado',
  'Croissant Congelado',
  'Croissant',
  'Sob consulta',
  'Cafeterias',
  'Uma opção charmosa para cafés, hotéis, padarias e conveniências.',
  'Produto versátil para ampliar o mix do estabelecimento, podendo ser servido puro, recheado ou como opção diferenciada de lanche.',
  'Unidades comerciais sob consulta',
  'Congelado',
  'Forno até dourar',
  'Cafeterias, hotéis e padarias',
  0,
  'images/croissant-real.avif'
),
(
  'mini-pizza',
  'Mini Pizza',
  'Assados',
  'Sob consulta',
  'Alto giro',
  'Perfeita para lanches rápidos, vitrines e combos de grande saída.',
  'Mini pizza prática para estabelecimentos que querem oferecer uma opção saborosa, com boa apresentação e preparo simples.',
  'Formatos comerciais sob consulta',
  'Manter congelado',
  'Assar até aquecer e derreter o queijo',
  'Lanchonetes, mercados e cafeterias',
  0,
  'images/mini-pizza-1.jpg'
),
(
  'salgados-revenda',
  'Salgados para Revenda',
  'Salgados',
  'Sob consulta',
  'Food service',
  'Linha de salgados congelados para ampliar o catálogo do seu ponto de venda.',
  'Alternativas práticas para quem deseja variedade, giro e facilidade na operação, com opções para diferentes momentos de consumo.',
  'Mix sob consulta',
  'Manter congelado',
  'Conforme o produto',
  'Mercados, bares e conveniências',
  0,
  'images/salgados-real.jpg'
),
(
  'linha-mercados',
  'Linha para Mercados',
  'Muito mais',
  'Sob consulta',
  'Mercados',
  'Produtos congelados para compor gôndolas, freezers e pontos de venda.',
  'Soluções para varejo alimentar com variedade e atendimento próximo, ajudando sua loja a oferecer opções práticas para os clientes.',
  'Pedidos sob demanda',
  'Congelado',
  'Conforme categoria',
  'Mercados e empórios',
  0,
  'images/linha-mercados-real.png'
),
(
  'linha-food-service',
  'Linha para Food Service',
  'Muito mais',
  'Sob consulta',
  'Comercial',
  'Produtos voltados para restaurantes, hotéis, cafeterias e cozinhas profissionais.',
  'Mix de alimentos para apoiar operações comerciais que precisam de praticidade, consistência e variedade no cardápio.',
  'Formatos comerciais',
  'Congelado',
  'Conforme operação',
  'Restaurantes, hotéis e cafeterias',
  0,
  'images/linha-food-service-real.jpeg'
);
