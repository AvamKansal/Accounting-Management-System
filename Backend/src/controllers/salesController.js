import pool from "../config/db.js";

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

    // ===========================
    // Validate Customer
    // ===========================
    const customerResult = await client.query(
      `
      SELECT id
      FROM customers
      WHERE id = $1
      AND company_id = $2
      `,
      [customer_id, company_id]
    );

    if (customerResult.rows.length === 0) {
      throw new Error("Customer not found.");
    }

    // ===========================
    // Generate Invoice Number
    // ===========================
    const countResult = await client.query(
      `
      SELECT COUNT(*)
      FROM sales_vouchers
      WHERE company_id = $1
      `,
      [company_id]
    );

    const invoice_number = `SAL-${String(
      Number(countResult.rows[0].count) + 1
    ).padStart(5, "0")}`;

    let subtotal = 0;
    let gst_amount = 0;
    let total_amount = 0;

    // ===========================
    // Validate Stock
    // ===========================
    for (const item of items) {

      if (Number(item.quantity) <= 0) {
        throw new Error("Quantity must be greater than zero.");
      }

      if (Number(item.selling_price) <= 0) {
        throw new Error("Selling price must be greater than zero.");
      }

      const stockResult = await client.query(
        `
        SELECT
            id,
            current_stock
        FROM stock_items
        WHERE id = $1
        AND company_id = $2
        `,
        [
          item.stock_item_id,
          company_id,
        ]
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

    // ===========================
    // Create Sales Voucher
    // ===========================
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

    // ===========================
    // Save Sales Items
    // ===========================
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

      // ===========================
      // Reduce Stock
      // ===========================
      await client.query(
        `
        UPDATE stock_items
        SET current_stock = current_stock - $1
        WHERE id = $2
        `,
        [
          item.quantity,
          item.stock_item_id,
        ]
      );
    }

    // ===========================
    // Update Customer Outstanding
    // ===========================
    await client.query(
      `
      UPDATE customers
      SET outstanding_balance =
          COALESCE(outstanding_balance,0) + $1
      WHERE id = $2
      `,
      [
        total_amount,
        customer_id,
      ]
    );

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
import pool from "../config/db.js";

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

    // ===========================
    // Validate Customer
    // ===========================
    const customerResult = await client.query(
      `
      SELECT id
      FROM customers
      WHERE id = $1
      AND company_id = $2
      `,
      [customer_id, company_id]
    );

    if (customerResult.rows.length === 0) {
      throw new Error("Customer not found.");
    }

    // ===========================
    // Generate Invoice Number
    // ===========================
    const countResult = await client.query(
      `
      SELECT COUNT(*)
      FROM sales_vouchers
      WHERE company_id = $1
      `,
      [company_id]
    );

    const invoice_number = `SAL-${String(
      Number(countResult.rows[0].count) + 1
    ).padStart(5, "0")}`;

    let subtotal = 0;
    let gst_amount = 0;
    let total_amount = 0;

    // ===========================
    // Validate Stock
    // ===========================
    for (const item of items) {

      if (Number(item.quantity) <= 0) {
        throw new Error("Quantity must be greater than zero.");
      }

      if (Number(item.selling_price) <= 0) {
        throw new Error("Selling price must be greater than zero.");
      }

      const stockResult = await client.query(
        `
        SELECT
            id,
            current_stock
        FROM stock_items
        WHERE id = $1
        AND company_id = $2
        `,
        [
          item.stock_item_id,
          company_id,
        ]
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

    // ===========================
    // Create Sales Voucher
    // ===========================
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

    // ===========================
    // Save Sales Items
    // ===========================
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

      // ===========================
      // Reduce Stock
      // ===========================
      await client.query(
        `
        UPDATE stock_items
        SET current_stock = current_stock - $1
        WHERE id = $2
        `,
        [
          item.quantity,
          item.stock_item_id,
        ]
      );
    }

    // ===========================
    // Update Customer Outstanding
    // ===========================
    await client.query(
      `
      UPDATE customers
      SET outstanding_balance =
          COALESCE(outstanding_balance,0) + $1
      WHERE id = $2
      `,
      [
        total_amount,
        customer_id,
      ]
    );

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