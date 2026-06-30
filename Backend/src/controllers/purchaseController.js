import pool from "../config/db.js";
import {createLedgerEntry, getLedgerByName,} from "../helpers/ledgerHelper.js";

// =========================
// Create Purchase Voucher
// =========================
export const createPurchase = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const company_id = req.company.id;

    const {
      supplier_id,
      purchase_date,
      notes,
      items,
    } = req.body;

    if (!items || items.length === 0) {
      throw new Error("Purchase must contain at least one item.");
    }

    // =========================
    // Validate Supplier
    // =========================
    const supplierResult = await client.query(
      `
      SELECT id
      FROM suppliers
      WHERE id = $1
      AND company_id = $2
      `,
      [supplier_id, company_id]
    );

    if (supplierResult.rows.length === 0) {
      throw new Error("Supplier not found.");
    }

    // =========================
    // Generate Voucher Number
    // =========================
    const countResult = await client.query(
      `
      SELECT COUNT(*)
      FROM purchase_vouchers
      WHERE company_id = $1
      `,
      [company_id]
    );

    const voucher_number = `PUR-${String(
      Number(countResult.rows[0].count) + 1
    ).padStart(5, "0")}`;

    let subtotal = 0;
    let gst_amount = 0;
    let total_amount = 0;

    // =========================
    // Validate Items
    // =========================
    for (const item of items) {
      if (Number(item.quantity) <= 0) {
        throw new Error("Quantity must be greater than zero.");
      }

      if (Number(item.purchase_price) <= 0) {
        throw new Error("Purchase price must be greater than zero.");
      }

      const stockResult = await client.query(
        `
        SELECT id
        FROM stock_items
        WHERE id = $1
        AND company_id = $2
        `,
        [item.stock_item_id, company_id]
      );

      if (stockResult.rows.length === 0) {
        throw new Error("Invalid Stock Item.");
      }

      const itemTotal =
        Number(item.quantity) *
        Number(item.purchase_price);

      const itemGST =
        itemTotal *
        (Number(item.gst_percentage || 0) / 100);

      subtotal += itemTotal;
      gst_amount += itemGST;
      total_amount += itemTotal + itemGST;
    }

    // =========================
    // Create Purchase Voucher
    // =========================
    const purchaseResult = await client.query(
      `
      INSERT INTO purchase_vouchers
      (
        company_id,
        supplier_id,
        voucher_number,
        purchase_date,
        subtotal,
        gst_amount,
        total_amount,
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
        purchase_date || new Date(),
        subtotal,
        gst_amount,
        total_amount,
        notes || null,
      ]
    );

    const purchase = purchaseResult.rows[0];

    const savedItems = [];

    // =========================
    // Save Purchase Items
    // =========================
    for (const item of items) {
      const itemTotal =
        Number(item.quantity) *
        Number(item.purchase_price);

      const itemGST =
        itemTotal *
        (Number(item.gst_percentage || 0) / 100);

      const purchaseItem = await client.query(
        `
        INSERT INTO purchase_items
        (
          purchase_id,
          stock_item_id,
          quantity,
          purchase_price,
          gst_percentage,
          gst_amount,
          total
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [
          purchase.id,
          item.stock_item_id,
          item.quantity,
          item.purchase_price,
          item.gst_percentage || 0,
          itemGST,
          itemTotal + itemGST,
        ]
      );

      savedItems.push(purchaseItem.rows[0]);

      // Increase Stock
      await client.query(
        `
        UPDATE stock_items
        SET current_stock = current_stock + $1
        WHERE id = $2
        `,
        [
          item.quantity,
          item.stock_item_id,
        ]
      );
    }

    // =========================
    // Update Supplier Outstanding
    // =========================
    await client.query(
      `
      UPDATE suppliers
      SET outstanding_balance =
          COALESCE(outstanding_balance,0) + $1
      WHERE id = $2
      `,
      [
        total_amount,
        supplier_id,
      ]
    );

// =========================
// Update Supplier Outstanding
// =========================
await client.query(
  `
  UPDATE suppliers
  SET outstanding_balance =
      COALESCE(outstanding_balance,0) + $1
  WHERE id = $2
  `,
  [
    total_amount,
    supplier_id,
  ]
);

// ========================================
// Ledger Posting
// ========================================

// Purchase Account
const purchaseLedger = await getLedgerByName(
  client,
  company_id,
  "Purchase Account"
);

// Input GST
const inputGSTLedger = await getLedgerByName(
  client,
  company_id,
  "Input GST"
);

// Supplier Ledger
const supplierLedgerResult = await client.query(
  `
  SELECT id
  FROM ledgers
  WHERE company_id = $1
  AND reference_id = $2
  `,
  [company_id, supplier_id]
);

if (supplierLedgerResult.rows.length === 0) {
  throw new Error("Supplier Ledger not found.");
}

const supplierLedger = supplierLedgerResult.rows[0];

// Purchase Account DR
await createLedgerEntry(
  client,
  company_id,
  "PURCHASE",
  purchase.id,
  purchaseLedger.id,
  "DR",
  subtotal,
  `Purchase Voucher ${voucher_number}`
);

// Input GST DR
if (gst_amount > 0) {
  await createLedgerEntry(
    client,
    company_id,
    "PURCHASE",
    purchase.id,
    inputGSTLedger.id,
    "DR",
    gst_amount,
    `Purchase Voucher ${voucher_number}`
  );
}

// Supplier CR
await createLedgerEntry(
  client,
  company_id,
  "PURCHASE",
  purchase.id,
  supplierLedger.id,
  "CR",
  total_amount,
  `Purchase Voucher ${voucher_number}`
);

await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Purchase Voucher Created Successfully",
      purchase,
      items: savedItems,
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

// =========================
// Get All Purchases
// =========================
export const getPurchases = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          pv.*,
          s.supplier_name
      FROM purchase_vouchers pv
      JOIN suppliers s
      ON pv.supplier_id = s.id
      WHERE pv.company_id = $1
      ORDER BY pv.purchase_date DESC,
               pv.created_at DESC
      `,
      [company_id]
    );

    res.json({
      success: true,
      purchases: result.rows,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =========================
// Get Purchase By ID
// =========================
export const getPurchaseById = async (req, res) => {
  try {

    const company_id = req.company.id;
    const { id } = req.params;

    const purchase = await pool.query(
      `
      SELECT
          pv.*,
          s.supplier_name
      FROM purchase_vouchers pv
      JOIN suppliers s
      ON pv.supplier_id = s.id
      WHERE pv.id = $1
      AND pv.company_id = $2
      `,
      [id, company_id]
    );

    if (purchase.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase Voucher not found",
      });
    }

    const items = await pool.query(
      `
      SELECT
          pi.*,
          si.item_name,
          si.sku,
          u.unit_name,
          u.unit_symbol
      FROM purchase_items pi
      JOIN stock_items si
      ON pi.stock_item_id = si.id
      LEFT JOIN units u
      ON si.unit_id = u.id
      WHERE pi.purchase_id = $1
      ORDER BY si.item_name
      `,
      [id]
    );

    res.json({
      success: true,
      purchase: purchase.rows[0],
      items: items.rows,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};