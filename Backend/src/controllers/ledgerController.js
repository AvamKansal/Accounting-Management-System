import pool from "../config/db.js";

// Create Ledger
export const createLedger = async (req, res) => {

  try {

    const company_id = req.company.id;

    const {
      ledger_name,
      ledger_group,
      opening_balance,
    } = req.body;

    if (!ledger_name || !ledger_group) {

      return res.status(400).json({
        success: false,
        message: "Ledger Name and Group are required.",
      });

    }

    const existing = await pool.query(
      `
      SELECT id
      FROM ledgers
      WHERE company_id=$1
      AND LOWER(ledger_name)=LOWER($2)
      `,
      [company_id, ledger_name]
    );

    if (existing.rows.length > 0) {

      return res.status(400).json({
        success: false,
        message: "Ledger already exists.",
      });

    }

    const result = await pool.query(
      `
      INSERT INTO ledgers
      (
        company_id,
        ledger_name,
        ledger_group,
        opening_balance,
        current_balance
      )
      VALUES
      ($1,$2,$3,$4,$4)
      RETURNING *
      `,
      [
        company_id,
        ledger_name,
        ledger_group,
        Number(opening_balance) || 0,
      ]
    );

    res.status(201).json({
      success: true,
      ledger: result.rows[0],
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Get All Ledgers
export const getLedgers = async (req, res) => {

  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT *
      FROM ledgers
      WHERE company_id=$1
      ORDER BY ledger_name
      `,
      [company_id]
    );

    res.json({
      success: true,
      ledgers: result.rows,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Get Ledger By ID
export const getLedgerById = async (req, res) => {

  try {

    const company_id = req.company.id;

    const { id } = req.params;

    const ledger = await pool.query(
      `
      SELECT *
      FROM ledgers
      WHERE id=$1
      AND company_id=$2
      `,
      [id, company_id]
    );

    if (ledger.rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Ledger not found.",
      });

    }

    const entries = await pool.query(
      `
      SELECT *
      FROM ledger_entries
      WHERE ledger_id=$1
      ORDER BY created_at DESC
      `,
      [id]
    );

    res.json({
      success: true,
      ledger: ledger.rows[0],
      entries: entries.rows,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};