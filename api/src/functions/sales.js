const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('sales', {
  methods: ['POST', 'GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await sql.connect(sqlConfig);

      if (request.method === 'GET') {
        const userId = request.query.get('userId');
        if (!userId) return { status: 400, jsonBody: { error: 'userId é obrigatório' } };

        const result = await sql.query`
          SELECT s.id, s.payment, s.observations, s.saleDate, s.createdAt,
                 c.name AS clientName, ci.name AS cityName
          FROM Sales s
          LEFT JOIN Clients c ON c.id = s.clientId
          LEFT JOIN Cities ci ON ci.id = c.cityId
          INNER JOIN Sellers sel ON sel.id = s.sellerId
          WHERE sel.userId = ${userId}
          ORDER BY s.createdAt DESC
        `;

        const salesIds = result.recordset.map(s => s.id);
        let items = [];
        if (salesIds.length > 0) {
          const itemsResult = await sql.query`
            SELECT saleId, productName, quantity FROM SaleItems
            WHERE saleId IN (SELECT id FROM Sales WHERE sellerId IN (
              SELECT id FROM Sellers WHERE userId = ${userId}
            ))
          `;
          items = itemsResult.recordset;
        }

        const sales = result.recordset.map(s => ({
          ...s,
          items: items.filter(i => i.saleId === s.id),
        }));

        return { jsonBody: { sales } };
      }

      if (request.method === 'POST') {
        const { userId, clientId, clientName, payment, observations, saleDate, items } = await request.json();

        if (!userId || !payment || !items?.length) {
          return { status: 400, jsonBody: { error: 'userId, payment e items são obrigatórios' } };
        }

        // Buscar sellerId a partir do userId
        const sellerResult = await sql.query`SELECT id FROM Sellers WHERE userId = ${userId}`;
        if (sellerResult.recordset.length === 0) {
          return { status: 404, jsonBody: { error: 'Perfil de vendedor não encontrado' } };
        }
        const sellerId = sellerResult.recordset[0].id;

        const saleId = `SAB-${Math.floor(1000 + Math.random() * 8999)}`;
        const date = saleDate || new Date().toLocaleDateString('pt-BR');

        await sql.query`
          INSERT INTO Sales (id, sellerId, clientId, payment, observations, saleDate)
          VALUES (${saleId}, ${sellerId}, ${clientId || null}, ${payment}, ${observations || null}, ${date})
        `;

        for (const item of items) {
          await sql.query`
            INSERT INTO SaleItems (saleId, productName, quantity)
            VALUES (${saleId}, ${item.name}, ${item.quantity})
          `;
        }

        // Atualizar soldToday do vendedor
        const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
        await sql.query`
          UPDATE Sellers SET soldToday = soldToday + ${totalItems * 100}
          WHERE id = ${sellerId}
        `;

        return { status: 201, jsonBody: { sale: { id: saleId, client: clientName, payment, date } } };
      }
    } catch (error) {
      context.error('Erro na função sales:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
