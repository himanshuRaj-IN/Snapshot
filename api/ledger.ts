import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const qMonth = (req.query.month as string) || 'MARCH';
    const qYear = parseInt((req.query.year as string) || '2026', 10);

    try {
      const { rows } = await sql`SELECT * FROM credit_ledger WHERE month = ${qMonth} AND year = ${qYear}`;
      const credits = rows.map(r => ({
        entity: r.entity,
        amount: Number(r.amount),
        lentOrOwe: Number(r.lent_or_owe),
        settled: Number(r.settled),
        borrowed: Number(r.borrowed)
      }));
      return res.status(200).json(credits);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'DB Read Error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      const [qMonth, qYearStr] = data.month.split(' ');
      const qYear = parseInt(qYearStr, 10);
      
      const credits = data.credits || [];

      // Wipe current and write new
      await sql`DELETE FROM credit_ledger WHERE month = ${qMonth} AND year = ${qYear}`;
      
      for (const cred of credits) {
        await sql`
          INSERT INTO credit_ledger (month, year, entity, amount, lent_or_owe, settled, borrowed)
          VALUES (${qMonth}, ${qYear}, ${cred.entity}, ${cred.amount}, ${cred.lentOrOwe}, ${cred.settled}, ${cred.borrowed})
        `;
      }
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'DB Write Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
