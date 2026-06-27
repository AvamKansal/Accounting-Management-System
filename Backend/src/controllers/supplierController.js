import pool from "../config/db.js";

// Create Supplier
export const createSupplier = async (req, res) => {
  try {
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

    const result = await pool.query(
      `
      INSERT INTO suppliers (
        company_id,
        supplier_name,
        mobile,
        email,
        address,
        city,
        state,
        pincode,
        gst_number,
        opening_balance
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        company_id,
        supplier_name,
        mobile,
        email,
        address,
        city,
        state,
        pincode,
        gst_number,
        opening_balance || 0,
      ]
    );

    res.status(201).json({
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

// Get All Suppliers
export const getSuppliers = async (req, res) => {
  try {
    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT *
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

// Get Supplier By ID
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
        message: "Supplier not found",
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

// Placeholder for future implementation
export const updateSupplier = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Update Supplier will be implemented later.",
  });
};

export const deleteSupplier = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Delete Supplier will be implemented later.",
  });
};