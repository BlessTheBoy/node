/*
 * Request handlers
 *
 */

import { create, deleteFile, read, update } from "./data.js";
import helpers from "./helpers.js";
import config from "./config.js";

// Dependencies

// Define the handlers
const handlers = {};

// User handler
handlers.users = function (data, callback) {
  const acceptableMethhods = ["post", "get", "put", "delete"];
  if (acceptableMethhods.includes(data.method)) {
    handlers._users[data.method](data, callback);
  } else {
    // method not allowed
    callback(405);
  }
};

// Container for users submethods
handlers._users = {};

// Users - post
// Requierd fields: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (data, callback) {
  let { firstName, lastName, phone, password, tosAgreement } = data.payload;
  firstName = firstName?.trim()?.length > 0 ? firstName.trim() : false;
  lastName = lastName?.trim()?.length > 0 ? lastName.trim() : false;
  phone = phone?.trim()?.length == 10 ? phone.trim() : false;
  password = password?.trim()?.length > 0 ? password.trim() : false;
  tosAgreement = tosAgreement ?? false;

  if (firstName && lastName && phone && password && tosAgreement) {
    read("users", phone)
      .then((error) => {
        callback(400, {
          error: "A user with that phone number already exists.",
        });
      })
      .catch((err) => {
        const hashedPassword = helpers.encrypt(password);
        if (hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement: true,
          };

          create("users", phone, userObject)
            .then(() => {
              callback(200);
            })
            .catch((err) => {
              callback(500, { error: "Could not create the new user" });
            });
        } else {
          callback(500, { error: "Could not hash the user's password" });
        }
      });
  } else {
    callback(400, { error: "Missing required fields!" });
  }
};

// Users - get
// required data - phone
// optional data - none
handlers._users.get = function (data, callback) {
  const phone = data.queryStringObject.get("phone");
  if (phone?.trim()?.length === 10) {
    // Get the tokens from the headers
    const token = data.headers.token;

    // verify that the given token is valid for the phone number.
    handlers._tokens.verifyToken(token, phone).then((valid) => {
      if (valid) {
        // lookup the user
        read("users", phone)
          .then((data) => {
            // remove the hashed password from the user object before returning it to the user
            delete data.hashedPassword;
            callback(200, data);
          })
          .catch((err) => {
            callback(404);
          });
      } else {
        callback(403, {
          error: "Missing required token in header or token is invalid!",
        });
      }
    });
  } else {
    callback(400, { error: "Missing required field!" });
  }
};

// Users - put
// required data - phone
// optional data - firstName, lastName, password (at least one must be specified)
handlers._users.put = function (data, callback) {
  let { firstName, lastName, phone, password } = data.payload;

  firstName = firstName?.trim()?.length > 0 ? firstName.trim() : false;
  lastName = lastName?.trim()?.length > 0 ? lastName.trim() : false;
  phone = phone?.trim()?.length == 10 ? phone.trim() : false;
  password = password?.trim()?.length > 0 ? password.trim() : false;

  if (phone) {
    if (firstName || lastName || password) {
      // Get the tokens from the headers
      const token = data.headers.token;

      handlers._tokens.verifyToken(token, phone).then((valid) => {
        if (valid) {
          read("users", phone)
            .then((data) => {
              if (firstName) {
                data.firstName = firstName;
              }
              if (lastName) data.lastName = lastName;
              if (password) data.hashedPassword = helpers.encrypt(password);

              update("users", phone, data)
                .then((data) => {
                  callback(200);
                })
                .catch((err) => {
                  callback(500, { error: "Could not update the user." });
                });
            })
            .catch((err) => {
              callback(400, { error: "The specified user does not exist." });
            });
        } else {
          callback(403, {
            error: "Missing required token in header or token is invalid!",
          });
        }
      });
    } else {
      callback(400, { error: "Missing fields to update!" });
    }
  } else {
    callback(400, { error: "Missing required field!" });
  }
};

// Users - delete
// required fields: phone
// TODO: Cleanup (delete) any other file associated with the user
handlers._users.delete = function (data, callback) {
  const phone = data.queryStringObject.get("phone");
  if (phone?.trim()?.length === 10) {
    // Get the tokens from the headers
    const token = data.headers.token;

    handlers._tokens.verifyToken(token, phone).then((valid) => {
      if (valid) {
        // lookup the user
        read("users", phone)
          .then((data) => {
            // remove the user object
            deleteFile("users", phone)
              .then(() => {
                callback(200);
              })
              .catch((err) => {
                callback(500, { Error: "Could not delete the specified user" });
              });
          })
          .catch((err) => {
            callback(400, { Error: "Could not find the specified user." });
          });
      } else {
        callback(403, {
          error: "Missing required token in header or token is invalid!",
        });
      }
    });
  } else {
    callback(400, { error: "Missing required field!" });
  }
};

// Tokens handler
handlers.tokens = function (data, callback) {
  const acceptableMethhods = ["post", "get", "put", "delete"];
  if (acceptableMethhods.includes(data.method)) {
    handlers._tokens[data.method](data, callback);
  } else {
    // method not allowed
    callback(405);
  }
};

handlers._tokens = {};

// required data: phone, password
handlers._tokens.post = function (data, callback) {
  let { phone, password } = data.payload;

  phone = phone?.trim()?.length == 10 ? phone.trim() : false;
  password = password?.trim()?.length > 0 ? password.trim() : false;

  if (phone && password) {
    // Lookup the user
    read("users", phone)
      .then((data) => {
        let hashedPassword = helpers.encrypt(password);
        if (hashedPassword == data.hashedPassword) {
          // Create a new token with an random name. set expiration date on hour in the future.
          const tokenId = helpers.createRandomString();
          const expires = Date.now() + 1000 * 60 * 60;

          const tokenObject = {
            phone,
            id: tokenId,
            expires,
          };

          create("tokens", tokenId, tokenObject)
            .then((data) => {
              callback(200, tokenObject);
            })
            .catch((err) => {
              callback(500, { Error: "Could not create the new token." });
            });
        } else {
          callback(400, {
            Error:
              "Password did not match the specified user's stored password",
          });
        }
      })
      .catch((err) => {
        callback(400, {
          Error: "Could not find the specified user",
        });
      });
  } else {
    callback(400, { Error: "Missing required field(s)" });
  }
};

// Required data: id.
// Optional data: none.
handlers._tokens.get = function (data, callback) {
  const id = data.queryStringObject.get("id");
  if (id?.trim()?.length > 10) {
    // lookup the token
    read("tokens", id)
      .then((data) => {
        callback(200, data);
      })
      .catch((err) => {
        callback(404);
      });
  } else {
    callback(400, { error: "Missing required field!" });
  }
};

// Required data: id, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
  let { id, extend } = data.payload;

  console.log("id", id);

  id = id?.trim()?.length > 0 ? id.trim() : false;
  if (id && extend) {
    read("tokens", id)
      .then((data) => {
        if (data.expires > Date.now()) {
          data.expires = Date.now() + 1000 * 60 * 60;

          update("tokens", id, data)
            .then(() => {
              callback(200);
            })
            .catch((err) => {
              callback(500, {
                error: "Could not update the token's expiration",
              });
            });
        } else {
          callback(400, {
            error: "The token has expired and cannot be extended.",
          });
        }
      })
      .catch((err) => {
        callback(400, { error: "Specified token does not exist" });
      });
  } else {
    callback(400, {
      error: "Missing required field(s) or field(s) are invalid.",
    });
  }
};

// Required data: id, extend
// Optional data: none
handlers._tokens.delete = function (data, callback) {
  const id = data.queryStringObject.get("id");
  if (id?.trim()?.length > 10) {
    // lookup the user
    read("tokens", id)
      .then((data) => {
        // remove the token object
        deleteFile("tokens", id)
          .then(() => {
            callback(200);
          })
          .catch((err) => {
            callback(500, { Error: "Could not delete the specified token" });
          });
      })
      .catch((err) => {
        callback(400, { Error: "Could not find the specified token." });
      });
  } else {
    callback(400, { error: "Missing required field!" });
  }
};

// Verify if a given tokenId is currently valid for a given user
handlers._tokens.verifyToken = function (id, phone) {
  return new Promise((resolve, reject) => {
    read("tokens", id)
      .then((data) => {
        if (data.phone == phone && data.expires > Date.now()) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((err) => {
        resolve(false);
      });
  });
};

// checks handler
handlers.checks = function (data, callback) {
  const acceptableMethhods = ["post", "get", "put", "delete"];
  if (acceptableMethhods.includes(data.method)) {
    handlers._checks[data.method](data, callback);
  } else {
    // method not allowed
    callback(405);
  }
};

handlers._checks = {};

// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
handlers._checks.post = function (data, callback) {
  // Validate inputs
  let { protocol, url, method, successCodes, timeoutSeconds } = data.payload;

  protocol = ["http", "https"].includes(protocol) ? protocol : false;
  url = url?.trim()?.length > 0 ? url.trim() : false;
  method = ["post", "get", "put", "delete"].includes(method) ? method : false;
  successCodes =
    successCodes instanceof Array && successCodes.length > 0
      ? successCodes
      : false;
  timeoutSeconds =
    typeof timeoutSeconds == "number" &&
    timeoutSeconds % 1 == 0 &&
    timeoutSeconds >= 1 &&
    timeoutSeconds <= 5
      ? timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // check that user is authenticate
    const token = data.headers.token;
    if (token) {
      read("tokens", token).then((data) => {
        const { phone } = data;

        read("users", phone).then((user) => {
          const { checks } = user;
          if (!checks || checks.length < config.maxChecks) {
            // create new check
            const checkId = helpers.createRandomString();

            const checkObject = {
              id: checkId,
              phone,
              protocol,
              url,
              method,
              successCodes,
              timeoutSeconds,
            };

            create("checks", checkId, checkObject)
              .then(() => {
                user.checks = [
                  ...(typeof checks == "object" ? checks : []),
                  checkId,
                ];

                update("users", phone, user)
                  .then(() => {
                    callback(200, checkObject);
                  })
                  .catch(() => {
                    callback(500, {
                      error: "Could not update the user with the new check",
                    });
                  });
              })
              .catch(() => {
                callback(500, {
                  error: "Could not create the new check",
                });
              });
          } else {
            callback(400, {
              error: "User already have the maximum number of 5 checks",
            });
          }
        });
      });
    } else {
      callback(403, { error: "Request is unauthorized" });
    }
  } else {
    callback(400, { error: "Missing required field!" });
  }
};

// Requierd fields: id
// Optional data: none
handlers._checks.get = function (data, callback) {
  const id = data.queryStringObject.get("id");
  if (id?.trim()?.length > 10) {
    // lookup the check
    read("checks", id)
      .then((checkData) => {
        // Get the tokens from the headers
        const token = data.headers.token;

        // verify that the given token is valid for the phone number.
        handlers._tokens.verifyToken(token, checkData.phone).then((valid) => {
          if (valid) {
            callback(200, checkData);
          } else {
            callback(403, {
              error: "Missing required token in header or token is invalid!",
            });
          }
        });
      })
      .catch((err) => {
        callback(404, { Error: "Check Id did not exist" });
      });
  } else {
    callback(400, { error: "Missing required field!" });
  }
};

// Requierd fields: id
// Optional data: protocol, url, method, successCodes, timeoutSeconds: one must be sent
handlers._checks.put = function (data, callback) {
  // Validate inputs
  let { id, protocol, url, method, successCodes, timeoutSeconds } =
    data.payload;

  id = id?.trim()?.length > 0 ? id.trim() : false;
  protocol = ["http", "https"].includes(protocol) ? protocol : false;
  url = url?.trim()?.length > 0 ? url.trim() : false;
  method = ["post", "get", "put", "delete"].includes(method) ? method : false;
  successCodes =
    successCodes instanceof Array && successCodes.length > 0
      ? successCodes
      : false;
  timeoutSeconds =
    typeof timeoutSeconds == "number" &&
    timeoutSeconds % 1 == 0 &&
    timeoutSeconds >= 1 &&
    timeoutSeconds <= 5
      ? timeoutSeconds
      : false;

  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      read("checks", id)
        .then((checkData) => {
          // Get the tokens from the headers
          const token = data.headers.token;

          handlers._tokens.verifyToken(token, checkData.phone).then((valid) => {
            if (valid) {
              if (protocol) checkData.protocol = protocol;
              if (url) checkData.url = url;
              if (method) checkData.method = method;
              if (successCodes) checkData.successCodes = successCodes;
              if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;

              update("checks", id, checkData)
                .then((data) => {
                  callback(200);
                })
                .catch((err) => {
                  callback(500, { error: "Could not update the check." });
                });
            } else {
              callback(403, {
                error: "Missing required token in header or token is invalid!",
              });
            }
          });
        })
        .catch((err) => {
          callback(404, { Error: "Check Id did not exist" });
        });
    } else {
      callback(400, { error: "Missing fields to update!" });
    }
  } else {
    callback(400, { error: "Missing required field!" });
  }
};

// Requierd fields: id
// Optional data: none
handlers._checks.delete = function (data, callback) {
  let id = data.queryStringObject.get("id");

  id = id?.trim()?.length > 0 ? id.trim() : false;

  if (id) {
    read("checks", id)
      .then((checkData) => {
        // Get the tokens from the headers
        const token = data.headers.token;

        handlers._tokens.verifyToken(token, checkData.phone).then((valid) => {
          if (valid) {
            // lookup the user
            read("users", checkData.phone)
              .then((userData) => {
                // remove the user object
                deleteFile("checks", id)
                  .then(() => {
                    userData.checks = userData.checks.filter(
                      (check) => check !== id
                    );

                    update("users", checkData.phone, userData)
                      .then(() => {
                        callback(200);
                      })
                      .catch(() => {
                        callback(500, {
                          error:
                            "Could not update the user after deleting the check",
                        });
                      });
                    callback(200);
                  })
                  .catch((err) => {
                    callback(500, {
                      Error: "Could not delete the specified check",
                    });
                  });
              })
              .catch((err) => {
                callback(400, { Error: "Could not find the specified user." });
              });
          } else {
            callback(403, {
              error: "Missing required token in header or token is invalid!",
            });
          }
        });
      })
      .catch((err) => {
        callback(404, { Error: "Check Id did not exist" });
      });
  } else {
    callback(400, { error: "Missing required field!" });
  }
};

// Ping handler
handlers.ping = function (data, callback) {
  callback(200);
};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

export default handlers;
