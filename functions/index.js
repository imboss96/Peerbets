/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

/* eslint-disable */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp();

// Fetch events via third-party API using a secret key stored in functions config or env var
exports.fetchEvents = functions.https.onCall(async (data, context) => {
  // secure: read key from functions config or process.env
  const key = (functions.config && functions.config().sportsapi && functions.config().sportsapi.key) || process.env.SPORTS_API_KEY;
  if (!key) {
    throw new functions.https.HttpsError('failed-precondition', 'Sports API key is not configured.');
  }

  const params = data || {};
  // Example: build the third-party URL. Replace BASE_URL and query params as needed.
  const baseUrl = 'https://api.example.com/events'; // <-- REPLACE with real API URL
  const url = new URL(baseUrl);
  if (params.league) url.searchParams.set('league', params.league);
  if (params.date) url.searchParams.set('date', params.date);

  try {
    const resp = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/json'
      },
      method: 'GET'
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Upstream API error: ${resp.status} ${text}`);
    }

    const payload = await resp.json();
    // Optionally transform payload to match your app schema here.
    return { events: payload };
  } catch (err) {
    throw new functions.https.HttpsError('internal', err.message || 'Fetch failed');
  }
});
