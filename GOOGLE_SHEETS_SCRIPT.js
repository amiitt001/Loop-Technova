var sheetName = 'Applications';
var scriptProp = PropertiesService.getScriptProperties();

function initialSetup() {
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
            throw new Error('Could not open spreadsheet. If this is a standalone script, please run "initialSetup" first.');
        }

        var sheet = doc.getSheetByName(sheetName);
        if (!sheet) {
            sheet = doc.insertSheet(sheetName);
            // Default headers for a fresh sheet
            sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Branch', 'Year', 'College', 'Domain', 'Github', 'Status']);
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];

        // --- DYNAMIC HEADER HANDLING ---
        // Check if all keys in the incoming request exist as headers
        var updatedHeaders = false;
        var incomingKeys = Object.keys(e.parameter);

        // Exclude 'action' which is a control parameter
        var keysToKeep = incomingKeys.filter(function (k) {
            return k !== 'action' && k !== 'email' && k !== 'status';
        });

        incomingKeys.forEach(function (key) {
            if (key === 'action') return;

            // Check if key (case-insensitive) exists in headers
            var exists = headers.some(function (h) {
                return h.toString().toLowerCase() === key.toLowerCase();
            });

            if (!exists) {
                // Add new header
                var newHeaderName = key.charAt(0).toUpperCase() + key.slice(1);
                sheet.getRange(1, headers.length + 1).setValue(newHeaderName);
                headers.push(newHeaderName); // Update local headers array
                updatedHeaders = true;
            }
        });

        // Refresh data if headers were updated
        if (updatedHeaders) {
            data = sheet.getDataRange().getValues();
        }

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
            }

            var rowsUpdated = 0;
            for (var i = 1; i < data.length; i++) {
                if (data[i][emailIndex] == emailToUpdate) {
                    sheet.getRange(i + 1, statusIndex + 1).setValue(newStatus);
                    rowsUpdated++;
                }
            }

            return ContentService
                .createTextOutput(JSON.stringify({ 'result': 'success', 'updated': rowsUpdated }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // --- DEFAULT: ADD NEW APPLICATION ---
        var nextRow = sheet.getLastRow() + 1;
        var newRow = headers.map(function (header) {
            if (header === 'Timestamp') {
                return new Date();
            }
            if (header === 'Status' && !e.parameter.status) {
                return 'Pending';
            }

            // Try exact match first, then lowercase
            var val = e.parameter[header];
            if (val === undefined || val === null) {
                val = e.parameter[header.toLowerCase()];
            }

            // Handle some common variations
            if (val === undefined || val === null) {
                if (header === 'Admission Number') val = e.parameter['admissionNumber'];
            }

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
