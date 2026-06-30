import pool from "../config/db.js";

// Create Ledger Entry
export const createLedgerEntry = async (
  client,
  company_id,
  voucher_type,
  voucher_id,
  ledger_id,
  entry_type,
  amount,
  narration = null
) => {

  await client.query(
    `
    INSERT INTO ledger_entries
    (
      company_id,
      voucher_type,
      voucher_id,
      ledger_id,
      entry_type,
      amount,
      narration
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7)
    `,
    [
      company_id,
      voucher_type,
      voucher_id,
      ledger_id,
      entry_type,
      amount,
      narration,
    ]
  );

  if (entry_type === "DR") {

    await client.query(
      `
      UPDATE ledgers
      SET current_balance = current_balance + $1
      WHERE id=$2
      `,
      [amount, ledger_id]
    );

  } else {

    await client.query(
      `
      UPDATE ledgers
      SET current_balance = current_balance - $1
      WHERE id=$2
      `,
      [amount, ledger_id]
    );

  }

};

// Find Ledger by Name
export const getLedgerByName = async (
  client,
  company_id,
  ledger_name
) => {

  const result = await client.query(
    `
    SELECT *
    FROM ledgers
    WHERE company_id=$1
    AND LOWER(ledger_name)=LOWER($2)
    `,
    [company_id, ledger_name]
  );

  return result.rows[0];

};