# Good Mews

A static frontend served by a small Express server. Shelter records are read from MySQL on the server and sent to the browser through `GET /api/shelter`; database credentials are never sent to the client.

## Setup

1. Install Node.js 18 or later.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and fill in `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` for your existing database. Keep `.env` private; it is ignored by Git.
4. Start the site with `npm start` and open `http://localhost:3000`.

The server runs read-only `SELECT` queries. It does not create, alter, or insert into tables. Adoption records use an inner join from `adopters.catID` to `cats.id`; only adopter names and adoption details are returned to the browser, not phone numbers or email addresses.

## Schema notes

The supplied tables do not contain cat photos, veterinarian photos, veterinarian specialties, or structured adoption-fit fields. Photos are presentation-only files under `public/images/cats/` (`cat-<id>.jpg`) and `public/images/vets/` (`vet-<id>.jpg`); missing cat and veterinarian photos fall back to `cat-4.jpg` and `vet-4.jpg`, respectively. Shelter facts are loaded from MySQL. The age and fit controls continue to work from the available integer age and text fields. Low inventory is visually marked at quantities of 10 or less.
