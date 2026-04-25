import type { Mission } from './types'
import { mission0 } from './m0_primer'
import { mission1 } from './m1_first_light'
import { mission2 } from './m2_quiet_inspector'
import { mission3 } from './m3_contested_approach'
import { mission4 } from './m4_handoff'

// Wire corresponding vignette ids so Watch mode is available on each mission.
mission1.vignetteId = mission1.vignetteId ?? 'v1_first_light'
mission2.vignetteId = mission2.vignetteId ?? 'v2_quiet_inspector'
mission3.vignetteId = mission3.vignetteId ?? 'v3_contested_approach'
mission4.vignetteId = mission4.vignetteId ?? 'v4_handoff'

export const missions: Mission[] = [mission0, mission1, mission2, mission3, mission4]

export const missionsById: Record<string, Mission> = Object.fromEntries(
  missions.map((m) => [m.id, m]),
)
