# Pilot time log: separate Google Sheet

Right now the pilot sends the daily time check-in to the SAME Google Apps Script as the comment boxes, with Level = PILOT-TIME (daily totals) and PILOT-RATING (chain and listening ratings). Filter on the Level column to separate them.

To get a separate sheet:

1. Create a new Google Sheet, e.g. "Pilot time log". Open Extensions > Apps Script.
2. Paste this script, then Deploy > New deployment > Web app, execute as you, access Anyone. Copy the web app URL.
3. In `pilot/shared.js` set `var TIME_WEBHOOK = "<that URL>";` and push. Check-ins then go only to the new sheet.

```javascript
function doPost(e) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PilotTime") ||
           SpreadsheetApp.getActiveSpreadsheet().insertSheet("PilotTime");
  if (sh.getLastRow() === 0) {
    sh.appendRow(["Received","Date","Day","Cards","Chains","Listening","Extra min","Total","New","Reviewed","Shelved","Again","Good","Note","Raw"]);
  }
  var m = (e.parameter.message || "");
  function g(re) { var r = m.match(re); return r ? r[1].trim() : ""; }
  sh.appendRow([
    new Date(),
    g(/^TIME (\S+)/), g(/day (\d+)/),
    g(/cards (\d+:\d+) \|/), g(/chains (\d+:\d+)/), g(/listening (\d+:\d+)/),
    g(/extra (\d+) min/), g(/total ([^|]+?) \|/),
    g(/new (\d+),/), g(/reviewed (\d+),/), g(/shelved (\d+),/), g(/again (\d+),/), g(/good (\d+)/),
    g(/note: (.*)$/), m
  ]);
  return ContentService.createTextOutput("ok");
}
```

Columns: date, day number, minutes:seconds per exercise type (cards, chains, listening), extra minutes entered by hand (class, conversation, real life, podcast, with notes inside the raw text), total, and the card counts of the day.
