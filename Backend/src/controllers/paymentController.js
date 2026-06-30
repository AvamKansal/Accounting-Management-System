import pool from "../config/db.js";
import {
  createLedgerEntry,
  getLedgerByName,
} from "../helpers/ledgerHelper.js";

// ==========================================
// Create Payment Voucher
// ==========================================
export const createPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const company_id = req.company.id;

    const {
      supplier_id,
      payment_date,
      payment_mode,
      reference_no,
      amount,
      notes,
    } = req.body;

    if (!supplier_id) {
      throw new Error("Supplier is required.");
    }

    if (!amount || Number(amount) <= 0) {
      throw new Error("Invalid payment amount.");
    }

    // ============================
    // Validate Supplier
    // ============================

    const supplierResult = await client.query(
      `
      SELECT *
      FROM suppliers
      WHERE id=$1
      AND company_id=$2
      `,
      [supplier_id, company_id]
    );

    if (supplierResult.rows.length === 0) {
      throw new Error("Supplier not found.");
    }

    // ============================
    // Voucher Number
    // ============================

    const countResult = await client.query(
      `
      SELECT COUNT(*)
      FROM payment_vouchers
      WHERE company_id=$1
      `,
      [company_id]
    );

    const voucher_number = `PAY-${String(
      Number(countResult.rows[0].count) + 1
    ).padStart(5, "0")}`;

    // ============================
    // Save Voucher
    // ============================

    const paymentResult = await client.query(
      `
      INSERT INTO payment_vouchers
      (
        company_id,
        supplier_id,
        voucher_number,
        payment_date,
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
        supplier_id,
        voucher_number,
        payment_date || new Date(),
        payment_mode,
        reference_no || null,
        amount,
        notes || null,
      ]
    );

    const payment = paymentResult.rows[0];

    // ============================
    // Reduce Supplier Outstanding
    // ============================

    await client.query(
      `
      UPDATE suppliers
      SET outstanding_balance =
      outstanding_balance - $1
      WHERE id=$2
      `,
      [amount, supplier_id]
    );

    // ============================
    // Get Supplier Ledger
    // ============================

    const supplierLedgerResult = await client.query(
      `
      SELECT id
      FROM ledgers
      WHERE company_id=$1
      AND reference_id=$2
      `,
      [company_id, supplier_id]
    );

    if (supplierLedgerResult.rows.length === 0) {
      throw new Error("Supplier Ledger not found.");
    }

    const supplierLedger =
      supplierLedgerResult.rows[0];

    // ============================
    // Cash / Bank Ledger
    // ============================

    const paymentLedger =
      await getLedgerByName(
        client,
        company_id,
        payment_mode === "BANK"
          ? "Bank"
          : "Cash"
      );

    if (!paymentLedger) {
      throw new Error(
        `${payment_mode} Ledger not found.`
      );
    }

    // ============================
    // Ledger Posting
    // ============================

    // Supplier DR

    await createLedgerEntry(
      client,
      company_id,
      "PAYMENT",
      payment.id,
      supplierLedger.id,
      "DR",
      Number(amount),
      `Payment Voucher ${voucher_number}`
    );

    // Cash/Bank CR

    await createLedgerEntry(
      client,
      company_id,
      "PAYMENT",
      payment.id,
      paymentLedger.id,
      "CR",
      Number(amount),
      `Payment Voucher ${voucher_number}`
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Payment Voucher Created Successfully",
      payment,
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
// Get All Payments
// ==========================================
export const getPayments = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          pv.*,
          s.supplier_name
      FROM payment_vouchers pv
      JOIN suppliers s
      ON pv.supplier_id = s.id
      WHERE pv.company_id = $1
      ORDER BY pv.payment_date DESC,
               pv.created_at DESC
      `,
      [company_id]
    );

    res.json({
      success: true,
      payments: result.rows,
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
// Get Payment By ID
// ==========================================
export const getPaymentById = async (req, res) => {
  try {

    const company_id = req.company.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
          pv.*,
          s.supplier_name
      FROM payment_vouchers pv
      JOIN suppliers s
      ON pv.supplier_id = s.id
      WHERE pv.id = $1
      AND pv.company_id = $2
      `,
      [id, company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment Voucher not found.",
      });
    }

    res.json({
      success: true,
      payment: result.rows[0],
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
// Update Payment
// ==========================================
export const updatePayment = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Update Payment will be implemented later.",
  });
};

// ==========================================
// Delete Payment
// ==========================================
export const deletePayment = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Delete Payment will be implemented later.",
  });
};