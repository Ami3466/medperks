import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { pool, query } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.sql');

const sql = await fs.readFile(schemaPath, 'utf8');
await query(sql);
await pool.end();

console.log('Database schema is up to date.');
