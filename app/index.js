/*
 * Primary API file
 *
 */

// Dependencies
import server from "./lib/server.js";
// import workers from "./lib/workers.js";

// Declear the app
const app = {};

app.init = function (params) {
  // start the server
  server.init();

  // start the workers
  // workers.init();
};

app.init();

export default app;
