import { onRequest } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import app from "./server.js";

// Export the Express app as a Cloud Function called 'api'
// Note: We use 'api' as the function name, but the rewrite will handle the routing.
export const api = onRequest(app);
