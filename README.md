# Good Mews

A static frontend served by Express. The public website reads committed JSON files through `GET /api/shelter` and does not connect to MySQL. `export-data.js` is a local-only utility that you run manually to refresh those JSON files from your private MySQL database.

## Setup

1. Install Node.js 18 or later.
2. Install dependencies with `npm install`.
3. Start the public website with `npm start` and open `http://localhost:3000`. It reads `data/cats.json`, `data/adopters.json`, `data/veterinarians.json`, and `data/inventory.json` and needs no `.env` file or database service.

## Refresh exported data locally

1. Copy `.env.example` to `.env` and enter your local MySQL connection settings. `.env` is ignored by Git.
2. Run `npm run export-data` manually on your computer. This local-only script performs read-only `SELECT` queries and updates the four JSON files in `data/`. The adopter export keeps the cat relationship and `cat_name` from the API JOIN without exporting contact details.
3. Review the JSON changes, then commit and push them. The hosting platform deploys the JSON snapshots; it never runs the exporter or connects to MySQL.

`mysql2` and `dotenv` are development dependencies used only by the export command. `npm start` only runs `server.js` and does not import either package.

## Schema notes

The supplied tables do not contain cat photos, veterinarian photos, veterinarian specialties, or structured adoption-fit fields. Photos are presentation-only files under `public/images/cats/` (`cat-<id>.jpg`) and `public/images/vets/` (`vet-<id>.jpg`); missing cat photos use `cat-4.jpg`, and missing vet portraits use the same cat fallback. Published shelter facts come from the committed JSON exports. The age and fit controls continue to work from the available integer age and text fields. Low inventory is visually marked at quantities of 10 or less.
