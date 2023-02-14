/*
 * Helpers for various tasks
 *
 */

// Dependencies
import crypto from "node:crypto";
import config from "./config.js";

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

export default helpers;
