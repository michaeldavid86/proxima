import { useGame } from '../game/state'
import MainMenu from './MainMenu'
import Brief from './Brief'
import GameScreen from './GameScreen'
import Debrief from './Debrief'
import HistoricalPlayer from './HistoricalPlayer'

export default function App() {
  const screen = useGame((s) => s.screen)
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {screen === 'menu' && <MainMenu />}
      {screen === 'brief' && <Brief />}
      {screen === 'game' && <GameScreen />}
      {screen === 'debrief' && <Debrief />}
      {screen === 'historical' && <HistoricalPlayer />}
    </div>
  )
}
