-- Adicionar campo name na tabela Users
ALTER TABLE Users ADD name NVARCHAR(255) NULL;

-- Tabela de perfis de vendedores (estende Users)
CREATE TABLE Sellers (
  id INT IDENTITY(1,1) PRIMARY KEY,
  userId INT NOT NULL CONSTRAINT FK_Sellers_Users FOREIGN KEY REFERENCES Users(id),
  city NVARCHAR(100) NOT NULL,
  dailyGoal DECIMAL(10,2) NOT NULL DEFAULT 0,
  soldToday DECIMAL(10,2) NOT NULL DEFAULT 0,
  routeDate DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE)
);

-- Alertas do vendedor
CREATE TABLE SellerAlerts (
  id INT IDENTITY(1,1) PRIMARY KEY,
  sellerId INT NOT NULL CONSTRAINT FK_Alerts_Sellers FOREIGN KEY REFERENCES Sellers(id),
  type NVARCHAR(20) NOT NULL,
  text NVARCHAR(500) NOT NULL,
  active BIT NOT NULL DEFAULT 1
);

-- Cidades
CREATE TABLE Cities (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL
);

-- Clientes
CREATE TABLE Clients (
  id INT IDENTITY(1,1) PRIMARY KEY,
  cityId INT NOT NULL CONSTRAINT FK_Clients_Cities FOREIGN KEY REFERENCES Cities(id),
  name NVARCHAR(255) NOT NULL,
  segment NVARCHAR(100) NOT NULL,
  priority NVARCHAR(20) NOT NULL DEFAULT 'média',
  priorityReason NVARCHAR(500) NULL,
  tag NVARCHAR(100) NULL,
  lastPurchase NVARCHAR(100) NULL,
  lastValue NVARCHAR(50) NULL,
  avgTicket NVARCHAR(50) NULL,
  suggestion NVARCHAR(1000) NULL,
  pendency NVARCHAR(100) NULL DEFAULT 'Nenhuma',
  bestDay NVARCHAR(100) NULL
);

-- Produtos recomendados e mais comprados por cliente
CREATE TABLE ClientProducts (
  id INT IDENTITY(1,1) PRIMARY KEY,
  clientId INT NOT NULL CONSTRAINT FK_CP_Clients FOREIGN KEY REFERENCES Clients(id),
  productName NVARCHAR(255) NOT NULL,
  type NVARCHAR(20) NOT NULL
);

-- Histórico de pedidos por cliente
CREATE TABLE ClientOrders (
  id INT IDENTITY(1,1) PRIMARY KEY,
  clientId INT NOT NULL CONSTRAINT FK_CO_Clients FOREIGN KEY REFERENCES Clients(id),
  orderId NVARCHAR(50) NOT NULL,
  orderDate NVARCHAR(100) NOT NULL,
  value NVARCHAR(50) NOT NULL,
  items NVARCHAR(500) NOT NULL
);

-- =====================
-- DADOS INICIAIS
-- =====================

INSERT INTO Cities (name) VALUES ('Lages'), ('Florianópolis'), ('Blumenau'), ('Joinville');

INSERT INTO Clients (cityId, name, segment, priority, priorityReason, tag, lastPurchase, lastValue, avgTicket, suggestion, pendency, bestDay) VALUES
(1,'Mercado Central','Supermercado','alta','Alto ticket e 22 dias sem compra.','Recompra iminente','22 dias atrás','R$ 1.240','R$ 980','Cliente compra pão de queijo a cada ~20 dias. Nunca comprou açaí premium — leve uma amostra e ofereça combo com croissant para aumentar o ticket.','Nenhuma','Terças e quintas'),
(1,'Padaria Bom Pão','Padaria','alta','Compra pão de queijo sempre, nunca comprou croissant.','Cross-sell','11 dias atrás','R$ 520','R$ 490','Padaria com bom giro de pão de queijo mas mix limitado. Nunca experimentou croissant — excelente oportunidade para ampliar o portfólio.','Nenhuma','Segundas'),
(1,'Lanchonete Avenida','Lanchonete','média','Cliente parado há 40 dias — risco de perda.','Reativação','40 dias atrás','R$ 380','R$ 410','Parou de comprar há 40 dias. Provável estoque cheio ou mudança de fornecedor. Leve uma proposta de reativação com condição especial.','Nenhuma','Quartas'),
(1,'Restaurante Sabor Caseiro','Restaurante','média','Ticket alto, sem visita há 30 dias.','Alto valor','30 dias atrás','R$ 1.780','R$ 1.650','Maior ticket médio da rota. Compra regularmente mas há 30 dias sem visita — priorize para manter fidelidade e ofereça novos produtos.','Nenhuma','Quintas'),
(1,'Mercado Bom Preço','Supermercado','baixa','Parado há 45 dias — reativação urgente.','Reativação urgente','45 dias atrás','R$ 690','R$ 720','Cliente parado há 45 dias. Pode ter trocado de fornecedor. Chegue com uma proposta especial de reativação e escute o motivo da pausa.','Verificar','Sextas'),
(2,'Cafeteria Ilha','Cafeteria','média','Sem visita há 20 dias.','Visita pendente','20 dias atrás','R$ 640','R$ 580','Cafeteria com bom giro de croissant e pão de queijo. Boa oportunidade para ampliar com mini pizza.','Nenhuma','Terças'),
(2,'Padaria do Porto','Padaria','alta','Compra frequente, ticket crescendo.','Fidelizado','8 dias atrás','R$ 720','R$ 660','Cliente fidelizado com histórico de crescimento. Ofereça produtos da linha premium.','Nenhuma','Segundas'),
(2,'Restaurante Mar Aberto','Restaurante','baixa','Pedido esporádico.','Oportunidade','35 dias atrás','R$ 980','R$ 850','Restaurante com ticket alto mas compra esporádica. Identifique o responsável por compras e estabeleça contato regular.','Nenhuma','Quintas'),
(3,'Mercado Bela Vista','Supermercado','alta','Alto volume, recompra próxima.','Recompra iminente','18 dias atrás','R$ 1.100','R$ 1.050','Mercado de alto volume com padrão de compra a cada 20 dias. Priorize visita esta semana.','Nenhuma','Quartas'),
(3,'Lanchonete Rápido','Lanchonete','média','Cliente novo, segundo pedido pendente.','Novo cliente','15 dias atrás','R$ 290','R$ 290','Cliente novo que fez primeiro pedido há 15 dias. Momento ideal para visita de acompanhamento e ampliar o mix.','Nenhuma','Terças'),
(4,'Hotel Norte','Hotel','alta','Ticket muito alto, visita mensal necessária.','Alto valor','28 dias atrás','R$ 2.100','R$ 1.980','Hotel com o maior ticket da rota de Joinville. Visita mensal necessária para manter o relacionamento.','Nenhuma','Quintas'),
(4,'Cafeteria Central','Cafeteria','média','Compra regular de croissant.','Fidelizado','12 dias atrás','R$ 480','R$ 460','Cafeteria com foco em croissant. Nunca comprou pão de queijo — boa oportunidade de cross-sell.','Nenhuma','Terças'),
(4,'Mercado Norte Sul','Supermercado','baixa','Compra esporádica há 3 meses.','Reativação','50 dias atrás','R$ 560','R$ 610','Mercado que comprava regularmente mas parou. Investigue o motivo e apresente nova proposta.','Nenhuma','Sextas');

INSERT INTO ClientProducts (clientId, productName, type) VALUES
(1,'Pão de Queijo','top'),(1,'Assados Congelados','top'),(1,'Açaí Premium','recommended'),(1,'Croissant Congelado','recommended'),
(2,'Pão de Queijo Tradicional','top'),(2,'Croissant Congelado','recommended'),(2,'Mini Pizza','recommended'),
(3,'Salgados para Revenda','top'),(3,'Mini Pizza','top'),(3,'Salgados para Revenda','recommended'),(3,'Pão de Queijo','recommended'),
(4,'Assados Congelados','top'),(4,'Açaí Premium','top'),(4,'Croissant Congelado','recommended'),(4,'Pão de Queijo','recommended'),
(5,'Açaí Premium','top'),(5,'Açaí Premium','recommended'),(5,'Salgados para Revenda','recommended');

INSERT INTO ClientOrders (clientId, orderId, orderDate, value, items) VALUES
(1,'SAB-1045','22 dias atrás','R$ 1.240','Pão de Queijo, Assados'),
(1,'SAB-1032','42 dias atrás','R$ 890','Pão de Queijo'),
(1,'SAB-1018','63 dias atrás','R$ 1.100','Assados, Açaí'),
(2,'SAB-1041','11 dias atrás','R$ 520','Pão de Queijo'),
(2,'SAB-1029','28 dias atrás','R$ 460','Pão de Queijo'),
(3,'SAB-1010','40 dias atrás','R$ 380','Salgados, Mini Pizza'),
(3,'SAB-0998','60 dias atrás','R$ 440','Salgados'),
(4,'SAB-1038','30 dias atrás','R$ 1.780','Assados, Açaí'),
(4,'SAB-1021','58 dias atrás','R$ 1.520','Assados'),
(5,'SAB-0988','45 dias atrás','R$ 690','Açaí'),
(5,'SAB-0975','72 dias atrás','R$ 750','Açaí, Salgados');
