import pool from "../config/db.js";

const companyMiddleware = async (req, res, next) => {
  try {
    const companyId = req.headers["x-company-id"];

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company not selected",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM companies
      WHERE id = $1
      AND user_id = $2
      `,
      [companyId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Invalid company",
      });
    }

    req.company = result.rows[0];

    next();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default companyMiddleware;