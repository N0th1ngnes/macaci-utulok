const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');

const app = express();
const root = __dirname;
const dataDirectory = path.join(root, 'data');
const readJsonArray = async name => {
  const contents = await fs.readFile(path.join(dataDirectory, name), 'utf8');
  const records = JSON.parse(contents);
  if (!Array.isArray(records)) throw new TypeError(`${name} must contain a JSON array`);
  return records;
};

app.use('/images', express.static(path.join(root, 'public', 'images')));

app.get('/api/shelter', async (req, res) => {
  try {
    const [cats, adoptions, veterinarians, inventory] = await Promise.all([
      readJsonArray('cats.json'),
      readJsonArray('adopters.json'),
      readJsonArray('veterinarians.json'),
      readJsonArray('inventory.json')
    ]);

    res.json({
      cats,
      adoptions,
      veterinarians,
      inventory,
      stats: {
        cats: cats.length,
        adoptions: adoptions.length,
        vets: veterinarians.length,
        inventory: inventory.length
      }
    });
  } catch (error) {
    console.error('Shelter JSON data could not be loaded:', error.message);
    res.status(503).json({error: 'Shelter data is unavailable. Run npm run export-data locally and commit the generated JSON files.'});
  }
});

app.get('/styles.css', (req, res) => res.sendFile(path.join(root, 'styles.css')));
app.get('/app.js', (req, res) => res.sendFile(path.join(root, 'app.js')));
app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Good Mews is available at http://localhost:${port}`));
