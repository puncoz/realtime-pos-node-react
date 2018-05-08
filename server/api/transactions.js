// Necessary dependencies are assigned to variables
const app = require("express")(),
    server = require("http").Server(app),
    bodyParser = require("body-parser"),
    Datastore = require("nedb");

const Inventory = require("./inventory");

app.use(bodyParser.json());

module.exports = app;

// Create Database
const Transactions = new Datastore({
  filename: "./databases/transactions.db",
  autoload: true,
});

// default path
app.get("/", function(req, res) {
  res.send("Transactions API");
});

// GET all transactions
app.get("/all", function(req, res) {
  Transactions.find({}, function(err, docs) {
    res.send(docs);
  });
});

// GET all transactions with limit
app.get("/limit", function(req, res) {
  let limit = parseInt(req.query.limit, 10);

  if (!limit) {
    limit = 5;
  }

  Transactions.find({}).limit(limit).sort({
    date: -1,
  }).exec(function(err, docs) {
    res.send(docs);
  });
});

// GET total sales for the current day
app.get("/day-total", function(req, res) {
  let startDate, endDate;

  if (req.query.date) {
    startDate = new Date(req.query.date).setHours(0, 0, 0, 0);

    endDate = new Date(req.query.date).setHours(23, 59, 59, 999);
  } else {
    startDate = new Date().setHours(0, 0, 0, 0);
    endDate = new Date().setHours(23, 59, 59, 999);
  }

  Transactions.find({
    date: {
      $gte: startDate.toJSON(),
      $lte: endDate.toJSON(),
    },
  }, function(err, docs) {
    const result = {
      date: startDate,
    };

    if (docs) {
      const total = docs.reduce((p, c) => p + c.total(), 0.00);

      result.total = parseFloat(parseFloat(total).toFixed(2));

      res.send(result);
    } else {
      result.total = 0;
      res.send(result);
    }
  });
});

// GET transactions for a particular date
app.get("/by-date", function(req, res) {
  const startDate = new Date(req.query.date).setHours(0, 0, 0, 0),
      endDate = new Date(req.query.date).setHours(23, 59, 59, 999);

  Transactions.find({
    date: {
      $gte: startDate.toJSON(),
      $lte: endDate.toJSON(),
    },
  }, function(err, docs) {
    if (docs) {
      res.send(docs);
    }
  });
});

// Add new transactions
app.post("/new", function(req, res) {
  const newTransaction = req.body;

  Transactions.insert(newTransaction, function(err, transaction) {
    if (err) {
      res.stat(500).send(err);
    } else {
      res.sendStatus(200);

      Inventory.decrementInventory(transaction.products);
    }
  });
});

// GET a single transactions
app.get("/:transactionId", function(req, res) {
  Transactions.find({
    _id: req.params.transactionId,
  }, function(err, doc) {
    if (doc) {
      res.send(doc[0]);
    }
  });
});

