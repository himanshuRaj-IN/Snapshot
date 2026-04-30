import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    if (req.query.list === 'true') {
      try {
        const { rows } = await sql`SELECT month, year FROM snapshots ORDER BY year DESC, month DESC`;
        const list = rows.map(r => ({
          key: `${String(r.month).toUpperCase()}_${r.year}`,
          label: `${r.month} ${r.year}`
        }));
        return res.status(200).json(list);
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'DB Read Error' });
      }
    }

    const qMonth = (req.query.month as string) || 'MARCH';
    const qYear = parseInt((req.query.year as string) || '2026', 10);

    try {
      const { rows } = await sql`SELECT * FROM snapshots WHERE month = ${qMonth} AND year = ${qYear} LIMIT 1`;
      
      if (rows.length === 0) {
        return res.status(200).json(null); // Return null so frontend can fallback to sampleData
      }
      
      const db = rows[0];
      
      // map income
      const income = [];
      for (let i = 1; i <= 5; i++) {
        if (db[`income_${i}_label`]) {
          income.push({ label: db[`income_${i}_label`], amount: Number(db[`income_${i}_amount`]) });
        }
      }

      // map investments
      const investments = [];
      for (let i = 1; i <= 10; i++) {
        if (db[`inv_${i}_name`]) {
          investments.push({ 
            name: db[`inv_${i}_name`], 
            actual: Number(db[`inv_${i}_actual`]), 
            expected: db[`inv_${i}_expected`] ? Number(db[`inv_${i}_expected`]) : null 
          });
        }
      }

      const opChecking1 = Number(db.op_checking_1 ?? db.op_checking1 ?? 0);
      const clChecking1 = Number(db.cl_checking_1 ?? db.cl_checking1 ?? 0);
      const distChecking1 = Number(db.dist_checking1 ?? db.dist_checking_1 ?? 0);

      const snapshot = {
        month: `${qMonth} ${qYear}`,
        opening: {
          investment: Number(db.op_investment),
          saving: Number(db.op_saving),
          checking: Number(db.op_checking) + opChecking1,
          creditGiven: Number(db.op_credit_given),
          debtTaken: Number(db.op_debt_taken)
        },
        closing: {
          investment: Number(db.cl_investment),
          saving: Number(db.cl_saving),
          checking: Number(db.cl_checking) + clChecking1,
          creditGiven: Number(db.cl_credit_given),
          debtTaken: Number(db.cl_debt_taken)
        },
        distributions: [
          { label: 'Investment', amount: Number(db.dist_investment) },
          { label: 'Saving', amount: Number(db.dist_saving) },
          { label: 'Buffer', amount: Number(db.dist_checking) },
          { label: 'Buffer-C', amount: distChecking1 },
          { label: 'Credit Given', amount: Number(db.dist_credit_given) },
          { label: 'Credit Repaid', amount: Number(db.dist_credit_repaid) },
          { label: 'Debt Taken', amount: Number(db.dist_debt_taken) },
          { label: 'Debt Repaid', amount: Number(db.dist_debt_repaid) },
          { label: 'For Expense', amount: Number(db.dist_for_expense) }
        ],
        income,
        investments,
        expenseBudgets: {
          budget: Number(db.budget),
          budgetSmt: Number(db.budget_smt),
          budgetUfs: Number(db.budget_ufs),
          inSettlement: Number(db.in_settlement),
          settled: Number(db.settled)
        },
        totalIncome: income.reduce((s, i) => s + i.amount, 0),
        totalDistribution: [
          Number(db.dist_investment), Number(db.dist_saving), Number(db.dist_checking), distChecking1,
          Number(db.dist_credit_given), Number(db.dist_credit_repaid), Number(db.dist_debt_taken),
          Number(db.dist_debt_repaid), Number(db.dist_for_expense)
        ].reduce((a, b) => a + b, 0),
        expenseUnaccounted: Number(db.unaccounted),
        expenses: [],
        credits: [],
        isFreezed: !!db.is_freezed
      };
      
      return res.status(200).json(snapshot);
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
      
      const op = data.opening;
      const cl = data.closing;
      const bd = data.expenseBudgets;
      
      const getDist = (lbl: string) => {
        return data.distributions.find((d: any) =>
          d.label === lbl ||
          (lbl === 'Buffer' && d.label === 'Checking') ||
          (lbl === 'Buffer-C' && d.label === 'Checking-C')
        )?.amount || 0;
      };
      
      // flatten income
      const incLabel: string[] = [];
      const incAmt: number[] = [];
      for (let i = 0; i < 5; i++) {
        incLabel.push(data.income[i] ? data.income[i].label : null);
        incAmt.push(data.income[i] ? data.income[i].amount : null);
      }

      // flatten investments
      const invName: string[] = [];
      const invAct: number[] = [];
      const invExp: (number | null)[] = [];
      for (let i = 0; i < 10; i++) {
        invName.push(data.investments[i] ? data.investments[i].name : null);
        invAct.push(data.investments[i] ? data.investments[i].actual : null);
        invExp.push(data.investments[i] ? data.investments[i].expected : null);
      }

      await sql`
        INSERT INTO snapshots (
          month, year,
          op_investment, op_saving, op_checking, op_credit_given, op_debt_taken,
          cl_investment, cl_saving, cl_checking, cl_credit_given, cl_debt_taken,
          dist_investment, dist_saving, dist_checking, dist_checking1, dist_credit_given, dist_credit_repaid, dist_debt_taken, dist_debt_repaid, dist_for_expense,
          budget, budget_smt, budget_ufs, in_settlement, settled, unaccounted,
          income_1_label, income_1_amount, income_2_label, income_2_amount, income_3_label, income_3_amount, income_4_label, income_4_amount, income_5_label, income_5_amount,
          inv_1_name, inv_1_actual, inv_1_expected, inv_2_name, inv_2_actual, inv_2_expected, inv_3_name, inv_3_actual, inv_3_expected, inv_4_name, inv_4_actual, inv_4_expected, inv_5_name, inv_5_actual, inv_5_expected,
          inv_6_name, inv_6_actual, inv_6_expected, inv_7_name, inv_7_actual, inv_7_expected, inv_8_name, inv_8_actual, inv_8_expected, inv_9_name, inv_9_actual, inv_9_expected, inv_10_name, inv_10_actual, inv_10_expected,
          is_freezed
        ) VALUES (
          ${qMonth}, ${qYear},
          ${op.investment}, ${op.saving}, ${op.checking}, ${op.creditGiven}, ${op.debtTaken},
          ${cl.investment}, ${cl.saving}, ${cl.checking}, ${cl.creditGiven}, ${cl.debtTaken},
          ${getDist('Investment')}, ${getDist('Saving')}, ${getDist('Buffer')}, ${getDist('Buffer-C')}, ${getDist('Credit Given')}, ${getDist('Credit Repaid')}, ${getDist('Debt Taken')}, ${getDist('Debt Repaid')}, ${getDist('For Expense')},
          ${bd.budget}, ${bd.budgetSmt}, ${bd.budgetUfs}, ${bd.inSettlement}, ${bd.settled}, ${data.expenseUnaccounted},
          ${incLabel[0]}, ${incAmt[0]}, ${incLabel[1]}, ${incAmt[1]}, ${incLabel[2]}, ${incAmt[2]}, ${incLabel[3]}, ${incAmt[3]}, ${incLabel[4]}, ${incAmt[4]},
          ${invName[0]}, ${invAct[0]}, ${invExp[0]}, ${invName[1]}, ${invAct[1]}, ${invExp[1]}, ${invName[2]}, ${invAct[2]}, ${invExp[2]}, ${invName[3]}, ${invAct[3]}, ${invExp[3]}, ${invName[4]}, ${invAct[4]}, ${invExp[4]},
          ${invName[5]}, ${invAct[5]}, ${invExp[5]}, ${invName[6]}, ${invAct[6]}, ${invExp[6]}, ${invName[7]}, ${invAct[7]}, ${invExp[7]}, ${invName[8]}, ${invAct[8]}, ${invExp[8]}, ${invName[9]}, ${invAct[9]}, ${invExp[9]},
          ${data.isFreezed || false}
        )
        ON CONFLICT (month, year) DO UPDATE SET
          op_investment=EXCLUDED.op_investment, op_saving=EXCLUDED.op_saving, op_checking=EXCLUDED.op_checking, op_credit_given=EXCLUDED.op_credit_given, op_debt_taken=EXCLUDED.op_debt_taken,
          cl_investment=EXCLUDED.cl_investment, cl_saving=EXCLUDED.cl_saving, cl_checking=EXCLUDED.cl_checking, cl_credit_given=EXCLUDED.cl_credit_given, cl_debt_taken=EXCLUDED.cl_debt_taken,
          dist_investment=EXCLUDED.dist_investment, dist_saving=EXCLUDED.dist_saving, dist_checking=EXCLUDED.dist_checking, dist_checking1=EXCLUDED.dist_checking1, dist_credit_given=EXCLUDED.dist_credit_given, dist_credit_repaid=EXCLUDED.dist_credit_repaid, dist_debt_taken=EXCLUDED.dist_debt_taken, dist_debt_repaid=EXCLUDED.dist_debt_repaid, dist_for_expense=EXCLUDED.dist_for_expense,
          budget=EXCLUDED.budget, budget_smt=EXCLUDED.budget_smt, budget_ufs=EXCLUDED.budget_ufs, in_settlement=EXCLUDED.in_settlement, settled=EXCLUDED.settled, unaccounted=EXCLUDED.unaccounted,
          income_1_label=EXCLUDED.income_1_label, income_1_amount=EXCLUDED.income_1_amount, income_2_label=EXCLUDED.income_2_label, income_2_amount=EXCLUDED.income_2_amount, income_3_label=EXCLUDED.income_3_label, income_3_amount=EXCLUDED.income_3_amount, income_4_label=EXCLUDED.income_4_label, income_4_amount=EXCLUDED.income_4_amount, income_5_label=EXCLUDED.income_5_label, income_5_amount=EXCLUDED.income_5_amount,
          inv_1_name=EXCLUDED.inv_1_name, inv_1_actual=EXCLUDED.inv_1_actual, inv_1_expected=EXCLUDED.inv_1_expected, inv_2_name=EXCLUDED.inv_2_name, inv_2_actual=EXCLUDED.inv_2_actual, inv_2_expected=EXCLUDED.inv_2_expected, inv_3_name=EXCLUDED.inv_3_name, inv_3_actual=EXCLUDED.inv_3_actual, inv_3_expected=EXCLUDED.inv_3_expected, inv_4_name=EXCLUDED.inv_4_name, inv_4_actual=EXCLUDED.inv_4_actual, inv_4_expected=EXCLUDED.inv_4_expected, inv_5_name=EXCLUDED.inv_5_name, inv_5_actual=EXCLUDED.inv_5_actual, inv_5_expected=EXCLUDED.inv_5_expected,
          inv_6_name=EXCLUDED.inv_6_name, inv_6_actual=EXCLUDED.inv_6_actual, inv_6_expected=EXCLUDED.inv_6_expected, inv_7_name=EXCLUDED.inv_7_name, inv_7_actual=EXCLUDED.inv_7_actual, inv_7_expected=EXCLUDED.inv_7_expected, inv_8_name=EXCLUDED.inv_8_name, inv_8_actual=EXCLUDED.inv_8_actual, inv_8_expected=EXCLUDED.inv_8_expected, inv_9_name=EXCLUDED.inv_9_name, inv_9_actual=EXCLUDED.inv_9_actual, inv_9_expected=EXCLUDED.inv_9_expected, inv_10_name=EXCLUDED.inv_10_name, inv_10_actual=EXCLUDED.inv_10_actual, inv_10_expected=EXCLUDED.inv_10_expected,
          is_freezed = snapshots.is_freezed OR EXCLUDED.is_freezed,
          updated_at=now();
      `;
      
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'DB Write Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
