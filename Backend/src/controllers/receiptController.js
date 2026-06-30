import pool from "../config/db.js";
import {
  createLedgerEntry,
  getLedgerByName,
} from "../helpers/ledgerHelper.js";

// ==========================================
// Create Receipt Voucher
// ==========================================
export const createReceipt = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const company_id = req.company.id;

    const {
      customer_id,
      receipt_date,
      payment_mode,
      reference_no,
      amount,
      notes,
    } = req.body;

    if (!customer_id) {
      throw new Error("Customer is required.");
    }

    if (!amount || Number(amount) <= 0) {
      throw new Error("Invalid receipt amount.");
    }

    // Validate Customer
    const customerResult = await client.query(
      `
      SELECT *
      FROM customers
      WHERE id=$1
      AND company_id=$2
      `,
      [customer_id, company_id]
    );

    if (customerResult.rows.length === 0) {
      throw new Error("Customer not found.");
    }

    // Generate Voucher Number
    const countResult = await client.query(
      `
      SELECT COUNT(*)
      FROM receipt_vouchers
      WHERE company_id=$1
      `,
      [company_id]
    );

    const voucher_number = `REC-${String(
      Number(countResult.rows[0].count) + 1
    ).padStart(5, "0")}`;

    // Save Receipt
    const receiptResult = await client.query(
      `
      INSERT INTO receipt_vouchers
      (
        company_id,
        customer_id,
        voucher_number,
        receipt_date,
        payment_mode,
        reference_no,
        amount,
        notes
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        company_id,
        customer_id,
        voucher_number,
        receipt_date || new Date(),
        payment_mode,
        reference_no || null,
        amount,
        notes || null,
      ]
    );

    const receipt = receiptResult.rows[0];

    // Reduce Customer Outstanding
    await client.query(
      `
      UPDATE customers
      SET outstanding_balance =
      outstanding_balance - $1
      WHERE id=$2
      `,
      [amount, customer_id]
    );

    // Customer Ledger
    const customerLedgerResult = await client.query(
      `
      SELECT id
      FROM ledgers
      WHERE company_id=$1
      AND reference_id=$2
      `,
      [company_id, customer_id]
    );

    if (customerLedgerResult.rows.length === 0) {
      throw new Error("Customer Ledger not found.");
    }

    const customerLedger =
      customerLedgerResult.rows[0];

    // Cash / Bank Ledger
    const receiptLedger =
      await getLedgerByName(
        client,
        company_id,
        payment_mode === "BANK"
          ? "Bank"
          : "Cash"
      );

    if (!receiptLedger) {
      throw new Error(
        `${payment_mode} Ledger not found.`
      );
    }

    // Cash / Bank DR
    await createLedgerEntry(
      client,
      company_id,
      "RECEIPT",
      receipt.id,
      receiptLedger.id,
      "DR",
      Number(amount),
      `Receipt Voucher ${voucher_number}`
    );

    // Customer CR
    await createLedgerEntry(
      client,
      company_id,
      "RECEIPT",
      receipt.id,
      customerLedger.id,
      "CR",
      Number(amount),
      `Receipt Voucher ${voucher_number}`
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Receipt Voucher Created Successfully",
      receipt,
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  } finally {

    client.release();

  }
};

// ==========================================
// Get All Receipt Vouchers
// ==========================================
export const getReceipts = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          rv.*,
          c.customer_name
      FROM receipt_vouchers rv
      JOIN customers c
      ON rv.customer_id = c.id
      WHERE rv.company_id = $1
      ORDER BY rv.receipt_date DESC,
               rv.created_at DESC
      `,
      [company_id]
    );

    res.json({
      success: true,
      receipts: result.rows,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ==========================================
// Get Receipt By ID
// ==========================================
export const getReceiptById = async (req, res) => {
  try {

    const company_id = req.company.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
          rv.*,
          c.customer_name
      FROM receipt_vouchers rv
      JOIN customers c
      ON rv.customer_id = c.id
      WHERE rv.id = $1
      AND rv.company_id = $2
      `,
      [id, company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Receipt Voucher not found.",
      });
    }

    res.json({
      success: true,
      receipt: result.rows[0],
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ==========================================
// Update Receipt
// ==========================================
export const updateReceipt = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Update Receipt will be implemented later.",
  });
};

// ==========================================
// Delete Receipt
// ==========================================
export const deleteReceipt = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Delete Receipt will be implemented later.",
  });
};