import pool from "../config/db.js";

// ==========================================
// Create Company
// ==========================================
export const createCompany = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      company_name,
      gst_number,
      address,
      financial_year,
    } = req.body;

    const user_id = req.user.id;

    // Maximum 5 companies per user
    const companyCount = await client.query(
      `
      SELECT COUNT(*)
      FROM companies
      WHERE user_id = $1
      `,
      [user_id]
    );

    if (Number(companyCount.rows[0].count) >= 5) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Maximum 5 companies allowed.",
      });
    }

    // Check duplicate company name
    const existingCompany = await client.query(
      `
      SELECT id
      FROM companies
      WHERE user_id = $1
      AND LOWER(company_name) = LOWER($2)
      `,
      [user_id, company_name]
    );

    if (existingCompany.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Company already exists.",
      });
    }

    // Create Company
    const companyResult = await client.query(
      `
      INSERT INTO companies
      (
        user_id,
        company_name,
        gst_number,
        address,
        financial_year
      )
      VALUES
      ($1,$2,$3,$4,$5)
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

    const company = companyResult.rows[0];

    // Create Default Ledgers
    await client.query(
      `
      INSERT INTO ledgers
      (
        company_id,
        ledger_name,
        ledger_group,
        opening_balance,
        current_balance
      )
      VALUES
        ($1,'Cash','Current Assets',0,0),
        ($1,'Bank','Bank Accounts',0,0),
        ($1,'Purchase Account','Purchase Accounts',0,0),
        ($1,'Sales Account','Sales Accounts',0,0),
        ($1,'Input GST','Duties & Taxes',0,0),
        ($1,'Output GST','Duties & Taxes',0,0),
        ($1,'Discount Allowed','Indirect Expenses',0,0),
        ($1,'Discount Received','Indirect Income',0,0),
        ($1,'Round Off','Indirect Expenses',0,0)
      `,
      [company.id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Company created successfully.",
      company,
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
// Get All Companies
// ==========================================
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

    res.status(200).json({
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

// ==========================================
// Get Company By ID
// ==========================================
export const getCompanyById = async (req, res) => {
  try {

    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      `
      SELECT *
      FROM companies
      WHERE id = $1
      AND user_id = $2
      `,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    res.status(200).json({
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