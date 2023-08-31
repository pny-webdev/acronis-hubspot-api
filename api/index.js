const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const helmet = require('helmet');
require('dotenv').config();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const HUBDB_TABLE_ID = process.env.HUBDB_TABLE_ID;
const PORT = process.env.PORT || 3825;

// HTTP Header Security
app.use(helmet());

// Enable CORS Middleware
app.use(cors());

// Body Parser Middleware
app.use(express.json());

app
  .listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  })
  .catch((err) => console.error(err));

app.get('/api', (req, res) => {
  res.send('Acronis API');
});

app.get('/api/register', (req, res) => {
  res.send('API connected');
});

app.post('/api/register', async (req, res) => {
  console.log('POST REQUEST RECEIVED ' + new Date().toLocaleTimeString());
  try {
    const contactEmail = req.body.email;
    const claimedCode = await fetchAcronisCode();
    await assignClaimedCode(contactEmail, claimedCode);
    await sendEmail(contactEmail);
    res.send('All Good');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

async function fetchAcronisCode() {
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  const url = `https://api.hubapi.com/hubdb/api/v2/tables/${HUBDB_TABLE_ID}/rows?portalId=40268`;
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      console.log('INITIAL REQ SUCCESS ' + new Date().toLocaleTimeString());
      const data = await response.json();
      const foundCode = data.objects.find((code) => code.values['2'] === 0);
      const rowID = foundCode.id;
      const claimedCode = foundCode.values['1'];
      const claimCodeUrl = `https://api.hubapi.com/hubdb/api/v2/tables/${HUBDB_TABLE_ID}/rows/${rowID}/cells/2`;
      console.log(rowID, claimedCode, claimCodeUrl);
      const checked = { value: 1 };
      const updateList = {
        method: 'PUT',
        body: JSON.stringify(checked),
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      };
      const publishURL = `https://api.hubapi.com/hubdb/api/v2/tables/${HUBDB_TABLE_ID}/publish`;
      await fetch(claimCodeUrl, updateList).catch((err) => console.error(err));
      console.log('MARKED CODE AS CLAIMED');
      await fetch(publishURL, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }).catch((err) => console.error(err));
      console.log('DB UPDATED');
      return claimedCode;
    } else {
      throw new Error(
        `INITIAL REQ FAILED: ${response.status} (${response.statusText})`
      );
    }
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to fetch acronis code`);
  }
}

async function assignClaimedCode(contactEmail, claimedCode) {
  console.log(claimedCode);
  const assignURL = `https://api.hubapi.com/contacts/v1/contact/email/${contactEmail}/profile`;
  const claimedCodeRequest = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: [{ property: 'acronis_code', value: claimedCode }],
    }),
  };
  try {
    console.log(assignURL);
    console.log(claimedCodeRequest);
    const response = await fetch(assignURL, claimedCodeRequest).catch((err) =>
      console.error(err)
    );
    if (response.ok) {
      console.log('CLAIM POST REQUEST SENT');
      return;
    } else {
      throw new Error(
        `CLAIM POST REQUEST FAILED: ${response.status} (${response.statusText})`
      );
    }
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to assign claimed code: ${error.message}`);
  }
}

async function sendEmail(contactEmail) {
  const enrollURL = `https://api.hubapi.com/automation/v2/workflows/16869008/enrollments/contacts/${contactEmail}`;
  try {
    const response = await fetch(enrollURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }).catch((err) => console.error(err));
    if (response.ok) {
      console.log('EMAIL SENT ' + new Date().toLocaleTimeString());
      return;
    } else {
      throw new Error(
        `EMAIL SEND FAILED: ${response.status} (${response.statusText})`
      );
    }
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = app;
