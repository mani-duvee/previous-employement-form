/**
 * Vercel Build Script
 * Injects Vercel Environment Variables (API_BASE_URL) into env.js at deploy time.
 */
const fs = require('fs');

const apiBaseUrl = process.env.API_BASE_URL || 'https://13.127.219.134';

const envContent = `/**
 * Environment Configuration for Employment Verification Portal
 * Automatically injected from Vercel Environment Variables at build time
 */
window.ENV = window.ENV || {
  API_BASE_URL: "${apiBaseUrl}"
};
`;

try {
  fs.writeFileSync('env.js', envContent, 'utf8');
  console.log('[build-env] Successfully generated env.js with API_BASE_URL:', apiBaseUrl);
} catch (err) {
  console.error('[build-env] Error generating env.js:', err);
  process.exit(1);
}
