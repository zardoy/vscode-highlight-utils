import * as vscode from 'vscode'
import { CommandHandler, registerExtensionCommand } from 'vscode-framework'

export default () => {
    const generalCommandHandler: CommandHandler = async ({ command }, { goToMode, kindFilter, at } = {}) => {
        let noResultsMessage = 'No highlights'
        const { activeTextEditor: editor } = vscode.window
        if (!editor) return
        const {
            document: { uri },
            selection,
        } = editor
        const requestPos = selection.active
        let highlights: vscode.DocumentHighlight[] | undefined =
            (await vscode.commands.executeCommand('vscode.executeDocumentHighlights', uri, requestPos)) ?? []

        if (command === 'goToHighlightedLocationsRead') kindFilter = vscode.DocumentHighlightKind.Read
        if (command === 'goToHighlightedLocationsWrite') kindFilter = vscode.DocumentHighlightKind.Write
        if (kindFilter) highlights = highlights.filter(({ kind }) => kind === kindFilter)

        let locations: vscode.Location[] = highlights.map(({ range }) => new vscode.Location(uri, range))
        // arg: request to go to specific location e.g. 0 or -1
        if (at !== undefined) {
            const location = locations.at(at)
            if (location) {
                locations = [location]
            } else {
                return
            }
        }

        if (locations.length > 0 && locations.every(({ range }) => range.contains(requestPos))) {
            locations.splice(0, locations.length)
            noResultsMessage = 'No other highlights'
        }

        const hasLocationInPos = locations.some(location => location.range.contains(requestPos))
        goToMode ??= vscode.workspace.getConfiguration('editor').get('gotoLocation.multipleReferences') ?? 'peek'
        // workaround: vscode should open peek widget only on goToMode = gotoAndPeek
        if (goToMode === 'goto' && locations.length === 1) {
            const pos = locations[0]!.range.start
            editor.selection = new vscode.Selection(pos, pos)
            editor.revealRange(editor.selection)
            return
        }
        await vscode.commands.executeCommand(
            'editor.action.goToLocations',
            uri,
            // dx: preserve cursor location when possible!
            hasLocationInPos || goToMode === 'peek' ? requestPos : locations[0]?.range.start ?? requestPos,
            locations,
            goToMode,
            noResultsMessage,
            true,
        )
    }

    registerExtensionCommand('goToHighlightedLocations', generalCommandHandler)
    registerExtensionCommand('goToHighlightedLocationsRead', generalCommandHandler)
    registerExtensionCommand('goToHighlightedLocationsWrite', generalCommandHandler)
}
