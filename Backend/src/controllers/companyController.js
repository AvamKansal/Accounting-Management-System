import pool from "../config/db.js";

// Create Company

export const createCompany = async (req, res) => {
  try {
    const { company_name, gst_number, address, financial_year } =
      req.body;

    const user_id = req.user.id;

    const result = await pool.query(
      `
      INSERT INTO companies
      (user_id, company_name, gst_number, address, financial_year)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        user_id,
        company_name,
        gst_number,
        address,
        financial_year,
      ]
    );

    res.status(201).json({
      success: true,
      company: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const companyCount = await pool.query(
  "SELECT COUNT(*) FROM companies WHERE user_id = $1",
  [user_id]
);

if (Number(companyCount.rows[0].count) >= 5) {
  return res.status(400).json({
    success: false,
    message: "Maximum 5 companies allowed",
  });
}

// Get All Companies of Logged-In User

export const getCompanies = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `
      SELECT *
      FROM companies
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [user_id]
    );

    res.json({
      success: true,
      companies: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Company

export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM companies
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({
      success: true,
      company: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};