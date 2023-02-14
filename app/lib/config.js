/*
 * Create and export configuration variables.
 *
 */

import crypto from "node:crypto";

// Define staging (default) and production enviroment
const enviroment = {
  staging: {
    httpPort: 3000,
    httpsPort: 3001,
    envName: "staging",
    hashingSecret:
      "5c9a2c7a545fbc4b1439b82618602b0bf4c9f712925ded4c0f3493ed25ed8b91",
    iv: "026417ef96430c50162dffe54c8f3099",
  },
  production: {
    httpPort: 5000,
    httpsPort: 5001,
    envName: "production",
    hashingSecret:
      "f0447b60a98100045779393e3d1d8408c4f0325c721ec9bccc25391914ce88d2",
    iv: "9f8906021dd85ec904377d745e63507e",
  },
};

const selectedEnviroment = process.env.NODE_ENV?.toLowerCase();
const enviromentToExport =
  enviroment[selectedEnviroment] || enviroment["staging"];

export default enviromentToExport;
