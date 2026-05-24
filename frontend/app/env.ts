/**
 * WELCOME TO ENVIRONMENT VALIDATION!
 * 
 * Analogy:
 * Think of this file like a security inspector at the entrance of a theme park. 
 * Before visitors (our code) are allowed to go on any rides, the inspector checks 
 * if they have their entry tickets and meet the height requirements (our env variables).
 * If a visitor is missing their ticket, the inspector stops everything immediately at the gate
 * rather than letting them wait in line only to get turned away at the ride!
 * 
 * Zod is our digital inspection checklist. It defines exactly what settings must exist
 * and what format they must be in.
 */
import { z } from 'zod';

// 1. Define the Checklist Schema
// We create a schema (an object definition) describing our variables.
// Here, we require "NEXT_PUBLIC_API_URL" and enforce that it must be a valid website URL.
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url({
    message: "NEXT_PUBLIC_API_URL must be a valid URL address (e.g. http://localhost:8000/api)"
  }),
});

// 2. Collect Active Variables
// We bundle up our active system configurations inside a plain object.
// process.env is the vault where Node.js stores all environment settings.
const processEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
};

// 3. Perform the Inspection Check
// 'safeParse' runs our processEnv object through the schema checklist.
// It will not crash automatically; it simply returns a report showing if it worked or failed.
const parsed = envSchema.safeParse(processEnv);

// 4. Handle Validation Failure
// If our checks failed (e.g. the variable is missing or is not a URL), we log a clear
// error report and throw a loud error to stop the server from booting in a broken state!
if (!parsed.success) {
  // Log a clean, beautifully formatted error representation to the terminal console.
  console.error(
    "❌ ENVIRONMENT VARIABLE VALIDATION ERROR:\n",
    JSON.stringify(parsed.error.format(), null, 2)
  );
  
  // Throw an explicit runtime crash error to halt the application immediately.
  throw new Error("Invalid or missing environment configuration in .env.local. Please check your setup.");
}

// 5. Export Validated Variables
// If everything is perfect, we export our verified 'env' object.
// This allows other files in our app to import 'env' with full TypeScript autocomplete and type safety!
export const env = parsed.data;
