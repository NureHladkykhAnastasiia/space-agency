const express = require('express');
const cors = require('cors');
const path = require('path');
const { sql, getConnection } = require('./db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ПУНКТ 1: Виведення інформації з пов'язаних таблиць (Місії + Космодроми)
app.get('/api/missions', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                m.Mission_ID, 
                m.MissionName, 
                m.Destination, 
                m.LaunchDate, 
                sp.Name AS SpaceportName,
                sp.Country AS SpaceportCountry
            FROM Missions m
            LEFT JOIN Spaceports sp ON m.Spaceport_ID = sp.Spaceport_ID
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ПУНКТ 2 & 4: Виконання збереженої процедури з обробкою помилок бази даних
app.post('/api/spaceships', async (req, res) => {
    try {
        const { shipId, name, model, capacity } = req.body;
        const pool = await getConnection();
        
        await pool.request()
            .input('ShipID', sql.Int, shipId)
            .input('Name', sql.VarChar, name)
            .input('Model', sql.VarChar, model)
            .input('Capacity', sql.Int, capacity)
            .execute('usp_InsertSpaceship');

        res.status(201).json({ message: 'Космічний корабель успішно зареєстровано через процедуру!' });
    } catch (err) {
        // ПУНКТ 4: Передаємо користувацьку помилку з БД на клієнт
        res.status(400).json({ error: "Помилка бази даних: " + err.message });
    }
});

// ПУНКТ 3а: Скалярна функція (підрахунок астронавтів за ID)
app.get('/api/astronauts/count/:maxId', async (req, res) => {
    try {
        const maxId = req.params.maxId;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('MaxID', sql.Int, maxId)
            .query('SELECT dbo.GetAstronautsCount(@MaxID) AS CountResult');

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ПУНКТ 3б: Таблична функція (астронавти за ID місії)
app.get('/api/missions/:missionId/astronauts', async (req, res) => {
    try {
        const missionId = req.params.missionId;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('MissionID', sql.Int, missionId)
            .query('SELECT * FROM dbo.GetAstronautsByMission(@MissionID)');

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/astronauts/all', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Astronauts');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/spaceships/all', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Spaceships');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});