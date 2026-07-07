const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('update-profile', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { userId, name, whatsapp, address, cnpj, establishmentName, invoicePreference, city } = await request.json();

      if (!userId) {
        return { status: 400, jsonBody: { error: 'userId é obrigatório' } };
      }

      await sql.connect(sqlConfig);

      await sql.query`
        UPDATE Users
        SET
          name = COALESCE(${name || null}, name),
          whatsapp = COALESCE(${whatsapp || null}, whatsapp),
          address = ${address || null},
          cnpj = COALESCE(${cnpj || null}, cnpj),
          establishmentName = ${establishmentName || null},
          invoicePreference = COALESCE(${invoicePreference || null}, invoicePreference),
          city = ${city || null}
        WHERE id = ${userId}
      `;

      const result = await sql.query`
        SELECT id, email, whatsapp, isCompany, cnpj, role, name, address, establishmentName, invoicePreference, city
        FROM Users WHERE id = ${userId}
      `;

      return { jsonBody: { user: result.recordset[0] } };
    } catch (error) {
      context.error('Erro na função update-profile:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
