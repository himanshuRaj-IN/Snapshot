import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const qMonth = (req.query.month as string) || 'MARCH';
    const qYear = parseInt((req.query.year as string) || '2026', 10);

    try {
      const { rows } = await sql`SELECT * FROM transactions WHERE month = ${qMonth} AND year = ${qYear}`;
      const expenses = rows.map(r => ({
        category: r.category,
        name: r.name,
        amount: Number(r.amount)
      }));
      return res.status(200).json(expenses);
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
      
      const expenses = data.expenses || [];

      // Wipe current and write new
      await sql`DELETE FROM transactions WHERE month = ${qMonth} AND year = ${qYear}`;
      
      for (const exp of expenses) {
        if (exp.amount > 0 || exp.name) {
          await sql`
            INSERT INTO transactions (month, year, category, name, amount)
            VALUES (${qMonth}, ${qYear}, ${exp.category}, ${exp.name || ''}, ${exp.amount || 0})
          `;
        }
      }
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'DB Write Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
