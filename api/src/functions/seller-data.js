const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('seller-data', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const userId = request.query.get('userId');
      if (!userId) {
        return { status: 400, jsonBody: { error: 'userId é obrigatório' } };
      }

      await sql.connect(sqlConfig);

      // Buscar perfil do vendedor + nome do usuário
      const sellerResult = await sql.query`
        SELECT s.id, s.city, s.dailyGoal, s.soldToday, u.name
        FROM Sellers s
        INNER JOIN Users u ON u.id = s.userId
        WHERE s.userId = ${userId}
      `;

      if (sellerResult.recordset.length === 0) {
        return { status: 404, jsonBody: { error: 'Perfil de vendedor não encontrado' } };
      }

      const seller = sellerResult.recordset[0];

      // Buscar alertas, clientes com detalhes, cidades — em paralelo
      const [alertsResult, clientsResult, productsResult, ordersResult, citiesResult, cityClientsResult] = await Promise.all([
        sql.query`SELECT id, type, text FROM SellerAlerts WHERE sellerId = ${seller.id} AND active = 1`,
        sql.query`SELECT id, cityId, establishmentName AS name, clientName, segment, priority, priorityReason, tag, lastPurchase, lastValue, avgTicket, suggestion, pendency, bestDay, address, contactNumber, invoicePreference FROM Clients ORDER BY CASE priority WHEN 'alta' THEN 1 WHEN 'média' THEN 2 ELSE 3 END`,
        sql.query`SELECT clientId, productName, type FROM ClientProducts`,
        sql.query`SELECT clientId, orderId, orderDate, value, items FROM ClientOrders ORDER BY id DESC`,
        sql.query`SELECT id, name FROM Cities ORDER BY name`,
        sql.query`SELECT id, cityId, establishmentName AS name, segment FROM Clients ORDER BY establishmentName`,
      ]);

      // Montar clientes completos
      const allClients = clientsResult.recordset.map(c => ({
        ...c,
        topProducts: productsResult.recordset.filter(p => p.clientId === c.id && p.type === 'top').map(p => p.productName),
        recommended: productsResult.recordset.filter(p => p.clientId === c.id && p.type === 'recommended').map(p => p.productName),
        orders: ordersResult.recordset.filter(o => o.clientId === c.id).map(o => ({
          id: o.orderId, date: o.orderDate, value: o.value, items: o.items
        })),
      }));

      // Montar cidades com clientes básicos (para RegisterSale)
      const cities = citiesResult.recordset.map(city => ({
        ...city,
        clients: cityClientsResult.recordset
          .filter(c => c.cityId === city.id)
          .map(c => ({ id: c.id, name: c.name, segment: c.segment })),
      }));

      return {
        jsonBody: {
          seller: {
            name: seller.name,
            city: seller.city,
            goal: seller.dailyGoal,
            sold: seller.soldToday,
            totalClients: allClients.length,
            alerts: alertsResult.recordset,
            clients: allClients,
          },
          cities,
        },
      };
    } catch (error) {
      context.error('Erro na função seller-data:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
