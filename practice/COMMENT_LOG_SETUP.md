# Setting up the internal comment store (Google Sheet)

Every "Send" click on the feedback box still emails you directly (unchanged).
This adds a second, queryable copy of every comment as a row in a Google
Sheet you own — a real internal log, no third-party account needed beyond
the Google account you already have.

## One-time setup (about 5 minutes)

1. Go to [sheets.google.com](https://sheets.google.com) and create a new
   blank spreadsheet. Name it something like **"Speak German now — feedback log"**.
2. In the sheet, go to **Extensions → Apps Script**. This opens a script
   editor attached to this spreadsheet.
3. Delete whatever's in the editor (`myFunction(){}` placeholder) and paste
   this instead:

   ```javascript
   function doPost(e) {
     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     if (sheet.getLastRow() === 0) {
       sheet.appendRow(["Timestamp", "Level", "Lesson", "Message", "Page"]);
     }
     sheet.appendRow([
       new Date(),
       e.parameter.level || "",
       e.parameter.lesson || "",
       e.parameter.message || "",
       e.parameter.page || ""
     ]);
     return ContentService.createTextOutput(JSON.stringify({ ok: true }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

4. Click **Deploy → New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - **Execute as:** Me (your Google account).
   - **Who has access:** Anyone.
   - Click **Deploy**. Google will ask you to authorize the script once —
     that's normal, it's your own script running on your own sheet.
5. Copy the **Web app URL** it gives you (looks like
   `https://script.google.com/macros/s/AKfycb.../exec`).
6. Send me that URL — I'll paste it into
   `COMMENT_WEBHOOK_URL` near the top of the `<script>` block in
   `practice/index.html` (currently left as `""`, which just means the
   logging step is silently skipped and only mailto fires).

## Notes

- Every comment is sent to both places at once: your inbox (mailto, as
  before) and a new row in the sheet (lesson, level, message, timestamp,
  and the page URL it was sent from).
- The webhook call uses `fetch(..., {mode: "no-cors"})`, so the page can't
  read Google's response — but the write still happens; you just won't see
  a "success" confirmation in the browser console. If rows stop appearing,
  the most common cause is the deployment's access level getting reset to
  "Only myself" — redeploy with "Anyone" if that happens.
- If you'd rather use a different backend later (Formspree, Airtable, a
  real database), the swap is simple: same `fetch` call, just a different
  URL and payload shape — let me know and I'll adjust it.
