/*
 * Library for storing and editing data.
 *
 */

import * as fsPromises from "node:fs/promises";
// import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import helpers from "./helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const baseDir = path.join(__dirname, "/../.data/");

export const create = function (dir, file, data) {
  return fsPromises
    .open(baseDir + dir + "/" + file + ".json", "wx")
    .then(async (fileHandle) => {
      const stringData = JSON.stringify(data);
      await fsPromises.writeFile(fileHandle, stringData);
      return fileHandle.close().catch((err) => {
        throw new Error("Error writing to new file");
      });
    })
    .catch((err) => {
      throw new Error("Could not create new file, it may already exist.");
    });
};

export const read = function (dir, file) {
  return fsPromises
    .readFile(baseDir + dir + "/" + file + ".json", "utf8")
    .then((file) => {
      return helpers.parseJsonToObject(file);
    })
    .catch((err) => {
      throw new Error("Error reading the file " + file + ".json");
    });
};

export const update = function (dir, file, data) {
  const path = baseDir + dir + "/" + file + ".json";
  return fsPromises
    .open(path, "r+")
    .then(async (fileHandle) => {
      await fsPromises.truncate(path);
      const stringData = JSON.stringify(data);
      await fsPromises.writeFile(fileHandle, stringData);
      return fileHandle.close().catch((err) => {
        throw new Error("Error writing to new file");
      });
    })
    .catch((err) => {
      throw new Error("Could not create new file, it may already exist.");
    });
};

export const deleteFile = function (dir, file) {
  return fsPromises
    .unlink(baseDir + dir + "/" + file + ".json")
    .catch((err) => {
      throw new Error("Error deleting the file " + file + ".json");
    });
};

export const listFiles = function (dirname) {
  return fsPromises.readdir(baseDir + dirname + "/").then((files) => {
    const trimmedFileNames = [];
    for (const file of files) {
      trimmedFileNames.push(file.replace(".json", ""));
    }
    return trimmedFileNames;
  });
};
