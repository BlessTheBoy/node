/*
 * Server realated tasks
 *
 */

// Dependencies
import http from "node:http";
import https from "node:https";
import * as fs from "node:fs";
import { StringDecoder } from "node:string_decoder";

import config from "./config.js";
import handlers from "./handlers.js";
import helpers from "./helpers.js";
import path from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer(function (req, res) {
  server.unifiedServer(req, res);
});

// HTTPS options
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem")),
};

// Instatiate the HTTPS server
server.httpsServer = https.createServer(
  server.httpsServerOptions,
  function (req, res) {
    server.unifiedServer(req, res);
  }
);

// All the logic for both HTTP and HTTPS request
server.unifiedServer = function (req, res) {
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
    const choosenHandler = server.router[trimmedPath] || handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(payload),
      req,
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
server.router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
};

// Start the HTTP & HTTPS server
server.init = () => {
  server.httpServer.listen(config.httpPort, function () {
    console.log("Server is listening on port", config.httpPort);
  });

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPport, function () {
    console.log("Server is listening on port", config.httpsPort);
  });
};

export default server;
