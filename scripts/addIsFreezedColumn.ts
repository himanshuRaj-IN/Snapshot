import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
  console.log('Adding is_freezed column to snapshots table...');
  try {
    await sql`ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS is_freezed BOOLEAN DEFAULT FALSE;`;
    console.log('✅ Column is_freezed added successfully.');
  } catch (error) {
    console.error('❌ Failed to add column:', error);
  }
}

migrate();
