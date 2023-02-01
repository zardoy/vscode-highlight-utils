import goToHighlightedLocations from './commands/goToHighlightedLocations'
import replaceHighlights from './commands/replaceHighlights'

export const activate = () => {
    goToHighlightedLocations()
    replaceHighlights()
}
