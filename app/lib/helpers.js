/*
 * Helpers for various tasks
 *
 */

// Dependencies
import crypto from "node:crypto";
import config from "./config.js";
import queryString from "node:querystring";
import https from "node:https";

const helpers = {};

helpers.encrypt = (password) => {
  let cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(config.hashingSecret, "hex"),
    Buffer.from(config.iv, "hex")
  );
  let encrypted = cipher.update(password);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
};

helpers.decrypt = (text) => {
  let iv = Buffer.from(config.iv, "hex");
  let encryptedText = Buffer.from(text, "hex");
  let decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(config.hashingSecret, "hex"),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

helpers.parseJsonToObject = (string) => {
  try {
    let obj = JSON.parse(string);
    return obj;
  } catch (error) {
    return {};
  }
};

helpers.createRandomString = function (length) {
  return crypto.randomBytes(length ?? 16).toString("hex");
};

helpers.sendTwilioSms = (phone, message) => {
  return new Promise((resolve, reject) => {
    // validate parameters
    phone = phone?.trim()?.length == 10 ? phone.trim() : false;
    message =
      message?.trim()?.length > 0 && message.trim.length <= 1600
        ? message.trim()
        : false;

    if (phone && message) {
      // configure the request payload
      let payload = {
        From: config.twilio.fromPhone,
        To: "+234" + phone,
        Body: message,
      };

      // stringify the payload
      const stringPayload = queryString.stringify(payload);

      const requestDetails = {
        protocol: "https:",
        hostname: "api.twilio.com",
        method: "POST",
        path:
          "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
        auth: config.twilio.accountSid + ":" + config.twilio.authToken,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(stringPayload),
        },
      };

      // instatiate the https request
      const request = https.request(requestDetails, (res) => {
        // grab the status of the sent request
        const status = res.statusCode;
        if (status == 200 || status == 201) {
          resolve(true);
        } else {
          reject("Status code returned was " + status);
        }
      });

      request.on("error", (e) => {
        reject(e.message);
      });

      request.write(stringPayload);

      // End the request
      request.end();
    } else {
      throw new Error("Given parameters were missing or invalid");
    }
  });
};

export default helpers;
