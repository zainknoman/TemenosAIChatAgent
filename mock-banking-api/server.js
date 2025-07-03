// mock-banking-api/server.js
const express = require("express");
const cors = require("cors"); // Import cors middleware
const app = express();
const port = 3002;

// Enable CORS for all origins during development
// In production, configure CORS more restrictively
app.use(cors());
app.use(express.json()); // To parse JSON request bodies

// --- Mock Data for Temenos T24 Simulation ---
const mockAccounts = {
  12345: {
    accountId: "12345",
    accountName: "John Doe Checking",
    balance: 15230.75,
    currency: "USD",
    type: "Checking",
  },
  67890: {
    accountId: "67890",
    accountName: "John Doe Savings",
    balance: 45000.0,
    currency: "USD",
    type: "Savings",
  },
  98765: {
    accountId: "98765",
    accountName: "Jane Smith Business",
    balance: 120000.5,
    currency: "USD",
    type: "Business Checking",
  },
};

const mockTransactions = {
  12345: [
    {
      id: "t001",
      date: "2024-06-28",
      description: "Grocery Store",
      amount: -75.2,
      type: "debit",
    },
    {
      id: "t002",
      date: "2024-06-27",
      description: "Salary Deposit",
      amount: 3500.0,
      type: "credit",
    },
    {
      id: "t003",
      date: "2024-06-26",
      description: "Online Subscription",
      amount: -15.99,
      type: "debit",
    },
    {
      id: "t004",
      date: "2024-06-25",
      description: "Restaurant",
      amount: -45.0,
      type: "debit",
    },
  ],
  67890: [
    {
      id: "t005",
      date: "2024-06-29",
      description: "Interest Earned",
      amount: 12.5,
      type: "credit",
    },
    {
      id: "t006",
      date: "2024-06-20",
      description: "Transfer to Checking",
      amount: -1000.0,
      type: "debit",
    },
    {
      id: "t007",
      date: "2024-06-15",
      description: "Deposit",
      amount: 500.0,
      type: "credit",
    },
  ],
  98765: [
    {
      id: "t008",
      date: "2024-06-30",
      description: "Client Payment",
      amount: 15000.0,
      type: "credit",
    },
    {
      id: "t009",
      date: "2024-06-28",
      description: "Office Supplies",
      amount: -210.5,
      type: "debit",
    },
    {
      id: "t010",
      date: "2024-06-25",
      description: "Utilities Bill",
      amount: -350.0,
      type: "debit",
    },
  ],
};

// --- API Endpoints ---

/**
 * @api {get} /account-balance/:accountId Get Account Balance
 * @apiName GetAccountBalance
 * @apiGroup Account
 * @apiParam {String} accountId Account ID.
 * @apiSuccess {Object} account Account details including balance.
 * @apiError {Object} 404 Account not found.
 */
app.get("/account-balance/:accountId", (req, res) => {
  const accountId = req.params.accountId;
  const account = mockAccounts[accountId];

  if (account) {
    console.log(`[Mock API] Returning balance for account: ${accountId}`);
    res.json({
      status: "success",
      data: account,
    });
  } else {
    console.warn(`[Mock API] Account not found: ${accountId}`);
    res.status(404).json({
      status: "error",
      message:
        "Account not found. Please provide a valid account ID (e.g., 12345, 67890, 98765).",
    });
  }
});

/**
 * @api {get} /transaction-history/:accountId Get Transaction History
 * @apiName GetTransactionHistory
 * @apiGroup Account
 * @apiParam {String} accountId Account ID.
 * @apiSuccess {Object[]} transactions List of transactions for the account.
 * @apiError {Object} 404 Account not found or no transactions.
 */
app.get("/transaction-history/:accountId", (req, res) => {
  const accountId = req.params.accountId;
  const transactions = mockTransactions[accountId];

  if (transactions) {
    console.log(
      `[Mock API] Returning transaction history for account: ${accountId}`
    );
    res.json({
      status: "success",
      data: transactions,
    });
  } else {
    console.warn(`[Mock API] Transactions not found for account: ${accountId}`);
    res.status(404).json({
      status: "error",
      message:
        "No transaction history found for this account. Please provide a valid account ID (e.g., 12345, 67890, 98765).",
    });
  }
});

/**
 * @api {get} /accounts Get All Accounts (for demonstration)
 * @apiName GetAllAccounts
 * @apiGroup Account
 * @apiSuccess {Object[]} accounts List of all mock accounts.
 */
app.get("/accounts", (req, res) => {
  console.log("[Mock API] Returning all mock accounts.");
  res.json({
    status: "success",
    data: Object.values(mockAccounts),
  });
});

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("Mock Banking API is healthy");
});

// Start the server
app.listen(port, () => {
  console.log(`Mock Banking API listening at http://localhost:${port}`);
});
