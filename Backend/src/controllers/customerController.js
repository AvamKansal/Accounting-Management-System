import pool from "../config/db.js";

// =========================
// Create Customer
// =========================
export const createCustomer = async (req, res) => {
  try {
    const company_id = req.company.id;

    const {
      customer_name,
      mobile,
      email,
      address,
      city,
      state,
      pincode,
      gst_number,
      opening_balance,
    } = req.body;

    if (!customer_name) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required.",
      });
    }

    // Check duplicate customer
    const existingCustomer = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE company_id = $1
      AND LOWER(customer_name) = LOWER($2)
      `,
      [company_id, customer_name]
    );

    if (existingCustomer.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Customer already exists.",
      });
    }

    const balance = Number(opening_balance) || 0;

    const result = await pool.query(
      `
      INSERT INTO customers
      (
        company_id,
        customer_name,
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
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        company_id,
        customer_name,
        mobile || null,
        email || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        gst_number || null,
        balance,
        balance,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully.",
      customer: result.rows[0],
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
// Get All Customers
// =========================
export const getCustomers = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
        id,
        customer_name,
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
      FROM customers
      WHERE company_id = $1
      ORDER BY customer_name ASC
      `,
      [company_id]
    );

    res.json({
      success: true,
      customers: result.rows,
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
// Get Customer By ID
// =========================
export const getCustomerById = async (req, res) => {
  try {

    const company_id = req.company.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM customers
      WHERE id = $1
      AND company_id = $2
      `,
      [id, company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    res.json({
      success: true,
      customer: result.rows[0],
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
// Update Customer
// (Will implement later)
// =========================
export const updateCustomer = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Update Customer will be implemented later.",
  });
};

// =========================
// Delete Customer
// (Will implement later)
// =========================
export const deleteCustomer = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Delete Customer will be implemented later.",
  });
};