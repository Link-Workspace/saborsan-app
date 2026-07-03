const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('orders', {
  methods: ['GET', 'POST', 'PATCH'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await sql.connect(sqlConfig);

      if (request.method === 'GET') {
        const userId = request.query.get('userId');
        if (!userId) return { status: 400, jsonBody: { error: 'userId é obrigatório' } };

        const result = await sql.query`
          SELECT id, productName, productImage, quantity, status, step,
                 observations, orderDate, deliveryDate, createdAt
          FROM Orders
          WHERE userId = ${userId}
          ORDER BY createdAt DESC
        `;

        return { jsonBody: { orders: result.recordset.map(o => ({
          id: o.id,
          product: o.productName,
          image: o.productImage,
          quantity: o.quantity,
          status: o.status,
          step: o.step,
          observations: o.observations || '',
          orderDate: o.orderDate,
          deliveryDate: o.deliveryDate,
          date: new Date(o.createdAt).toLocaleDateString('pt-BR'),
        })) } };
      }

      if (request.method === 'POST') {
        const body = await request.json();
        const { userId, productId, productName, productImage, quantity, observations } = body;

        if (!userId || !productName) {
          return { status: 400, jsonBody: { error: 'userId e productName são obrigatórios' } };
        }

        const orderId = `SAB-${Math.floor(1000 + Math.random() * 8999)}`;
        const orderDate = new Date().toLocaleDateString('pt-BR');

        await sql.query`
          INSERT INTO Orders (id, userId, productId, productName, productImage, quantity, observations, orderDate)
          VALUES (
            ${orderId}, ${userId}, ${productId || null}, ${productName},
            ${productImage || null}, ${quantity || '1 unidade'},
            ${observations || null}, ${orderDate}
          )
        `;

        return {
          status: 201,
          jsonBody: {
            order: {
              id: orderId,
              product: productName,
              image: productImage,
              quantity: quantity || '1 unidade',
              status: 'Solicitado',
              step: 1,
              observations: observations || '',
              orderDate,
              deliveryDate: 'A confirmar',
              date: 'Agora',
            }
          }
        };
      }
      if (request.method === 'PATCH') {
        const { orderId, status, step } = await request.json();
        if (!orderId) return { status: 400, jsonBody: { error: 'orderId é obrigatório' } };

        await sql.query`
          UPDATE Orders SET status = ${status}, step = ${step}
          WHERE id = ${orderId}
        `;
        return { jsonBody: { success: true } };
      }
    } catch (error) {
      context.error('Erro na função orders:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
