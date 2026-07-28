const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('deliveries', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    let pool;
    try {
      const userId = request.query.get('userId');
      if (!userId) return { status: 400, jsonBody: { error: 'userId é obrigatório' } };

      pool = await new sql.ConnectionPool(sqlConfig).connect();

      const sellerResult = await pool.request().query`SELECT id FROM Sellers WHERE userId = ${userId}`;
      if (!sellerResult.recordset.length) return { jsonBody: { deliveries: [] } };
      const sellerId = sellerResult.recordset[0].id;

      const deliveriesResult = await pool.request().query`
        SELECT id, code, status, deliveryDate
        FROM Deliveries
        WHERE seller_id = ${sellerId}
        ORDER BY id DESC
      `;

      if (!deliveriesResult.recordset.length) {
        return { jsonBody: { deliveries: [] } };
      }

      const ordersResult = await pool.request().query`
        SELECT dord.delivery_id, o.id AS orderId, o.clientName, o.status AS orderStatus
        FROM DeliveryOrders dord
        INNER JOIN GestaoOrders o ON o.id = dord.order_id
        WHERE dord.delivery_id IN (SELECT id FROM Deliveries WHERE seller_id = ${sellerId})
        ORDER BY o.id DESC
      `;

      const deliveries = deliveriesResult.recordset.map((d) => ({
        id: d.id,
        code: d.code,
        status: d.status || null,
        deliveryDate: d.deliveryDate || null,
        orders: ordersResult.recordset
          .filter((o) => o.delivery_id === d.id)
          .map((o) => ({
            id: o.orderId,
            clientName: o.clientName,
            status: o.orderStatus,
          })),
      }));

      return { jsonBody: { deliveries } };
    } catch (error) {
      context.error('Erro em deliveries:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      if (pool) await pool.close();
    }
  },
});
