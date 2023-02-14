/*
 * Request handlers
 *
 */

import { create, read, update } from "./data.js";
import helpers from "./helpers.js";

// Dependencies

// Define the handlers
const handlers = {};

// Ping handler
handlers.ping = function (data, callback) {
  callback(200);
};

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
  firstName = firstName.trim().length > 0 ? firstName.trim() : false;
  lastName = lastName.trim().length > 0 ? lastName.trim() : false;
  phone = phone.trim().length == 10 ? phone.trim() : false;
  password = password.trim().length > 0 ? password.trim() : false;
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
// TODO: only let an authenticated user access their object, don't let them access anyone else's
handlers._users.get = function (data, callback) {
  const phone = data.queryStringObject.get("phone");
  console.log("phone", phone);
  if (phone?.trim()?.length === 10) {
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
    callback(400, { error: "Missing required field!" });
  }
};

// Users - put
// required data - phone
// optional data - firstName, lastName, password (at least one must be specified)
// TODO: only let an authenticated user update their own object, don't let them update others.
handlers._users.put = function (data, callback) {
  let { firstName, lastName, phone, password } = data.payload;

  console.log('phone', phone)

  firstName = firstName?.trim()?.length > 0 ? firstName.trim() : false;
  lastName = lastName?.trim()?.length > 0 ? lastName.trim() : false;
  phone = phone?.trim()?.length == 10 ? phone.trim() : false;
  password = password?.trim()?.length > 0 ? password.trim() : false;

  if (phone) {
    if (firstName || lastName || password) {
      read("users", phone)
        .then((data) => {
          if (firstName) {
            data.firstName = firstName;
          }
          if (lastName) data.lastName = lastName;
          if (password) data.hashedPassword = helpers.encrypt(password);

          update("users", phone, data)
            .then((data) => {
              callback(200)
            })
            .catch((err) => {
              callback(500, { error: "Could not update the user." });
            });
        })
        .catch((err) => {
          callback(400, { error: "The specified user does not exist." });
        });
    } else {
      callback(400, { error: "Missing fields to update!" });
    }
  } else {
    callback(400, { error: "Missing required field!" });
  }
};

// Users - delete
handlers._users.delete = function (data, callback) {};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

export default handlers;
