import pool from "../config/db.js";

// Create Unit
export const createUnit = async (req, res) => {
  try {
    const company_id = req.company.id;

    const { unit_name, unit_symbol } = req.body;

    const result = await pool.query(
      `
      INSERT INTO units
      (
        company_id,
        unit_name,
        unit_symbol
      )
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [company_id, unit_name, unit_symbol]
    );

    res.status(201).json({
      success: true,
      unit: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Units
export const getUnits = async (req, res) => {
  try {
    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT *
      FROM units
      WHERE company_id = $1
      ORDER BY unit_name ASC
      `,
      [company_id]
    );

    res.json({
      success: true,
      units: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Unit By ID
export const getUnitById = async (req, res) => {
  try {
    const company_id = req.company.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM units
      WHERE id = $1
      AND company_id = $2
      `,
      [id, company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    res.json({
      success: true,
      unit: result.rows[0],
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
export const updateUnit = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Update Unit will be implemented later.",
  });
};

export const deleteUnit = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Delete Unit will be implemented later.",
  });
};