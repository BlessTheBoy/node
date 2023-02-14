import crypto from "node:crypto";
import config from "./config.js";

const encryptPassword = (text) => {
  let cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(config.hashingSecret, "hex"),
    Buffer.from(config.iv, "hex")
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
};

function decrypt(text) {
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
}

let text = "hello world";

let encryptedText = encryptPassword(text);
console.log("encryptedText", encryptedText);

let decryptedText = decrypt(encryptedText);
console.log("decryptedText", decryptedText);

// console.log("key1", key1.toString());
// console.log("iv1", iv1.toString());
