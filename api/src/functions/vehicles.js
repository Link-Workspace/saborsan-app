const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('vehicles', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    let pool;
    try {
      pool = await new sql.ConnectionPool(sqlConfig).connect();
      const result = await pool.request().query`
        SELECT id, name, plate FROM Vehicles ORDER BY name ASC
      `;
      return { jsonBody: { vehicles: result.recordset } };
    } catch (error) {
      context.error('Erro em vehicles:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      if (pool) await pool.close();
    }
  },
});
