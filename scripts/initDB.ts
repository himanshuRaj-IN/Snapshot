import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function initDB() {
  console.log('Connecting to Neon DB to initialize schemas...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS snapshots (
        month  TEXT    NOT NULL,
        year   INTEGER NOT NULL,
        PRIMARY KEY (month, year),
        CONSTRAINT valid_month CHECK (month IN (
          'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
          'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'
        )),

        -- 1. Opening Balances
        op_investment    NUMERIC(12,2) NOT NULL DEFAULT 0,
        op_saving        NUMERIC(12,2) NOT NULL DEFAULT 0,
        op_checking      NUMERIC(12,2) NOT NULL DEFAULT 0,
        op_credit_given  NUMERIC(12,2) NOT NULL DEFAULT 0,
        op_debt_taken    NUMERIC(12,2) NOT NULL DEFAULT 0,

        -- 2. Closing Balances
        cl_investment    NUMERIC(12,2) NOT NULL DEFAULT 0,
        cl_saving        NUMERIC(12,2) NOT NULL DEFAULT 0,
        cl_checking      NUMERIC(12,2) NOT NULL DEFAULT 0,
        cl_credit_given  NUMERIC(12,2) NOT NULL DEFAULT 0,
        cl_debt_taken    NUMERIC(12,2) NOT NULL DEFAULT 0,

        -- 3. Income
        income_1_label   TEXT,   income_1_amount  NUMERIC(12,2),
        income_2_label   TEXT,   income_2_amount  NUMERIC(12,2),
        income_3_label   TEXT,   income_3_amount  NUMERIC(12,2),
        income_4_label   TEXT,   income_4_amount  NUMERIC(12,2),
        income_5_label   TEXT,   income_5_amount  NUMERIC(12,2),

        -- 4. Investments & Savings
        inv_1_name       TEXT,  inv_1_actual NUMERIC(12,2), inv_1_expected NUMERIC(12,2),
        inv_2_name       TEXT,  inv_2_actual NUMERIC(12,2), inv_2_expected NUMERIC(12,2),
        inv_3_name       TEXT,  inv_3_actual NUMERIC(12,2), inv_3_expected NUMERIC(12,2),
        inv_4_name       TEXT,  inv_4_actual NUMERIC(12,2), inv_4_expected NUMERIC(12,2),
        inv_5_name       TEXT,  inv_5_actual NUMERIC(12,2), inv_5_expected NUMERIC(12,2),
        inv_6_name       TEXT,  inv_6_actual NUMERIC(12,2), inv_6_expected NUMERIC(12,2),
        inv_7_name       TEXT,  inv_7_actual NUMERIC(12,2), inv_7_expected NUMERIC(12,2),
        inv_8_name       TEXT,  inv_8_actual NUMERIC(12,2), inv_8_expected NUMERIC(12,2),
        inv_9_name       TEXT,  inv_9_actual NUMERIC(12,2), inv_9_expected NUMERIC(12,2),
        inv_10_name      TEXT,  inv_10_actual NUMERIC(12,2), inv_10_expected NUMERIC(12,2),

        -- 5. Distributions
        dist_investment     NUMERIC(12,2) NOT NULL DEFAULT 0,
        dist_saving         NUMERIC(12,2) NOT NULL DEFAULT 0,
        dist_checking       NUMERIC(12,2) NOT NULL DEFAULT 0,
        dist_credit_given   NUMERIC(12,2) NOT NULL DEFAULT 0,
        dist_credit_repaid  NUMERIC(12,2) NOT NULL DEFAULT 0,
        dist_debt_taken     NUMERIC(12,2) NOT NULL DEFAULT 0,
        dist_debt_repaid    NUMERIC(12,2) NOT NULL DEFAULT 0,
        dist_for_expense    NUMERIC(12,2) NOT NULL DEFAULT 0,

        -- 6. Budgets & Settlement
        budget           NUMERIC(12,2) NOT NULL DEFAULT 0,
        budget_smt       NUMERIC(12,2) NOT NULL DEFAULT 0,
        budget_ufs       NUMERIC(12,2) NOT NULL DEFAULT 0,
        in_settlement    NUMERIC(12,2) NOT NULL DEFAULT 0,
        settled          NUMERIC(12,2) NOT NULL DEFAULT 0,
        unaccounted      NUMERIC(12,2) NOT NULL DEFAULT 0,

        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id           SERIAL PRIMARY KEY,
        month        TEXT NOT NULL,
        year         INTEGER NOT NULL,
        category     TEXT NOT NULL,
        name         TEXT,
        amount       NUMERIC(12,2) NOT NULL,
        date         DATE DEFAULT CURRENT_DATE,
        created_at   TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT fk_snapshot FOREIGN KEY(month, year) REFERENCES snapshots(month, year) ON DELETE CASCADE
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS credit_ledger (
        id           SERIAL PRIMARY KEY,
        month        TEXT NOT NULL,
        year         INTEGER NOT NULL,
        entity       TEXT NOT NULL,
        amount       NUMERIC(12,2) DEFAULT 0,
        lent_or_owe  NUMERIC(12,2) DEFAULT 0,
        settled      NUMERIC(12,2) DEFAULT 0,
        borrowed     NUMERIC(12,2) DEFAULT 0,
        created_at   TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT fk_snapshot_credit FOREIGN KEY(month, year) REFERENCES snapshots(month, year) ON DELETE CASCADE
      );
    `;
    console.log('✅ Tables created successfully.');
  } catch (error) {
    console.error('❌ Failed to create table:', error);
  }
}

initDB();
