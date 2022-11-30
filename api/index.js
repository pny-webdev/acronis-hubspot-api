const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();
const helmet = require("helmet"); 

require('dotenv').config();

let foundCode;
let contactEmail;
let unclaimedCode;
let rowID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const mainUrl = `https://api.hubapi.com/hubdb/api/v2/tables/5441605/rows/`;
const rowCellUrl = `/cells/2`;
let claimCodeUrl;
let currentDate = new Date();
let time = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();

const PORT = process.env.PORT || 3825;

// HTTP Header Security
app.use(helmet());

// Enable CORS Middleware
app.use(cors());

// Body Parser Middleware
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}/`);
});

app.get("/api", (req, res) => {
  res.send("Acronis API");
});

app.get("/api/FpHt4wA@*YN7z9&h", (req, res) => {
  res.send("API connected");
});

app.post("/api/FpHt4wA@*YN7z9&h", (req, res) => {
  contactEmail = req.body.email;
  fetchAcronisCode();
  res.send("All Good");
});

function fetchAcronisCode() {
  let options = {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    json: true,
  };
  let url =
    "https://api.hubapi.com/hubdb/api/v2/tables/5441605/rows?portalId=40268";
  // Filter list for unclaimed Acronis code
  fetch(url, options)
    .then((res) => {
      if (res.ok) {
        console.log("INITIAL REQ SUCCESS" + '' + time);
        return res;
      } else {
        throw new Error(
          `INITIAL REQ FAILED: ${res.status} (${res.statusText})`
        );
      }
    })
    .then((res) => res.json())
    .then((data) => {
      foundCode = data.objects.find((code) => {
        return code.values["2"] === 0;
      });
      rowID = foundCode.id;
      unclaimedCode = foundCode.values["1"];
      claimCodeUrl = `${mainUrl}${rowID}${rowCellUrl}`;
      console.log(rowID, unclaimedCode, claimCodeUrl);
    })
    // Mark the code as claimed
    .then(() => {
      let checked = {
        value: 1,
      };
      let updateList = {
        method: "PUT",
        body: JSON.stringify(checked),
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      };

      console.log(rowID, unclaimedCode, claimCodeUrl, updateList);

      fetch(claimCodeUrl, updateList).then((res) => {
        
        if (res.ok) {
          console.log("MARK CODE AS CLAIMED");
          return res;
        } else {
          throw new Error(
            `CODE CLAIM FAILED: ${res.status} (${res.statusText})`
          );
        }
      });
    })
    // Publish updated list
    .then(() => {
      let publishURL = `https://api.hubapi.com/hubdb/api/v2/tables/5441605/publish`;

      fetch(publishURL, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }).then((res) => {
        if (res.ok) {
          console.log("DB UPDATED");
          return res;
        } else {
          throw new Error(
            `DB UPDATE FAILED: ${res.status} (${res.statusText})`
          );
        }
      });
    })
    .then(() => {
      setTimeout(assignClaimedCode, 5000);
    })
    .catch((err) => {
      console.log(err);
    });
}

function assignClaimedCode() {
  let assignURL = `https://api.hubapi.com/contacts/v1/contact/email/${contactEmail}/profile`;
  let claimedCode = {
    properties: [{ property: "acronis_code", value: unclaimedCode }],
  };
  let claimedCodeRequest = {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(claimedCode),
  };
  console.log(contactEmail, unclaimedCode, claimedCodeRequest);

  fetch(assignURL, claimedCodeRequest)
    .then((res) => {
      if (res.ok) {
        console.log("CLAIM POST REQUEST SENT");
        return res;
      } else {
        throw new Error(
          `CLAIM POST REQUEST FAILED: ${res.status} (${res.statusText})`
        );
      }
    })
    .then(sendEmail);
}

function sendEmail() {
  let enrollURL = `https://api.hubapi.com/automation/v2/workflows/16869008/enrollments/contacts/${contactEmail}`;

  console.log(enrollURL);

  fetch(enrollURL, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  }).then((res) => {
    if (res.ok) {
      console.log("EMAIL SENT" + '' + time);
      return res;
    } else {
      throw new Error(`EMAIL SEND FAILED: ${res.status} (${res.statusText})`);
    }
  });
}

module.exports = app
