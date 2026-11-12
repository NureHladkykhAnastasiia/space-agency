const sql = require('mssql');

const config = {
    server: '127.0.0.1',
    port: 1433,
    database: 'SpaceAgency',
    user: 'sa', 
    password: 'Password123', 
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    connectionTimeout: 10000,
    requestTimeout: 10000
};

async function getConnection() {
    try {
        const pool = await sql.connect(config);
        return pool;
    } catch (err) {
        console.log('Помилка підключення до БД: ', err);
        throw err;
    }
}

module.exports = {
    sql,
    getConnection
};