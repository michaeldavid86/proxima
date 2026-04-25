import type { VignetteScript } from './types'
import { vignette0 } from './v0_orbital_primer'
import { vignette1 } from './v1_first_light'
import { vignette2 } from './v2_quiet_inspector'
import { vignette3 } from './v3_contested_approach'
import { vignette4 } from './v4_handoff'

export const vignettes: VignetteScript[] = [vignette0, vignette1, vignette2, vignette3, vignette4]

export const vignettesById: Record<string, VignetteScript> = Object.fromEntries(
  vignettes.map((v) => [v.id, v]),
)

export const vignetteForMission = (missionId: string): VignetteScript | null =>
  vignettes.find((v) => v.missionId === missionId) ?? null
