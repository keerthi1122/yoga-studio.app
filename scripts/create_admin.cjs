#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const PROJECT_ID = 'yogastudio-2d89b';

// Parse command line arguments
const args = process.argv.slice(2);
let email = 'admin@yogastudio.com';
let password = 'password123';
let fullName = 'Studio Director';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--email' && args[i + 1]) email = args[++i];
  if (args[i] === '--password' && args[i + 1]) password = args[++i];
  if (args[i] === '--name' && args[i + 1]) fullName = args[++i];
}

// Retrieve access token from Firebase CLI config
const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: Firebase CLI credentials not found at ~/.config/configstore/firebase-tools.json');
  console.error('Please run "firebase login" first.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens?.access_token;
if (!accessToken) {
  console.error('Error: No access token found in firebase-tools.json. Please run "firebase login".');
  process.exit(1);
}

function httpsRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject({ statusCode: res.statusCode, body: json });
          }
        } catch (e) {
          reject({ statusCode: res.statusCode, raw: body, error: e });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

async function main() {
  console.log(`\n========================================`);
  console.log(`Creating / Provisioning Studio Administrator`);
  console.log(`Project:  ${PROJECT_ID}`);
  console.log(`Email:    ${email}`);
  console.log(`Name:     ${fullName}`);
  console.log(`========================================\n`);

  try {
    // 1. Create or get user via Identity Toolkit API
    console.log(`1. Checking or creating user in Firebase Auth...`);
    let uid = null;

    try {
      const createRes = await httpsRequest(
        `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        },
        {
          email,
          password,
          displayName: fullName,
          emailVerified: true
        }
      );
      uid = createRes.localId;
      console.log(`   Created new Firebase Auth user with UID: ${uid}`);
    } catch (err) {
      if (err.body?.error?.message === 'EMAIL_EXISTS') {
        console.log(`   User already exists in Firebase Auth. Fetching UID...`);
        const lookupRes = await httpsRequest(
          `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          },
          {
            email: [email]
          }
        );
        uid = lookupRes.users?.[0]?.localId;
        console.log(`   Found existing Firebase Auth UID: ${uid}`);
      } else {
        throw err;
      }
    }

    if (!uid) {
      throw new Error('Failed to obtain user UID from Firebase Auth.');
    }

    // 2. Set Custom User Claims for role: admin
    console.log(`2. Setting custom claims { role: "admin" }...`);
    await httpsRequest(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      },
      {
        localId: uid,
        customAttributes: JSON.stringify({ role: 'admin' })
      }
    );
    console.log(`   Custom claims configured.`);

    // 3. Create or Update user document in Cloud Firestore
    console.log(`3. Setting Firestore users/${uid} with role: 'admin'...`);
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
    const firestoreDoc = {
      fields: {
        uid: { stringValue: uid },
        email: { stringValue: email },
        fullName: { stringValue: fullName },
        role: { stringValue: 'admin' },
        status: { stringValue: 'active' },
        remainingCredits: { integerValue: "0" },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };

    await httpsRequest(
      firestoreUrl,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      },
      firestoreDoc
    );

    console.log(`   Firestore document successfully written.`);
    console.log(`\nSUCCESS! Administrator account is ready for sign in.`);
    console.log(`--------------------------------------------------`);
    console.log(`Portal:    http://localhost:5173 (React Admin Dashboard)`);
    console.log(`Email:     ${email}`);
    console.log(`Password:  ${password}`);
    console.log(`Role:      admin`);
    console.log(`--------------------------------------------------\n`);

  } catch (error) {
    console.error(`\nFailed to provision administrator:`, error);
    process.exit(1);
  }
}

main();

