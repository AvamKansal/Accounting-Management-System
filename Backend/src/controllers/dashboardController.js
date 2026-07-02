import pool from "../config/db.js";

// ==========================================
// Dashboard Summary
// ==========================================
export const getDashboardSummary = async (req, res) => {
  try {

    const company_id = req.company.id;

    // Total Customers
    const customerResult = await pool.query(
      `
      SELECT COUNT(*) total
      FROM customers
      WHERE company_id=$1
      `,
      [company_id]
    );

    // Total Suppliers
    const supplierResult = await pool.query(
      `
      SELECT COUNT(*) total
      FROM suppliers
      WHERE company_id=$1
      `,
      [company_id]
    );

    // Total Stock Items
    const stockResult = await pool.query(
      `
      SELECT COUNT(*) total
      FROM stock_items
      WHERE company_id=$1
      `,
      [company_id]
    );

    // Total Sales
    const salesResult = await pool.query(
      `
      SELECT
      COALESCE(SUM(total_amount),0) total
      FROM sales_vouchers
      WHERE company_id=$1
      `,
      [company_id]
    );

    // Total Purchase
    const purchaseResult = await pool.query(
      `
      SELECT
      COALESCE(SUM(total_amount),0) total
      FROM purchase_vouchers
      WHERE company_id=$1
      `,
      [company_id]
    );

    // Low Stock
    const lowStockResult = await pool.query(
      `
      SELECT COUNT(*) total
      FROM stock_items
      WHERE company_id=$1
      AND current_stock <= 10
      `,
      [company_id]
    );

    res.json({
      success: true,
      dashboard: {
        totalCustomers: Number(customerResult.rows[0].total),
        totalSuppliers: Number(supplierResult.rows[0].total),
        totalStockItems: Number(stockResult.rows[0].total),
        totalSales: Number(salesResult.rows[0].total),
        totalPurchases: Number(purchaseResult.rows[0].total),
        lowStockItems: Number(lowStockResult.rows[0].total),
      },
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
// Recent Sales
// ==========================================
export const getRecentSales = async (req, res) => {

  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
      sv.id,
      sv.invoice_number,
      sv.invoice_date,
      sv.total_amount,
      c.customer_name
      FROM sales_vouchers sv
      JOIN customers c
      ON sv.customer_id=c.id
      WHERE sv.company_id=$1
      ORDER BY sv.created_at DESC
      LIMIT 10
      `,
      [company_id]
    );

    res.json({
      success: true,
      sales: result.rows,
    });

  } catch (error) {

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};

// ==========================================
// Recent Purchases
// ==========================================
export const getRecentPurchases = async (req,res)=>{

  try{

    const company_id=req.company.id;

    const result=await pool.query(
      `
      SELECT
      pv.id,
      pv.voucher_number,
      pv.purchase_date,
      pv.total_amount,
      s.supplier_name
      FROM purchase_vouchers pv
      JOIN suppliers s
      ON pv.supplier_id=s.id
      WHERE pv.company_id=$1
      ORDER BY pv.created_at DESC
      LIMIT 10
      `,
      [company_id]
    );

    res.json({
      success:true,
      purchases:result.rows
    });

  }catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};

// ==========================================
// Low Stock Report
// ==========================================
export const getLowStockItems = async (req,res)=>{

  try{

    const company_id=req.company.id;

    const result=await pool.query(
      `
      SELECT
      item_name,
      sku,
      current_stock,
      purchase_rate,
      selling_rate
      FROM stock_items
      WHERE company_id=$1
      AND current_stock<=10
      ORDER BY current_stock ASC
      `,
      [company_id]
    );

    res.json({
      success:true,
      items:result.rows
    });

  }catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};

// ==========================================
// Top Customers
// ==========================================
export const getTopCustomers = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          c.id,
          c.customer_name,
          c.mobile,
          COALESCE(SUM(sv.total_amount),0) AS total_sales
      FROM customers c
      LEFT JOIN sales_vouchers sv
      ON c.id = sv.customer_id
      WHERE c.company_id = $1
      GROUP BY c.id
      ORDER BY total_sales DESC
      LIMIT 10
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

// ==========================================
// Top Suppliers
// ==========================================
export const getTopSuppliers = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          s.id,
          s.supplier_name,
          s.mobile,
          COALESCE(SUM(pv.total_amount),0) AS total_purchase
      FROM suppliers s
      LEFT JOIN purchase_vouchers pv
      ON s.id = pv.supplier_id
      WHERE s.company_id = $1
      GROUP BY s.id
      ORDER BY total_purchase DESC
      LIMIT 10
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

// ==========================================
// Monthly Sales Analytics
// ==========================================
export const getMonthlySales = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          TO_CHAR(invoice_date,'Mon YYYY') AS month,
          SUM(total_amount) AS total_sales
      FROM sales_vouchers
      WHERE company_id = $1
      GROUP BY
      DATE_TRUNC('month', invoice_date),
      TO_CHAR(invoice_date,'Mon YYYY')
      ORDER BY
      DATE_TRUNC('month', invoice_date)
      `,
      [company_id]
    );

    res.json({
      success: true,
      monthlySales: result.rows,
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
// Monthly Purchase Analytics
// ==========================================
export const getMonthlyPurchases = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          TO_CHAR(purchase_date,'Mon YYYY') AS month,
          SUM(total_amount) AS total_purchase
      FROM purchase_vouchers
      WHERE company_id = $1
      GROUP BY
      DATE_TRUNC('month', purchase_date),
      TO_CHAR(purchase_date,'Mon YYYY')
      ORDER BY
      DATE_TRUNC('month', purchase_date)
      `,
      [company_id]
    );

    res.json({
      success: true,
      monthlyPurchases: result.rows,
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
// Sales vs Purchase
// ==========================================
export const getSalesPurchaseComparison = async (req, res) => {

  try {

    const company_id = req.company.id;

    const sales = await pool.query(
      `
      SELECT
      COALESCE(SUM(total_amount),0) total
      FROM sales_vouchers
      WHERE company_id=$1
      `,
      [company_id]
    );

    const purchase = await pool.query(
      `
      SELECT
      COALESCE(SUM(total_amount),0) total
      FROM purchase_vouchers
      WHERE company_id=$1
      `,
      [company_id]
    );

    res.json({
      success: true,
      sales: Number(sales.rows[0].total),
      purchase: Number(purchase.rows[0].total),
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};