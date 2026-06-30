import pool from "../config/db.js";
import {
  createLedgerEntry,
  getLedgerByName,
} from "../helpers/ledgerHelper.js";

// ==========================================
// Create Sales Voucher
// ==========================================
export const createSale = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const company_id = req.company.id;

    const {
      customer_id,
      invoice_date,
      notes,
      items,
    } = req.body;

    if (!items || items.length === 0) {
      throw new Error("Invoice must contain at least one item.");
    }

    // Validate Customer
    const customerResult = await client.query(
      `
      SELECT id
      FROM customers
      WHERE id=$1
      AND company_id=$2
      `,
      [customer_id, company_id]
    );

    if (customerResult.rows.length === 0) {
      throw new Error("Customer not found.");
    }

    // Generate Invoice Number
    const countResult = await client.query(
      `
      SELECT COUNT(*)
      FROM sales_vouchers
      WHERE company_id=$1
      `,
      [company_id]
    );

    const invoice_number = `SAL-${String(
      Number(countResult.rows[0].count) + 1
    ).padStart(5, "0")}`;

    let subtotal = 0;
    let gst_amount = 0;
    let total_amount = 0;

    // Validate Items
    for (const item of items) {

      if (Number(item.quantity) <= 0) {
        throw new Error("Quantity must be greater than zero.");
      }

      if (Number(item.selling_price) <= 0) {
        throw new Error("Selling price must be greater than zero.");
      }

      const stockResult = await client.query(
        `
        SELECT id,current_stock
        FROM stock_items
        WHERE id=$1
        AND company_id=$2
        `,
        [item.stock_item_id, company_id]
      );

      if (stockResult.rows.length === 0) {
        throw new Error("Invalid Stock Item.");
      }

      if (
        Number(stockResult.rows[0].current_stock) <
        Number(item.quantity)
      ) {
        throw new Error(
          `Insufficient stock for Item ID ${item.stock_item_id}`
        );
      }

      const itemTotal =
        Number(item.quantity) *
        Number(item.selling_price);

      const itemGST =
        itemTotal *
        (Number(item.gst_percentage || 0) / 100);

      subtotal += itemTotal;
      gst_amount += itemGST;
      total_amount += itemTotal + itemGST;
    }

    // Create Voucher
    const salesResult = await client.query(
      `
      INSERT INTO sales_vouchers
      (
        company_id,
        customer_id,
        invoice_number,
        invoice_date,
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
        customer_id,
        invoice_number,
        invoice_date || new Date(),
        subtotal,
        gst_amount,
        total_amount,
        notes || null,
      ]
    );

    const sale = salesResult.rows[0];

    const savedItems = [];

    // Save Items
    for (const item of items) {

      const itemTotal =
        Number(item.quantity) *
        Number(item.selling_price);

      const itemGST =
        itemTotal *
        (Number(item.gst_percentage || 0) / 100);

      const salesItem = await client.query(
        `
        INSERT INTO sales_items
        (
          sales_id,
          stock_item_id,
          quantity,
          selling_price,
          gst_percentage,
          gst_amount,
          total
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [
          sale.id,
          item.stock_item_id,
          item.quantity,
          item.selling_price,
          item.gst_percentage || 0,
          itemGST,
          itemTotal + itemGST,
        ]
      );

      savedItems.push(salesItem.rows[0]);

      // Reduce Stock
      await client.query(
        `
        UPDATE stock_items
        SET current_stock=current_stock-$1
        WHERE id=$2
        `,
        [
          item.quantity,
          item.stock_item_id,
        ]
      );
    }

    // Update Customer Outstanding
    await client.query(
      `
      UPDATE customers
      SET outstanding_balance=
      COALESCE(outstanding_balance,0)+$1
      WHERE id=$2
      `,
      [
        total_amount,
        customer_id,
      ]
    );

    // ==========================================
    // Ledger Posting
    // ==========================================

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

    const salesLedger =
      await getLedgerByName(
        client,
        company_id,
        "Sales Account"
      );

    if (!salesLedger) {
      throw new Error("Sales Account Ledger not found.");
    }

    const outputGSTLedger =
      await getLedgerByName(
        client,
        company_id,
        "Output GST"
      );

    if (!outputGSTLedger) {
      throw new Error("Output GST Ledger not found.");
    }

    // Customer DR
    await createLedgerEntry(
      client,
      company_id,
      "SALES",
      sale.id,
      customerLedger.id,
      "DR",
      total_amount,
      `Sales Invoice ${invoice_number}`
    );

    // Sales CR
    await createLedgerEntry(
      client,
      company_id,
      "SALES",
      sale.id,
      salesLedger.id,
      "CR",
      subtotal,
      `Sales Invoice ${invoice_number}`
    );

    // Output GST CR
    if (gst_amount > 0) {

      await createLedgerEntry(
        client,
        company_id,
        "SALES",
        sale.id,
        outputGSTLedger.id,
        "CR",
        gst_amount,
        `Sales Invoice ${invoice_number}`
      );

    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Sales Invoice Created Successfully",
      sale,
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

// ==========================================
// Get All Sales
// ==========================================
export const getSales = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          sv.*,
          c.customer_name
      FROM sales_vouchers sv
      JOIN customers c
      ON sv.customer_id = c.id
      WHERE sv.company_id = $1
      ORDER BY sv.invoice_date DESC,
               sv.created_at DESC
      `,
      [company_id]
    );

    res.json({
      success: true,
      sales: result.rows,
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
// Get Sales By ID
// ==========================================
export const getSaleById = async (req, res) => {
  try {

    const company_id = req.company.id;
    const { id } = req.params;

    const sale = await pool.query(
      `
      SELECT
          sv.*,
          c.customer_name
      FROM sales_vouchers sv
      JOIN customers c
      ON sv.customer_id = c.id
      WHERE sv.id = $1
      AND sv.company_id = $2
      `,
      [id, company_id]
    );

    if (sale.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sales Invoice not found.",
      });
    }

    const items = await pool.query(
      `
      SELECT
          si.*,
          st.item_name,
          st.sku,
          u.unit_name,
          u.unit_symbol
      FROM sales_items si
      JOIN stock_items st
      ON si.stock_item_id = st.id
      LEFT JOIN units u
      ON st.unit_id = u.id
      WHERE si.sales_id = $1
      ORDER BY st.item_name
      `,
      [id]
    );

    res.json({
      success: true,
      sale: sale.rows[0],
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
export const updateSale = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Update Sale will be implemented later.",
  });
};

export const deleteSale = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Delete Sale will be implemented later.",
  });
};