import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Celper is awake, stop worrying!');
	console.log('DEBUG: Activate function is running!');

    // 1. Create a "Diagnostic Collection" (The container for our red lines)
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('celper');
    context.subscriptions.push(diagnosticCollection);

    // 2. The Listener: This runs every time you save a file
    let onSave = vscode.workspace.onDidSaveTextDocument((document) => {
        // Only run if it's a C file
        if (document.languageId === 'c') {
			console.log("FILE SAVED: " + document.fileName);
            runCelperLogic(document, diagnosticCollection);
        }
    }); context.subscriptions.push(onSave);
}

function runCelperLogic(doc: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
    const diagnostics: vscode.Diagnostic[] = [];
    
    // Key = variable name (ptr), Value = line number (4)
    let activeAllocations = new Map<string, number[]>();
    let isInComment = false;

    for (let i = 0; i < doc.lineCount; i++) {
        let line = doc.lineAt(i);
        let text = line.text.trim();

        if (text.startsWith("//")) {continue;}
        if (text.includes("/*")) {isInComment = true;}
        if (text.includes("*/")) {isInComment = false; continue;}

        if (!isInComment) {
            // TRACK MALLOC: Save the name AND the line index
            let mallocMatch = text.match(/(\w+)\s*=\s*malloc/);
            if (mallocMatch) {
    			let varName = mallocMatch[1];
    			let lines = activeAllocations.get(varName) || [];
    			lines.push(i); // Add this new line to the list
    			activeAllocations.set(varName, lines);
			}

            // CLEAR FREE: Remove it if it gets freed
            let freeMatch = text.match(/free\s*\(\s*(\w+)\s*\)/);
            if (freeMatch) {
    			let varName = freeMatch[1];
    			let lines = activeAllocations.get(varName);
    			if (lines && lines.length > 0) {
        			lines.pop(); // Remove the most recent malloc
        			if (lines.length === 0) {activeAllocations.delete(varName);}
    			}
			}

			// 4. RETURN CHECKER: If we return now, did we leave anything behind?
			if (text.startsWith("return")) {
    			activeAllocations.forEach((linesArray: number[], varName: string) => {
        			// If the variable in the map hasn't been freed yet...
        			if (linesArray.length > 0) {
            			const diag = new vscode.Diagnostic(
                			line.range, // The line with the 'return'
                			`💀 CELPER FATAL: You're trying to return, but '${varName}' is still leaked!`,
                			vscode.DiagnosticSeverity.Error
            			); diagnostics.push(diag);
        			}
    			});
			}
        }
    }

    // We loop through each line number in that array
    activeAllocations.forEach((linesArray: number[], varName: string) => {
    
    // We loop through each line number in that array
    	linesArray.forEach((lineNum: number) => {
        	const line = doc.lineAt(lineNum);
        	let startChar = line.text.indexOf("malloc");
        
        	// Fallback if malloc isn't found on that line
        	if (startChar === -1) {startChar = 0;} 
        	const endChar = startChar + 6;

        	const diag = new vscode.Diagnostic(
            	new vscode.Range(lineNum, startChar, lineNum, endChar), 
            	`💀 CELPER ALERT: '${varName}' was never freed! Fix it, fam.`,
            	vscode.DiagnosticSeverity.Error
        	); diagnostics.push(diag);
    	});
	}); collection.set(doc.uri, diagnostics);
}