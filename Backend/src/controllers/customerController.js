import pool from "../config/db.js";

// Create Customer
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
        opening_balance
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        company_id,
        customer_name,
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

// Get All Customers
export const getCustomers = async (req, res) => {
  try {
    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT *
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

// Get Single Customer
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
        message: "Customer not found",
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

// Update Customer (Day 5)
export const updateCustomer = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Update customer will be implemented in Day 5",
  });
};

// Delete Customer (Day 5)
export const deleteCustomer = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Delete customer will be implemented in Day 5",
  });
};