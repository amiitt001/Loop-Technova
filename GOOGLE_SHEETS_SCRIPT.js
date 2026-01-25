var sheetName = 'Applications';
var scriptProp = PropertiesService.getScriptProperties();

function intialSetup() {
    var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    scriptProp.setProperty('key', activeSpreadsheet.getId());
}

function doPost(e) {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        var doc = SpreadsheetApp.getActiveSpreadsheet();

        // Fallback: If null (standalone script), try to get from properties
        if (!doc) {
            var key = scriptProp.getProperty('key');
            if (key) {
                doc = SpreadsheetApp.openById(key);
            }
        }

        if (!doc) {
            throw new Error('Could not open spreadsheet. If this is a standalone script, please run "intialSetup" first.');
        }

        var sheet = doc.getSheetByName(sheetName);
        if (!sheet) {
            sheet = doc.insertSheet(sheetName);
            // Added 'Status' to default headers
            sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Branch', 'Year', 'College', 'Domain', 'Github', 'Reason', 'Status']);
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];

        // Helper to find column index case-insensitively
        function getColIndex(name) {
            var lowerName = name.toLowerCase();
            for (var i = 0; i < headers.length; i++) {
                if (headers[i].toString().toLowerCase() === lowerName) return i;
            }
            return -1;
        }

        var emailIndex = getColIndex('Email');
        if (emailIndex === -1 && headers.length > 0 && e.parameter.action) {
            throw new Error('Email column not found');
        }

        // --- ACTION: DELETE ---
        if (e.parameter.action === 'delete') {
            var emailToDelete = e.parameter.email;
            if (!emailToDelete) throw new Error('Email is required for deletion');

            var rowsDeleted = 0;
            for (var i = data.length - 1; i >= 1; i--) {
                // Check case-insensitive email match? Or exact? exact is safer.
                if (data[i][emailIndex] == emailToDelete) {
                    sheet.deleteRow(i + 1);
                    rowsDeleted++;
                }
            }

            return ContentService
                .createTextOutput(JSON.stringify({ 'result': 'success', 'deleted': rowsDeleted }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // --- ACTION: UPDATE STATUS ---
        if (e.parameter.action === 'updateStatus') {
            var emailToUpdate = e.parameter.email;
            var newStatus = e.parameter.status;
            if (!emailToUpdate || !newStatus) throw new Error('Email and Status are required');

            var statusIndex = getColIndex('Status');
            if (statusIndex === -1) {
                statusIndex = headers.length;
                sheet.getRange(1, statusIndex + 1).setValue('Status');
                // Refresh headers? No need if we just write to known index
            }

            var rowsUpdated = 0;
            for (var i = 1; i < data.length; i++) {
                if (data[i][emailIndex] == emailToUpdate) {
                    // Note: statusIndex is 0-based from headers array, but getRange is 1-based. 
                    // Also data array is 0-based.
                    // If statusIndex was existing, it matches data structure.
                    sheet.getRange(i + 1, statusIndex + 1).setValue(newStatus);
                    rowsUpdated++;
                }
            }

            return ContentService
                .createTextOutput(JSON.stringify({ 'result': 'success', 'updated': rowsUpdated }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // --- DEFAULT: ADD NEW APPLICATION ---

        // Mapping Logic: Frontend sends lowercase keys (name, email), Sheet has Title Case (Name, Email)
        var nextRow = sheet.getLastRow() + 1;
        var newRow = headers.map(function (header) {
            if (header === 'Timestamp') {
                return new Date();
            }
            if (header === 'Status') {
                return 'Pending';
            }

            // Try exact match first
            var val = e.parameter[header];
            // If not found, try lowercase version (Name -> name)
            if (val === undefined || val === null) {
                val = e.parameter[header.toLowerCase()];
            }
            // Special case: Github vs github (already handled by lowercase logic, but just in case)

            return val || "";
        });

        sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

        return ContentService
            .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        return ContentService
            .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}
