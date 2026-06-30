import pool from "../config/db.js";

// =========================
// Create Supplier
// =========================
export const createSupplier = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const company_id = req.company.id;

    const {
      supplier_name,
      mobile,
      email,
      address,
      city,
      state,
      pincode,
      gst_number,
      opening_balance,
    } = req.body;

    if (!supplier_name) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Supplier name is required.",
      });
    }

    // Check Duplicate Supplier
    const existingSupplier = await client.query(
      `
      SELECT id
      FROM suppliers
      WHERE company_id = $1
      AND LOWER(supplier_name) = LOWER($2)
      `,
      [company_id, supplier_name]
    );

    if (existingSupplier.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Supplier already exists.",
      });
    }

    const balance = Number(opening_balance) || 0;

    // Create Supplier
    const supplierResult = await client.query(
      `
      INSERT INTO suppliers
      (
        company_id,
        supplier_name,
        mobile,
        email,
        address,
        city,
        state,
        pincode,
        gst_number,
        opening_balance,
        outstanding_balance
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
      RETURNING *
      `,
      [
        company_id,
        supplier_name,
        mobile || null,
        email || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        gst_number || null,
        balance,
      ]
    );

    const supplier = supplierResult.rows[0];

    // Create Supplier Ledger
    await client.query(
      `
      INSERT INTO ledgers
      (
        company_id,
        ledger_name,
        ledger_group,
        opening_balance,
        current_balance,
        reference_id
      )
      VALUES
      ($1,$2,'Sundry Creditors',$3,$3,$4)
      `,
      [
        company_id,
        supplier.supplier_name,
        balance,
        supplier.id,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Supplier created successfully.",
      supplier,
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
// Get All Suppliers
// =========================
export const getSuppliers = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
        id,
        supplier_name,
        mobile,
        email,
        address,
        city,
        state,
        pincode,
        gst_number,
        opening_balance,
        outstanding_balance,
        created_at
      FROM suppliers
      WHERE company_id = $1
      ORDER BY supplier_name ASC
      `,
      [company_id]
    );

    res.json({
      success: true,
      suppliers: result.rows,
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
// Get Supplier By ID
// =========================
export const getSupplierById = async (req, res) => {
  try {

    const company_id = req.company.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM suppliers
      WHERE id = $1
      AND company_id = $2
      `,
      [id, company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found.",
      });
    }

    res.json({
      success: true,
      supplier: result.rows[0],
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
// Update Supplier
// =========================
export const updateSupplier = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Update Supplier will be implemented later.",
  });
};

// =========================
// Delete Supplier
// =========================
export const deleteSupplier = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Delete Supplier will be implemented later.",
  });
};