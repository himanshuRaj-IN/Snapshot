import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    const res = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'snapshots'
    `;
    console.log(res.rows.map(r => r.column_name).join(', '));
  } catch (e) {
    console.error(e);
  }
}
check();
