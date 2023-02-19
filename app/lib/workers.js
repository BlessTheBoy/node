/*
 * Workers realated tasks
 *
 */

// Dependencies
import http from "node:http";
import https from "node:https";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import helpers from "./helpers.js";
import { create, deleteFile, read, update } from "./data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);