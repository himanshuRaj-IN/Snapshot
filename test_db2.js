import { sql } from '@vercel/postgres';
async function check() {
  try {
    await sql`UPDATE snapshots SET cl_buffer = 0 WHERE month = 'MARCH' AND year = 2026`;
    console.log("Success");
  } catch (e) {
    console.error(e.message);
  }
}
check();
