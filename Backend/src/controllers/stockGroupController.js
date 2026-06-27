import pool from "../config/db.js";

// Create Stock Group
export const createStockGroup = async (req, res) => {
  try {
    const company_id = req.company.id;

    const { group_name, description } = req.body;

    const result = await pool.query(
      `
      INSERT INTO stock_groups
      (
        company_id,
        group_name,
        description
      )
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [company_id, group_name, description]
    );

    res.status(201).json({
      success: true,
      stockGroup: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Stock Groups
export const getStockGroups = async (req, res) => {
  try {
    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT *
      FROM stock_groups
      WHERE company_id = $1
      ORDER BY group_name ASC
      `,
      [company_id]
    );

    res.json({
      success: true,
      stockGroups: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Stock Group By ID
export const getStockGroupById = async (req, res) => {
  try {
    const company_id = req.company.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM stock_groups
      WHERE id = $1
      AND company_id = $2
      `,
      [id, company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stock Group not found",
      });
    }

    res.json({
      success: true,
      stockGroup: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Placeholder
export const updateStockGroup = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Update Stock Group will be implemented later.",
  });
};

export const deleteStockGroup = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Delete Stock Group will be implemented later.",
  });
};