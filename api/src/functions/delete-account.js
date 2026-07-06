const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('delete-account', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const userId = request.query.get('userId');
      if (!userId) return { status: 400, jsonBody: { error: 'userId é obrigatório' } };

      await sql.connect(sqlConfig);

      // Deletar em cascata na ordem correta
      // 1. Itens de vendas do vendedor
      await sql.query`
        DELETE FROM SaleItems WHERE saleId IN (
          SELECT s.id FROM Sales s
          INNER JOIN Sellers sel ON sel.id = s.sellerId
          WHERE sel.userId = ${userId}
        )
      `;
      // 2. Vendas do vendedor
      await sql.query`
        DELETE FROM Sales WHERE sellerId IN (SELECT id FROM Sellers WHERE userId = ${userId})
      `;
      // 3. Alertas do vendedor
      await sql.query`
        DELETE FROM SellerAlerts WHERE sellerId IN (SELECT id FROM Sellers WHERE userId = ${userId})
      `;
      // 4. Perfil do vendedor
      await sql.query`DELETE FROM Sellers WHERE userId = ${userId}`;

      // 5. Mensagens do usuário
      await sql.query`DELETE FROM Messages WHERE userId = ${userId}`;

      // 6. Pedidos do usuário
      await sql.query`DELETE FROM Orders WHERE userId = ${userId}`;

      // 7. Configurações
      await sql.query`DELETE FROM UserSettings WHERE userId = ${userId}`;

      // 8. Usuário
      await sql.query`DELETE FROM Users WHERE id = ${userId}`;

      return { jsonBody: { success: true } };
    } catch (error) {
      context.error('Erro na função delete-account:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
