import * as vscode from 'vscode'
import { CommandHandler, registerExtensionCommand } from 'vscode-framework'

export default () => {
    const generalCommandHandler: CommandHandler = async ({ command }, { goToMode, kindFilter, at } = {}) => {
        const { activeTextEditor: editor } = vscode.window
        if (!editor) return
        const {
            document: { uri },
            selection,
        } = editor
        const requestPos = selection.active
        let highlights: vscode.DocumentHighlight[] | undefined =
            (await vscode.commands.executeCommand('vscode.executeDocumentHighlights', uri, requestPos)) ?? []
        if (highlights.length === 0) return

        if (command === 'goToHighlightedLocationsRead') kindFilter = vscode.DocumentHighlightKind.Read
        if (command === 'goToHighlightedLocationsWrite') kindFilter = vscode.DocumentHighlightKind.Write
        if (kindFilter) highlights = highlights.filter(({ kind }) => kind === kindFilter)

        const locations: vscode.Location[] = highlights.map(({ range }) => new vscode.Location(uri, range))
        // arg: request to go to specific location e.g. 0 or -1
        if (at) {
            const location = locations.at(at)
            if (location) {
                const pos = location.range.start
                editor.selection = new vscode.Selection(pos, pos)
            }

            return
        }

        const hasLocationInPos = locations.some(location => location.range.contains(requestPos))
        if (!goToMode) goToMode = vscode.workspace.getConfiguration('editor').get('gotoLocation.multipleReferences') ?? 'peek'
        await vscode.commands.executeCommand(
            'editor.action.peekLocations',
            uri,
            // dx: preserve cursor location when possible!
            hasLocationInPos ? requestPos : locations[0]?.range.start ?? requestPos,
            locations,
            goToMode,
        )
    }

    registerExtensionCommand('goToHighlightedLocations', generalCommandHandler)
    registerExtensionCommand('goToHighlightedLocationsRead', generalCommandHandler)
    registerExtensionCommand('goToHighlightedLocationsWrite', generalCommandHandler)
}
