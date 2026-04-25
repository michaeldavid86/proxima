// App.tsx is a thin shim that defers to the UI root. We keep the real top-level
// screen routing in src/ui/App.tsx so all UI lives in one folder per the spec.
import UiApp from './ui/App'

export default function App() {
  return <UiApp />
}
