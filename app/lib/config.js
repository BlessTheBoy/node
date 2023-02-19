/*
 * Create and export configuration variables.
 *
 */

// Define staging (default) and production enviroment
const enviroment = {
  staging: {
    httpPort: 3000,
    httpsPort: 3001,
    envName: "staging",
    hashingSecret:
      "5c9a2c7a545fbc4b1439b82618602b0bf4c9f712925ded4c0f3493ed25ed8b91",
    iv: "026417ef96430c50162dffe54c8f3099",
    maxChecks: 5,
    twilio: {
      accountSid: process.env["TWILIO_ACCOUNT_SID"],
      authToken: process.env["TWILIO_AUTH_TOKEN"],
      fromPhone: process.env["TWILIO_PHONE"],
    },
  },
  production: {
    httpPort: 5000,
    httpsPort: 5001,
    envName: "production",
    hashingSecret:
      "f0447b60a98100045779393e3d1d8408c4f0325c721ec9bccc25391914ce88d2",
    iv: "9f8906021dd85ec904377d745e63507e",
    maxChecks: 5,
    twilio: {
      accountSid: process.env["TWILIO_ACCOUNT_SID"],
      authToken: process.env["TWILIO_AUTH_TOKEN"],
      fromPhone: process.env["TWILIO_PHONE"],
    },
  },
};

const selectedEnviroment = process.env.NODE_ENV?.toLowerCase();
const enviromentToExport =
  enviroment[selectedEnviroment] || enviroment["staging"];

export default enviromentToExport;
