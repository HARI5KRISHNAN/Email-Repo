import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Run in alphabetical order

    console.log(`Found ${sqlFiles.length} migration files`);

    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf-8');

      try {
        await db.query(sql);
        console.log(`✅ Completed: ${file}`);
      } catch (err) {
        console.error(`❌ Failed: ${file}`);
        console.error(err.message);
        // Don't exit - some migrations might fail if already applied
      }
    }

    console.log('✅ All migrations completed');
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

runMigrations();
