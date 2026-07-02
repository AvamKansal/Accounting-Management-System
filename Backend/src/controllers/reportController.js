import pool from "../config/db.js";

// ==========================================
// Trial Balance
// ==========================================
export const getTrialBalance = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          ledger_name,
          ledger_group,
          opening_balance,
          current_balance
      FROM ledgers
      WHERE company_id = $1
      ORDER BY ledger_group,
               ledger_name
      `,
      [company_id]
    );

    let totalDebit = 0;
    let totalCredit = 0;

    const trialBalance = result.rows.map((ledger) => {

      const balance = Number(ledger.current_balance);

      let debit = 0;
      let credit = 0;

      if (balance >= 0) {
        debit = balance;
        totalDebit += balance;
      } else {
        credit = Math.abs(balance);
        totalCredit += Math.abs(balance);
      }

      return {
        ledger_name: ledger.ledger_name,
        ledger_group: ledger.ledger_group,
        debit,
        credit,
      };

    });

    res.json({
      success: true,
      totalDebit,
      totalCredit,
      trialBalance,
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
// Ledger Report
// ==========================================
export const getLedgerReport = async (req, res) => {
  try {

    const company_id = req.company.id;
    const { ledgerId } = req.params;

    // Get Ledger Details
    const ledgerResult = await pool.query(
      `
      SELECT *
      FROM ledgers
      WHERE id = $1
      AND company_id = $2
      `,
      [ledgerId, company_id]
    );

    if (ledgerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ledger not found.",
      });
    }

    const ledger = ledgerResult.rows[0];

    // Get Transactions
    const entryResult = await pool.query(
      `
      SELECT
          voucher_type,
          voucher_id,
          entry_type,
          amount,
          narration,
          created_at
      FROM ledger_entries
      WHERE company_id = $1
      AND ledger_id = $2
      ORDER BY created_at ASC
      `,
      [company_id, ledgerId]
    );

    let runningBalance =
      Number(ledger.opening_balance);

    const transactions = entryResult.rows.map((entry) => {

      if (entry.entry_type === "DR") {
        runningBalance += Number(entry.amount);
      } else {
        runningBalance -= Number(entry.amount);
      }

      return {
        ...entry,
        running_balance: runningBalance,
      };

    });

    res.json({
      success: true,
      ledger: {
        id: ledger.id,
        ledger_name: ledger.ledger_name,
        ledger_group: ledger.ledger_group,
        opening_balance: ledger.opening_balance,
        current_balance: ledger.current_balance,
      },
      transactions,
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
// Profit & Loss Report
// ==========================================
export const getProfitLoss = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          ledger_group,
          current_balance
      FROM ledgers
      WHERE company_id = $1
      `,
      [company_id]
    );

    let sales = 0;
    let purchase = 0;
    let directExpense = 0;
    let indirectExpense = 0;
    let indirectIncome = 0;

    result.rows.forEach((ledger) => {

      const balance = Number(ledger.current_balance);

      switch (ledger.ledger_group) {

        case "Sales Accounts":
          sales += Math.abs(balance);
          break;

        case "Purchase Accounts":
          purchase += Math.abs(balance);
          break;

        case "Direct Expenses":
          directExpense += Math.abs(balance);
          break;

        case "Indirect Expenses":
          indirectExpense += Math.abs(balance);
          break;

        case "Indirect Income":
          indirectIncome += Math.abs(balance);
          break;

      }

    });

    const grossProfit =
      sales - purchase - directExpense;

    const netProfit =
      grossProfit + indirectIncome - indirectExpense;

    res.json({
      success: true,
      report: {
        sales,
        purchase,
        directExpense,
        indirectExpense,
        indirectIncome,
        grossProfit,
        netProfit,
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
// Balance Sheet Report
// ==========================================
export const getBalanceSheet = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          ledger_name,
          ledger_group,
          current_balance
      FROM ledgers
      WHERE company_id = $1
      ORDER BY ledger_group, ledger_name
      `,
      [company_id]
    );

    const assets = [];
    const liabilities = [];
    const equity = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    result.rows.forEach((ledger) => {

      const balance = Number(ledger.current_balance);

      switch (ledger.ledger_group) {

        case "Current Assets":
        case "Bank Accounts":
        case "Fixed Assets":
          assets.push({
            ledger_name: ledger.ledger_name,
            balance,
          });
          totalAssets += balance;
          break;

        case "Current Liabilities":
        case "Loans":
        case "Duties & Taxes":
          liabilities.push({
            ledger_name: ledger.ledger_name,
            balance: Math.abs(balance),
          });
          totalLiabilities += Math.abs(balance);
          break;

        case "Capital Account":
          equity.push({
            ledger_name: ledger.ledger_name,
            balance: Math.abs(balance),
          });
          totalEquity += Math.abs(balance);
          break;

      }

    });

    res.json({
      success: true,
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity:
        totalLiabilities + totalEquity,
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
// Stock Valuation Report
// ==========================================
export const getStockValuation = async (req, res) => {
  try {

    const company_id = req.company.id;

    const result = await pool.query(
      `
      SELECT
          id,
          item_name,
          sku,
          purchase_rate,
          selling_rate,
          current_stock
      FROM stock_items
      WHERE company_id = $1
      ORDER BY item_name
      `,
      [company_id]
    );

    let totalPurchaseValue = 0;
    let totalSellingValue = 0;

    const stock = result.rows.map((item) => {

      const purchaseValue =
        Number(item.purchase_rate || 0) *
        Number(item.current_stock || 0);

      const sellingValue =
        Number(item.selling_rate || 0) *
        Number(item.current_stock || 0);

      totalPurchaseValue += purchaseValue;
      totalSellingValue += sellingValue;

      return {
        ...item,
        purchase_value: purchaseValue,
        selling_value: sellingValue,
      };

    });

    res.json({
      success: true,
      totalItems: stock.length,
      totalPurchaseValue,
      totalSellingValue,
      stock,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};