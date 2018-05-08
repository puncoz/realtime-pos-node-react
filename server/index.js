// Dependencies assigned to variables
const express = require("express"),
    http = require("http"),
    app = require("express")(),
    server = http.createServer(app),
    bodyParser = require("body-parser"),
    io = require("socket.io")(server);

const port = process.env.PORT || 8001;
let liveCart = [];

console.log("Real time POS running");
console.log("Server started");

// The express variable app is used to allows data to be sent to the database
// using http request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// the node app is restricted to resources within using CORS and allows specified
// methods "GET, PUT, POST, DELETE, and OPTIONS" to be used
app.all("/*", function(req, res, next) {
  // CORS headers
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-type, Accept, X-Access-Token, X-Key");

  if (req.method === "OPTIONS") {
    res.status(200).end();
  } else {
    next();
  }
});

// node app default route
app.get("/", function(req, res) {
  res.send("Real time POS web app running.");
});

// Imported files that will represent inventory and transactions routes
app.use("/api/inventory", require("./api/inventory"));
app.use("/api", require("./api/transactions"));

// Web-socket logic for Live Cart
io.on("connection", function(socket) {
  socket.on("cart-transaction-complete", function() {
    socket.broadcast.emit("update-live-cart-display", {});
  });

  // on page load, show user current cart
  socket.on("live-cart-page-loaded", function() {
    socket.emit("update-live-cart-display", liveCart);
  });

  // when client connected, make client update live cart
  socket.emit("update-live-cart-display", liveCart);

  // when the cart data is updated by the POS
  socket.on("update-live-cart", function(cartData) {
    // keep track of it
    liveCart = cartData;

    // broadcast updated live cart to all web-socket clients
    socket.broadcast.emit("update-live-cart-display", liveCart);
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
