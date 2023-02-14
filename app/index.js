/*
 * Primary API file
 *
 */

// Dependencies
import http from "node:http";
import https from "node:https";
import * as fs from "node:fs";
import { StringDecoder } from "node:string_decoder";
import config from "./lib/config.js";
import handlers from "./lib/handlers.js";
import helpers from "./lib/helpers.js";

// Instantiate the HTTP server
const httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, function () {
  console.log("Server is listening on port", config.httpPort);
});

// HTTPS options
const httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};

// Instatiate the HTTPS server
const httpsServer = https.createServer(httpsServerOptions, function (req, res) {
  unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPport, function () {
  console.log("Server is listening on port", config.httpsPort);
});

// All the logic for both HTTP and HTTPS request
const unifiedServer = function (req, res) {
  // Get the url and parse it
  const parsedUrl = new URL(req.url, "http://localhost:3000");
  //   URL {
  //   href: 'http://localhost:3000/status?name=ryan',
  //   origin: 'http://localhost:3000',
  //   protocol: 'http:',
  //   username: '',
  //   password: '',
  //   host: 'localhost:3000',
  //   hostname: 'localhost',
  //   port: '3000',
  //   pathname: '/status',
  //   search: '?name=ryan',
  //   searchParams: URLSearchParams { 'name' => 'ryan' },
  //   hash: ''
  // }

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get query string as an object
  const queryStringObject = parsedUrl.searchParams;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder("utf8");
  var payload = "";
  req.on("data", function (data) {
    payload += decoder.write(data);
  });
  req.on("end", function () {
    payload += decoder.end();

    // Choose the handler this request should go to. If none, send to the not-found handler
    const choosenHandler = router[trimmedPath] || handlers.notFound;

    console.log("queryStringObject", queryStringObject);

    // Construct the data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(payload),
    };

    // Route the request to the handlers specified in the router.
    choosenHandler(data, function (statusCode = 200, payload = {}) {
      // Convert payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.writeHead(statusCode, {
        "Content-Length": Buffer.byteLength(payloadString),
        "Content-Type": "application/json",
      });
      res.end(payloadString);

      // Log the response
      console.log("Returning this response", statusCode, payloadString);
    });
  });
};

// Define a request router
const router = {
  ping: handlers.ping,
  users: handlers.users,
};
