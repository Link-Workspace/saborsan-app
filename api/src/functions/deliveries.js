const { app } = require('@azure/functions');
const sql = require('mssql');

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false },
};

const progressMap = { Planejada: 0, Carregando: 25, 'Em rota': 60, Concluída: 100, Cancelada: 0 };

app.http('deliveries', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    let pool;
    try {
      const userId = request.query.get('userId');

      if (request.method === 'GET') {
        if (!userId) return { status: 400, jsonBody: { error: 'userId é obrigatório' } };

        pool = await new sql.ConnectionPool(sqlConfig).connect();

        const sellerResult = await pool.request().query`SELECT id FROM Sellers WHERE userId = ${userId}`;
        if (!sellerResult.recordset.length) return { jsonBody: { deliveries: [] } };
        const sellerId = sellerResult.recordset[0].id;

        // Pedidos elegíveis para nova entrega (Separação ou Pronto)
        if (request.query.get('eligibleOrders') === 'true') {
          const ordersResult = await pool.request().query`
            SELECT id, clientName, city, value, status
            FROM GestaoOrders
            WHERE status IN (N'Separação', N'Pronto')
            ORDER BY id DESC
          `;
          return { jsonBody: { orders: ordersResult.recordset } };
        }

        const deliveriesResult = await pool.request().query`
          SELECT d.id, d.code, d.status, d.route, d.stops_count, d.temperature,
                 d.departure_date, d.arrival_date, d.notes, d.cold_chamber_number,
                 u.name AS driver_name, u.whatsapp AS driver_phone
          FROM Deliveries d
          LEFT JOIN Sellers s ON d.seller_id = s.id
          LEFT JOIN Users u ON s.userId = u.id
          WHERE d.seller_id = ${sellerId}
          ORDER BY d.id DESC
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

        const orderIdsResult = await pool.request().query`
          SELECT delivery_id, order_id
          FROM DeliveryOrders
          WHERE delivery_id IN (SELECT id FROM Deliveries WHERE seller_id = ${sellerId})
        `;

        const deliveries = deliveriesResult.recordset.map((d) => {
          const chamberNum = String(d.cold_chamber_number || 1).padStart(2, '0');
          return {
            id: d.id,
            code: d.code,
            status: d.status || null,
            route: d.route || '',
            vehicle: `Câmara fria ${chamberNum}`,
            stops: d.stops_count || 0,
            temperature: d.temperature != null ? `${parseFloat(d.temperature).toFixed(1)}°C` : null,
            deliveryDate: d.departure_date ? new Date(d.departure_date).toISOString() : null,
            departureDate: d.departure_date ? new Date(d.departure_date).toISOString() : null,
            arrivalDate: d.arrival_date ? new Date(d.arrival_date).toISOString() : null,
            notes: d.notes || '',
            driver: d.driver_name || '',
            driverPhone: d.driver_phone || '',
            progress: progressMap[d.status] ?? 0,
            orderIds: orderIdsResult.recordset
              .filter((o) => o.delivery_id === d.id)
              .map((o) => o.order_id),
            orders: ordersResult.recordset
              .filter((o) => o.delivery_id === d.id)
              .map((o) => ({
                id: o.orderId,
                clientName: o.clientName,
                status: o.orderStatus,
              })),
          };
        });

        return { jsonBody: { deliveries } };
      }

      if (request.method === 'POST') {
        const body = await request.json();
        const { userId: bodyUserId, route, vehicleName, temperature, status, departureDate, arrivalDate, notes, orderIds } = body;
        const uid = bodyUserId || userId;

        if (!uid || !route) {
          return { status: 400, jsonBody: { error: 'userId e route são obrigatórios' } };
        }

        pool = await new sql.ConnectionPool(sqlConfig).connect();

        const sellerResult = await pool.request().query`SELECT id FROM Sellers WHERE userId = ${uid}`;
        if (!sellerResult.recordset.length) {
          return { status: 404, jsonBody: { error: 'Perfil de vendedor não encontrado' } };
        }
        const sellerId = sellerResult.recordset[0].id;

        const codeResult = await pool.request().query`
          SELECT MAX(TRY_CAST(SUBSTRING(code, 3, LEN(code)) AS INT)) AS maxNum
          FROM Deliveries WHERE code LIKE 'R-%'
        `;
        const maxNum = codeResult.recordset[0].maxNum || 0;
        const code = 'R-' + (maxNum + 1);

        const chamberMatch = vehicleName ? vehicleName.match(/\d+/) : null;
        const chamberNum = chamberMatch ? parseInt(chamberMatch[0]) : 1;
        const tempVal = temperature !== undefined && temperature !== '' && temperature !== null
          ? parseFloat(String(temperature).replace('°C', ''))
          : -18.0;
        const statusVal = status || 'Carregando';
        const stopsCount = route.split('→').length;
        const notesVal = notes || '';
        const departureDateVal = departureDate ? new Date(departureDate) : null;
        const arrivalDateVal = arrivalDate ? new Date(arrivalDate) : null;

        const insertResult = await pool.request().query`
          INSERT INTO Deliveries (code, route, seller_id, status, cold_chamber_number, stops_count, temperature, departure_date, arrival_date, notes, updated_at)
          OUTPUT INSERTED.id
          VALUES (${code}, ${route}, ${sellerId}, ${statusVal}, ${chamberNum}, ${stopsCount}, ${tempVal}, ${departureDateVal}, ${arrivalDateVal}, ${notesVal}, GETUTCDATE())
        `;

        const newId = insertResult.recordset[0].id;

        if (Array.isArray(orderIds) && orderIds.length > 0) {
          for (const orderId of orderIds) {
            await pool.request().query`INSERT INTO DeliveryOrders (delivery_id, order_id) VALUES (${newId}, ${orderId})`;
          }
        }

        return { status: 201, jsonBody: { success: true, code, id: newId } };
      }
    } catch (error) {
      context.error('Erro em deliveries:', error);
      return { status: 500, jsonBody: { error: 'Erro interno do servidor' } };
    } finally {
      if (pool) await pool.close();
    }
  },
});
