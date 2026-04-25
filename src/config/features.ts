// Feature flags.
//
// Each flag reads from a Vite environment variable prefixed VITE_. That means
// you can flip a flag on for a deploy without changing any code: just set
// the env var in the Vercel project settings and redeploy.
//
// If no env var is present, each flag falls back to its default below.

// AI Coach (v1.2): disabled by default. Enable by setting
//   VITE_COACH_ENABLED=true
// in Vercel project environment variables, and by also setting
//   ANTHROPIC_API_KEY=sk-ant-...
// in the same place. When this flag is false, the CoachButton is hidden
// from the Debrief screen and no requests are made. The serverless function
// at /api/coach still exists but is unreachable from the UI.
export const COACH_ENABLED: boolean =
  import.meta.env.VITE_COACH_ENABLED === 'true'
