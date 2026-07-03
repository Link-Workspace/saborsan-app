const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

app.http('products', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const category = request.query.get('category');

      await sql.connect(sqlConfig);

      const result = category
        ? await sql.query`
            SELECT id, name, category, price, badge, description, details,
                   packaging, conservation, preparation, idealFor,
                   availableQuantity, imageUrl
            FROM Products
            WHERE active = 1 AND category = ${category}
            ORDER BY name`
        : await sql.query`
            SELECT id, name, category, price, badge, description, details,
                   packaging, conservation, preparation, idealFor,
                   availableQuantity, imageUrl
            FROM Products
            WHERE active = 1
            ORDER BY name`;

      return { jsonBody: { products: result.recordset } };
    } catch (error) {
      context.error('Erro na função products:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
