require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('node:path');

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnv = requiredEnv.filter(name => !process.env[name]);
if (missingEnv.length) {
  console.error(`Missing required database environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

const app = express();
const root = __dirname;
const query = sql => pool.query(sql).then(([rows]) => rows);

app.use('/images', express.static(path.join(root, 'public', 'images')));

app.get('/api/shelter', async (req, res) => {
  try {
    const [cats, adoptions, veterinarians, inventory, catCount, adoptionCount, vetCount, inventoryCount] = await Promise.all([
      query('SELECT id, name, gender, age, breed, health, cat_character, recommendations, date_arrival AS arrival FROM cats ORDER BY id DESC'),
      query('SELECT adopters.adopterID, adopters.first_name, adopters.last_name, adopters.catID, adopters.adoption_date, cats.name AS cat_name FROM adopters INNER JOIN cats ON adopters.catID = cats.id ORDER BY adopters.adoption_date DESC'),
      query('SELECT id, name, age, work_duration, cats FROM veterinarians ORDER BY id'),
      query('SELECT id, name, type, quantity, unit FROM inventory ORDER BY name'),
      query('SELECT COUNT(*) AS total FROM cats'),
      query('SELECT COUNT(*) AS total FROM adopters'),
      query('SELECT COUNT(*) AS total FROM veterinarians'),
      query('SELECT COUNT(*) AS total FROM inventory')
    ]);

    res.json({
      cats,
      adoptions,
      veterinarians,
      inventory,
      stats: {
        cats: catCount[0].total,
        adoptions: adoptionCount[0].total,
        vets: vetCount[0].total,
        inventory: inventoryCount[0].total
      }
    });
  } catch (error) {
    console.error('Shelter database query failed:', error.message);
    res.status(503).json({error: 'Shelter data is temporarily unavailable.'});
  }
});

app.get('/styles.css', (req, res) => res.sendFile(path.join(root, 'styles.css')));
app.get('/app.js', (req, res) => res.sendFile(path.join(root, 'app.js')));
app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Good Mews is available at http://localhost:${port}`));
