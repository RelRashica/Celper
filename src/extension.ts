import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Celper is awake, stop worrying!');
	console.log('DEBUG: Activate function is running!');

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('celper');
    context.subscriptions.push(diagnosticCollection);

    let onSave = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.languageId === 'c' || document.languageId === 'cpp') {
			console.log("FILE SAVED: " + document.fileName);
            runCelperLogic(document, diagnosticCollection);
        }
    }); context.subscriptions.push(onSave);
}

function runCelperLogic(doc: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
    const diagnostics: vscode.Diagnostic[] = [];
    
    let activeAllocations = new Map<string, number[]>();
    let isInComment = false;

    for (let i = 0; i < doc.lineCount; i++) {
        let line = doc.lineAt(i);
        let text = line.text.trim();

        if (text.startsWith("//")) {continue;}
        if (text.includes("/*")) {isInComment = true;}
        if (text.includes("*/")) {isInComment = false; continue;}

        if (!isInComment) {
            let mallocMatch = text.match(/(\w+)\s*=\s*malloc/);
            if (mallocMatch) {
    			let varName = mallocMatch[1];
    			let lines = activeAllocations.get(varName) || [];
    			lines.push(i); 
    			activeAllocations.set(varName, lines);
			}

            let freeMatch = text.match(/free\s*\(\s*(\w+)\s*\)/);
            if (freeMatch) {
    			let varName = freeMatch[1];
    			let lines = activeAllocations.get(varName);
    			if (lines && lines.length > 0) {
        			lines.pop(); 
        			if (lines.length === 0) {activeAllocations.delete(varName);}
    			}
			}

			if (text.startsWith("return")) {
    			activeAllocations.forEach((linesArray: number[], varName: string) => {
        			if (linesArray.length > 0) {
            			const diag = new vscode.Diagnostic(
                			line.range,
                			`💀 CELPER FATAL: You're trying to return, but '${varName}' is still leaked!`,
                			vscode.DiagnosticSeverity.Error
            			); diagnostics.push(diag);
        			}
    			});
			}
        }
    }

    activeAllocations.forEach((linesArray: number[], varName: string) => {
    
    	linesArray.forEach((lineNum: number) => {
        	const line = doc.lineAt(lineNum);
        	let startChar = line.text.indexOf("malloc");
        
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