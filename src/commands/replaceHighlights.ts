import * as vscode from 'vscode'
import { registerExtensionCommand } from 'vscode-framework'

export default () => {
    // use cases: inline values in some language?
    registerExtensionCommand('replaceHighlights', async () => {
        const { activeTextEditor: editor } = vscode.window
        if (!editor) return
        const {
            document: { uri },
            selection,
        } = editor
        const highlights: vscode.DocumentHighlight[] | undefined =
            (await vscode.commands.executeCommand('vscode.executeDocumentHighlights', uri, selection.active)) ?? []
        if (highlights.length === 0) return
        const locations: vscode.Location[] = highlights.map(({ range }) => new vscode.Location(uri, range))
        const currentHighlightLocation = locations.find(location => location.range.contains(selection.active))!
        const samePos = selection.start.isEqual(selection.end)
        const valueToReplace = await vscode.window.showInputBox({ value: editor.document.getText(samePos ? currentHighlightLocation.range : selection) })
        if (!valueToReplace) return
        await editor.edit(editBuilder => {
            for (const location of locations) {
                editBuilder.replace(location.range, valueToReplace)
            }
        })
    })
}
