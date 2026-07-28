const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('delivery-confirmations', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    let pool;
    try {
      pool = await new sql.ConnectionPool(sqlConfig).connect();

      // GET: retorna pedidos em Separação vinculados a entregas deste entregador
      if (request.method === 'GET') {
        const userId = request.query.get('userId');
        if (!userId) return { status: 400, jsonBody: { error: 'userId é obrigatório' } };

        const sellerResult = await pool.request().query`SELECT id FROM Sellers WHERE userId = ${userId}`;
        if (!sellerResult.recordset.length) return { jsonBody: { confirmations: [] } };
        const sellerId = sellerResult.recordset[0].id;

        const result = await pool.request().query`
          SELECT o.id AS orderId, o.clientName, d.code AS deliveryCode
          FROM GestaoOrders o
          INNER JOIN DeliveryOrders dord ON dord.order_code = o.id
          INNER JOIN Deliveries d ON d.id = dord.delivery_id
          WHERE o.status = N'Separação'
            AND d.seller_id = ${sellerId}
        `;

        return {
          jsonBody: {
            confirmations: result.recordset.map((r) => ({
              orderId: r.orderId,
              customer: r.clientName,
              deliveryCode: r.deliveryCode,
            })),
          },
        };
      }

      // POST: confirma que o pedido está pronto para entrar em rota
      if (request.method === 'POST') {
        const { orderId, userId } = await request.json();
        if (!orderId) return { status: 400, jsonBody: { error: 'orderId é obrigatório' } };

        // Verificar que este entregador realmente está vinculado a uma entrega com este pedido
        if (userId) {
          const sellerResult = await pool.request().query`SELECT id FROM Sellers WHERE userId = ${userId}`;
          if (sellerResult.recordset.length > 0) {
            const sellerId = sellerResult.recordset[0].id;
            const check = await pool.request().query`
              SELECT 1 FROM DeliveryOrders dord
              INNER JOIN Deliveries d ON d.id = dord.delivery_id
              WHERE dord.order_code = ${orderId} AND d.seller_id = ${sellerId}
            `;
            if (!check.recordset.length) {
              return { status: 403, jsonBody: { error: 'Você não está vinculado a uma entrega com este pedido.' } };
            }
          }
        }

        await pool.request().query`UPDATE GestaoOrders SET status = N'Pronto' WHERE id = ${orderId}`;

        return { jsonBody: { success: true } };
      }
    } catch (error) {
      context.error('Erro em delivery-confirmations:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      if (pool) await pool.close();
    }
  },
});
