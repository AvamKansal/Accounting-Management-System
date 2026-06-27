import pool from "../config/db.js";

// Create Stock Item
export const createStockItem = async (req, res) => {
  try {
    const company_id = req.company.id;

    const {
      group_id,
      unit_id,
      item_name,
      sku,
      hsn_code,
      purchase_price,
      selling_price,
      gst_percentage,
      opening_stock,
      minimum_stock,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO stock_items
      (
        company_id,
        group_id,
        unit_id,
        item_name,
        sku,
        hsn_code,
        purchase_price,
        selling_price,
        gst_percentage,
        opening_stock,
        current_stock,
        minimum_stock
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11)
      RETURNING *
      `,
      [
        company_id,
        group_id,
        unit_id,
        item_name,
        sku,
        hsn_code,
        purchase_price || 0,
        selling_price || 0,
        gst_percentage || 0,
        opening_stock || 0,
        minimum_stock || 0,
      ]
    );

    res.status(201).json({
      success: true,
      stockItem: result.rows[0],
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// Get All Stock Items
export const getStockItems = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
        si.*,
        sg.group_name,
        u.unit_name,
        u.unit_symbol
      FROM stock_items si
      LEFT JOIN stock_groups sg
      ON si.group_id = sg.id
      LEFT JOIN units u
      ON si.unit_id = u.id
      WHERE si.company_id = $1
      ORDER BY si.item_name ASC
      `,
      [company_id]
    );

    res.json({
      success: true,
      stockItems: result.rows,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// Get Stock Item By ID
export const getStockItemById = async (req, res) => {
  try {

    const company_id = req.company.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM stock_items
      WHERE id = $1
      AND company_id = $2
      `,
      [id, company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stock Item not found",
      });
    }

    res.json({
      success: true,
      stockItem: result.rows[0],
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
export const updateStockItem = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Update Stock Item will be implemented later.",
  });
};

export const deleteStockItem = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Delete Stock Item will be implemented later.",
  });
};