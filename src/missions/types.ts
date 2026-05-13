import type { COE } from '../physics/orbital-elements'
import type { Vec3 } from '../physics/vec'
import type { Antenna } from '../physics/link-budget'

export interface SensorConfig {
  id: string
  kind: 'optical' | 'rf' | 'radar'
  maxRangeKm: number
}

export interface EmitterConfig {
  id: string
  role: 'downlink' | 'uplink' | 'jammer' | 'payload'
  txPowerW: number
  fGHz: number
  antenna: Antenna
  // if true, the emitter is currently radiating (updated by actions)
  active: boolean
}

export interface SpacecraftLoadout {
  id: string
  name: string
  side: 'blue' | 'red' | 'neutral'
  regime: 'LEO' | 'GEO'
  coe: COE
  dryMass: number
  propellantMass: number
  isp: number
  power: number
  sensors?: SensorConfig[]
  emitters?: EmitterConfig[]
  // initial boresight expressed in the ship's own RIC frame.
  // [0,1,0] = in-track (typical for nadir/earth-pointing comms).
  boresightRic?: Vec3
  hardened?: boolean
}

export interface GroundStation {
  id: string
  name: string
  // For simplicity, ground stations are anchored in ECI at a fixed position
  // (rotating-Earth is out of scope for v1). ECI position in meters.
  posEci: Vec3
  txPowerW: number
  fGHz: number
  antenna: Antenna
}

export type AdversaryAction =
  | {
      kind: 'maneuver'
      atTimeSec: number
      shipId: string
      // Delta-v in the ship's own RIC frame at that moment.
      dvRic: Vec3
    }
  | {
      kind: 'jam'
      atTimeSec: number
      shipId: string
      // If provided, deactivate at this time.
      stopTimeSec?: number
      target: 'victim-downlink' | 'victim-uplink'
    }
  | {
      kind: 'closeApproach'
      atTimeSec: number
      shipId: string
      // commits to a Hohmann-like transfer aimed at bringing shipId closer to
      // the player within `rangeKm` at the next coelliptic opportunity.
      rangeKm: number
    }

export interface SuccessFailureHoldSpec {
  kind: 'holdStation'
  rangeKmMax: number
  relSpeedMsMax: number
  holdSeconds: number
  // optional minimum range (for Mission 2 V-bar station-keeping with safety floor)
  rangeKmMin?: number
}

export interface SuccessInspectionSpec {
  kind: 'inspectionProfile'
  vbarKm: number
  vbarToleranceKm: number
  holdSeconds: number
  attributionMax: number
  departRangeKm: number
}

export interface SuccessLinkSpec {
  kind: 'maintainLinkDepart'
  missionDurationSec: number
  departRangeKm: number
}

export interface SuccessCoverageSpec {
  kind: 'observationCoverage'
  coveragePctRequired: number // e.g. 85
  missionDurationSec: number
  lowWaterFailPct?: number // e.g. 50; coverage dropping below this is a hard fail
}

export type SuccessSpec =
  | SuccessFailureHoldSpec
  | SuccessInspectionSpec
  | SuccessLinkSpec
  | SuccessCoverageSpec

export interface FailureSpec {
  collisionRangeM?: number
  collisionRelSpeedMs?: number
  // attribution >= this => failure (target flees)
  attributionMax?: number
  // link denied continuously for >= this many seconds => failure
  linkDeniedMaxSec?: number
  // range below this => failure
  rangeKmMin?: number
  // propellant exhaustion is always a failure; no config needed.
}

export interface Mission {
  id: string
  name: string
  brief: string
  teachingTargets: string[]
  realWorldCallout: {
    text: string
    cite: { label: string; url?: string }[]
  }
  spacecraft: SpacecraftLoadout[]
  playerId: string
  targetId: string
  adversaryScript?: AdversaryAction[]
  groundStation?: GroundStation
  success: SuccessSpec
  failure: FailureSpec
  maxDurationSec: number
  initialViewMode?: 'map' | 'prox'
  // Frequency used for the protected link (Mission 3)
  linkFGHz?: number
  // Initial state guidance shown in brief
  initialGuidance?: string
  // v1.1: optional vignette id that enables Watch mode for this mission.
  vignetteId?: string
  // v1.1: if true, only Watch is available (Mission 0 primer).
  watchOnly?: boolean
  // v1.2: list of friendly asset IDs for multi-asset missions (Mission 4+).
  // When present, the mission uses asset-selector UX and observation-coverage
  // scoring. playerId should match the first entry (default active asset).
  assets?: string[]
  // v1.4: engagement-consideration keep zones, expressed in the target's RIC
  // frame. Visualized in 2D and 3D; advisory only in v1.4 (no scoring impact).
  keepZones?: KeepZone[]
}

// Forward import for the keep-zone type (engagement layer owns the math).
import type { KeepZone } from '../engagement/keep-zones'
export type { KeepZone }
