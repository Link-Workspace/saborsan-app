const { app } = require('@azure/functions');
const sql = require('mssql');
const bcrypt = require('bcryptjs');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

app.http('register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { email, password, whatsapp, isCompany, cnpj, role } = await request.json();

      if (!email || !password || !whatsapp) {
        return { status: 400, jsonBody: { error: 'email, senha e whatsapp são obrigatórios' } };
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { status: 400, jsonBody: { error: 'E-mail inválido' } };
      }

      if (password.length < 6) {
        return { status: 400, jsonBody: { error: 'A senha deve ter no mínimo 6 caracteres' } };
      }

      const passwordHash = await bcrypt.hash(password, 10);

      await sql.connect(sqlConfig);

      const existing = await sql.query`SELECT id FROM Users WHERE email = ${email.toLowerCase()}`;
      if (existing.recordset.length > 0) {
        return { status: 409, jsonBody: { error: 'Este e-mail já está cadastrado' } };
      }

      const result = await sql.query`
        INSERT INTO Users (email, passwordHash, whatsapp, isCompany, cnpj, role)
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.whatsapp, INSERTED.isCompany, INSERTED.cnpj, INSERTED.role
        VALUES (
          ${email.toLowerCase()},
          ${passwordHash},
          ${whatsapp},
          ${isCompany ? 1 : 0},
          ${cnpj || null},
          ${role === 'seller' ? 'seller' : 'client'}
        )
      `;

      const user = result.recordset[0];
      return { status: 201, jsonBody: { user } };
    } catch (error) {
      context.error('Erro na função register:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      await sql.close();
    }
  },
});
