import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import { MAR_2026 } from '../src/data/sampleData';

dotenv.config({ path: '.env.local' });

async function seedDB() {
  console.log('Seeding Neon DB with sample data...');
  try {
    const data = MAR_2026;
    const [qMonth, qYearStr] = data.month.split(' ');
    const qYear = parseInt(qYearStr, 10);
    
    const op = data.opening;
    const cl = data.closing;
    const bd = data.expenseBudgets;
    
    const getDist = (lbl: string) => data.distributions.find((d: any) => d.label === lbl)?.amount || 0;
    
    // flatten income
    const incLabel: string[] = [];
    const incAmt: number[] = [];
    for (let i = 0; i < 5; i++) {
      incLabel.push(data.income[i] ? data.income[i].label : null as any);
      incAmt.push(data.income[i] ? data.income[i].amount : null as any);
    }

    // flatten investments
    const invName: string[] = [];
    const invAct: number[] = [];
    const invExp: (number | null)[] = [];
    for (let i = 0; i < 10; i++) {
      invName.push(data.investments[i] ? data.investments[i].name : null as any);
      invAct.push(data.investments[i] ? data.investments[i].actual : null as any);
      invExp.push(data.investments[i] ? data.investments[i].expected : null as any);
    }

    await sql`
      INSERT INTO snapshots (
        month, year,
        op_investment, op_saving, op_checking, op_credit_given, op_debt_taken,
        cl_investment, cl_saving, cl_checking, cl_credit_given, cl_debt_taken,
        dist_investment, dist_saving, dist_checking, dist_credit_given, dist_credit_repaid, dist_debt_taken, dist_debt_repaid, dist_for_expense,
        budget, budget_smt, budget_ufs, in_settlement, settled, unaccounted,
        income_1_label, income_1_amount, income_2_label, income_2_amount, income_3_label, income_3_amount, income_4_label, income_4_amount, income_5_label, income_5_amount,
        inv_1_name, inv_1_actual, inv_1_expected, inv_2_name, inv_2_actual, inv_2_expected, inv_3_name, inv_3_actual, inv_3_expected, inv_4_name, inv_4_actual, inv_4_expected, inv_5_name, inv_5_actual, inv_5_expected,
        inv_6_name, inv_6_actual, inv_6_expected, inv_7_name, inv_7_actual, inv_7_expected, inv_8_name, inv_8_actual, inv_8_expected, inv_9_name, inv_9_actual, inv_9_expected, inv_10_name, inv_10_actual, inv_10_expected
      ) VALUES (
        ${qMonth}, ${qYear},
        ${op.investment}, ${op.saving}, ${op.checking}, ${op.creditGiven}, ${op.debtTaken},
        ${cl.investment}, ${cl.saving}, ${cl.checking}, ${cl.creditGiven}, ${cl.debtTaken},
        ${getDist('Investment')}, ${getDist('Saving')}, ${getDist('Checking')}, ${getDist('Credit Given')}, ${getDist('Credit Repaid')}, ${getDist('Debt Taken')}, ${getDist('Debt Repaid')}, ${getDist('For Expense')},
        ${bd.budget}, ${bd.budgetSmt}, ${bd.budgetUfs}, ${bd.inSettlement}, ${bd.settled}, ${data.expenseUnaccounted},
        ${incLabel[0]}, ${incAmt[0]}, ${incLabel[1]}, ${incAmt[1]}, ${incLabel[2]}, ${incAmt[2]}, ${incLabel[3]}, ${incAmt[3]}, ${incLabel[4]}, ${incAmt[4]},
        ${invName[0]}, ${invAct[0]}, ${invExp[0]}, ${invName[1]}, ${invAct[1]}, ${invExp[1]}, ${invName[2]}, ${invAct[2]}, ${invExp[2]}, ${invName[3]}, ${invAct[3]}, ${invExp[3]}, ${invName[4]}, ${invAct[4]}, ${invExp[4]},
        ${invName[5]}, ${invAct[5]}, ${invExp[5]}, ${invName[6]}, ${invAct[6]}, ${invExp[6]}, ${invName[7]}, ${invAct[7]}, ${invExp[7]}, ${invName[8]}, ${invAct[8]}, ${invExp[8]}, ${invName[9]}, ${invAct[9]}, ${invExp[9]}
      )
      ON CONFLICT (month, year) DO UPDATE SET
        op_investment=EXCLUDED.op_investment, op_saving=EXCLUDED.op_saving, op_checking=EXCLUDED.op_checking, op_credit_given=EXCLUDED.op_credit_given, op_debt_taken=EXCLUDED.op_debt_taken,
        cl_investment=EXCLUDED.cl_investment, cl_saving=EXCLUDED.cl_saving, cl_checking=EXCLUDED.cl_checking, cl_credit_given=EXCLUDED.cl_credit_given, cl_debt_taken=EXCLUDED.cl_debt_taken,
        dist_investment=EXCLUDED.dist_investment, dist_saving=EXCLUDED.dist_saving, dist_checking=EXCLUDED.dist_checking, dist_credit_given=EXCLUDED.dist_credit_given, dist_credit_repaid=EXCLUDED.dist_credit_repaid, dist_debt_taken=EXCLUDED.dist_debt_taken, dist_debt_repaid=EXCLUDED.dist_debt_repaid, dist_for_expense=EXCLUDED.dist_for_expense,
        budget=EXCLUDED.budget, budget_smt=EXCLUDED.budget_smt, budget_ufs=EXCLUDED.budget_ufs, in_settlement=EXCLUDED.in_settlement, settled=EXCLUDED.settled, unaccounted=EXCLUDED.unaccounted,
        income_1_label=EXCLUDED.income_1_label, income_1_amount=EXCLUDED.income_1_amount, income_2_label=EXCLUDED.income_2_label, income_2_amount=EXCLUDED.income_2_amount, income_3_label=EXCLUDED.income_3_label, income_3_amount=EXCLUDED.income_3_amount, income_4_label=EXCLUDED.income_4_label, income_4_amount=EXCLUDED.income_4_amount, income_5_label=EXCLUDED.income_5_label, income_5_amount=EXCLUDED.income_5_amount,
        inv_1_name=EXCLUDED.inv_1_name, inv_1_actual=EXCLUDED.inv_1_actual, inv_1_expected=EXCLUDED.inv_1_expected, inv_2_name=EXCLUDED.inv_2_name, inv_2_actual=EXCLUDED.inv_2_actual, inv_2_expected=EXCLUDED.inv_2_expected, inv_3_name=EXCLUDED.inv_3_name, inv_3_actual=EXCLUDED.inv_3_actual, inv_3_expected=EXCLUDED.inv_3_expected, inv_4_name=EXCLUDED.inv_4_name, inv_4_actual=EXCLUDED.inv_4_actual, inv_4_expected=EXCLUDED.inv_4_expected, inv_5_name=EXCLUDED.inv_5_name, inv_5_actual=EXCLUDED.inv_5_actual, inv_5_expected=EXCLUDED.inv_5_expected,
        inv_6_name=EXCLUDED.inv_6_name, inv_6_actual=EXCLUDED.inv_6_actual, inv_6_expected=EXCLUDED.inv_6_expected, inv_7_name=EXCLUDED.inv_7_name, inv_7_actual=EXCLUDED.inv_7_actual, inv_7_expected=EXCLUDED.inv_7_expected, inv_8_name=EXCLUDED.inv_8_name, inv_8_actual=EXCLUDED.inv_8_actual, inv_8_expected=EXCLUDED.inv_8_expected, inv_9_name=EXCLUDED.inv_9_name, inv_9_actual=EXCLUDED.inv_9_actual, inv_9_expected=EXCLUDED.inv_9_expected, inv_10_name=EXCLUDED.inv_10_name, inv_10_actual=EXCLUDED.inv_10_actual, inv_10_expected=EXCLUDED.inv_10_expected,
        updated_at=now();
    `;

    // Clear existing children for seeding
    await sql`DELETE FROM transactions WHERE month = ${qMonth} AND year = ${qYear}`;
    await sql`DELETE FROM credit_ledger WHERE month = ${qMonth} AND year = ${qYear}`;

    // Insert Expenses
    for (const exp of data.expenses) {
      if (exp.amount > 0 || exp.name) {
        await sql`
          INSERT INTO transactions (month, year, category, name, amount)
          VALUES (${qMonth}, ${qYear}, ${exp.category}, ${exp.name || ''}, ${exp.amount || 0})
        `;
      }
    }

    // Insert Credits
    for (const cred of data.credits) {
      await sql`
        INSERT INTO credit_ledger (month, year, entity, amount, lent_or_owe, settled, borrowed)
        VALUES (${qMonth}, ${qYear}, ${cred.entity}, ${cred.amount}, ${cred.lentOrOwe}, ${cred.settled}, ${cred.borrowed})
      `;
    }

    console.log('✅ Sample data seeded successfully.');
  } catch (error) {
    console.error('❌ Failed to seed data:', error);
  }
}

seedDB();
