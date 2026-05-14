// Orbital Express historical vignette. v1.5 3D model: both ASTRO and
// NEXTSat fly on the same circular LEO at ~492 km. Positions are RIC
// offsets in km, with ASTRO closing on NEXTSat in stages.
import type { HistoricalVignette } from './types'

export const h2_orbital_express: HistoricalVignette = {
  id: 'h2_orbital_express',
  title: 'Orbital Express',
  subtitle: 'Autonomous capture, transfer, and release',
  era: '2007',
  regime: 'LEO',
  estimatedRuntimeSec: 160,
  thumbnail: '🤖',
  anchorOrbit: {
    altitudeKm: 492,
    inclinationDeg: 46,
    raanDeg: 30,
    eccentricity: 0,
  },
  intro: {
    title: 'The first autonomous RPO',
    body:
      'Orbital Express was a DARPA program that flew two spacecraft, ASTRO and NEXTSat, in the spring and summer of 2007. ASTRO was the servicer. NEXTSat was the target. Over four months in LEO they demonstrated autonomous rendezvous, capture with a robotic arm, propellant transfer, and unit swap. Every crewed RPO before this had a pilot in the loop. This one did not.',
    citation: 'DARPA Orbital Express Program Final Report, 2007 (public release)',
  },
  snapshots: [
    {
      t_sec: 0,
      label: 'Initial separation',
      camera: 'regime',
      cameraFocusCraftId: 'nextsat',
      craft: [
        { id: 'nextsat', name: 'NEXTSat', side: 'neutral', ricKm: [0, 0, 0], regime: 'LEO', labelVisible: true },
        { id: 'astro', name: 'ASTRO', side: 'blue', ricKm: [0, -0.005, 0], regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Mated at launch',
        body:
          'ASTRO and NEXTSat launched together in March 2007. They separated in orbit. Then the work started. The program plan called for a sequence of scenarios at increasing autonomy and range.',
        citation: 'Boeing Orbital Express press materials',
      },
    },
    {
      t_sec: 20,
      label: 'Standoff at 7 km',
      camera: 'close',
      cameraFocusCraftId: 'nextsat',
      craft: [
        { id: 'nextsat', name: 'NEXTSat', side: 'neutral', ricKm: [0, 0, 0], regime: 'LEO', labelVisible: true },
        { id: 'astro', name: 'ASTRO', side: 'blue', ricKm: [0, -7, 0], regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Autonomous re-approach',
        body:
          'For one scenario ASTRO drifted out to seven kilometers, then returned to NEXTSat under its own guidance. The operators on the ground did not command the burns. They only watched telemetry and had an abort button. The rendezvous software planned and executed each impulse.',
        operationalNote: 'This is the first on-orbit demonstration of an autonomous RPO sequence on unclassified hardware.',
        citation: 'DARPA Final Report',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 50,
      label: 'Capture',
      camera: 'proximity',
      cameraFocusCraftId: 'nextsat',
      craft: [
        { id: 'nextsat', name: 'NEXTSat', side: 'neutral', ricKm: [0, 0, 0], regime: 'LEO', labelVisible: true },
        { id: 'astro', name: 'ASTRO', side: 'blue', ricKm: [0, -0.002, 0], regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Arm grapple',
        body:
          "ASTRO's robotic arm extends and grapples a standard interface on NEXTSat. The two spacecraft are now mechanically joined. Relative velocity is effectively zero. The arm does the work that docking mechanisms do on crewed vehicles, but with no crew to abort if the approach goes wrong.",
        citation: 'MDA Corporation release, 2007',
      },
    },
    {
      t_sec: 75,
      label: 'Propellant transfer',
      camera: 'proximity',
      cameraFocusCraftId: 'nextsat',
      craft: [
        { id: 'nextsat', name: 'NEXTSat', side: 'neutral', ricKm: [0, 0, 0], regime: 'LEO', labelVisible: true },
        { id: 'astro', name: 'ASTRO', side: 'blue', ricKm: [0, -0.002, 0], regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Fluid transfer',
        body:
          'Hydrazine moves from ASTRO to NEXTSat through a demonstration coupling. This is the technology demonstration that would, years later, underpin commercial satellite-servicing programs. A refueled satellite gets a second life. Its operator is not forced into retirement when the propellant gauge reads empty.',
        citation: 'Northrop Grumman / MDA technical papers',
      },
    },
    {
      t_sec: 105,
      label: 'Component swap',
      camera: 'proximity',
      cameraFocusCraftId: 'nextsat',
      craft: [
        { id: 'nextsat', name: 'NEXTSat', side: 'neutral', ricKm: [0, 0, 0], regime: 'LEO', labelVisible: true },
        { id: 'astro', name: 'ASTRO', side: 'blue', ricKm: [0, -0.002, 0], regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Orbital Replaceable Unit',
        body:
          'A battery-like module is swapped between the two spacecraft using the same arm. The principle demonstrated here is modularity. Future satellites can be designed so that components are replaced in orbit rather than retired with the whole spacecraft.',
        citation: 'DARPA Final Report',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 135,
      label: 'Release and re-approach',
      camera: 'close',
      cameraFocusCraftId: 'nextsat',
      craft: [
        { id: 'nextsat', name: 'NEXTSat', side: 'neutral', ricKm: [0, 0, 0], regime: 'LEO', labelVisible: true },
        { id: 'astro', name: 'ASTRO', side: 'blue', ricKm: [0, -3, 0], regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Release and return',
        body:
          'The arm releases. ASTRO backs off three kilometers and then re-approaches autonomously. The program runs this cycle multiple times with different sensor failure injections to prove robustness. By end of mission, ASTRO and NEXTSat have demonstrated the core servicing building blocks on unclassified hardware.',
        citation: 'DARPA Orbital Express closeout briefing',
      },
    },
  ],
  outro: {
    title: 'A dual-use capability',
    body:
      "Orbital Express was a technology demonstration. The engineering worked. The question it left open, and which operators are still answering, is the one about intent. An autonomous rendezvous and grapple vehicle that can refuel a friendly spacecraft can also approach a target that is not friendly. The capability does not care. Operational norms and transparency carry the difference. A satellite servicing program and a kinetic or non-kinetic counterspace program can share the same hardware backbone.",
    citation: 'Secure World Foundation commentary on dual-use RPO',
  },
  discussionPrompts: [
    {
      question:
        'Orbital Express demonstrated autonomous rendezvous, capture, and fluid transfer on unclassified hardware in 2007. What changed between 2007 and today in the operational environment, given that this capability is now clearly achievable?',
      instructorNotes:
        'The gap closed: multiple actors have flown capability demonstrators since. The concern shifted from "can it be done" to "by whom, for what, and how are others informed."',
    },
    {
      question:
        'A satellite-servicing program and a counterspace RPO program look nearly identical in hardware. What distinguishes them operationally?',
      instructorNotes:
        'Declared intent, approach pattern, transparency of maneuver plans, and target selection. Physical hardware alone is not decisive.',
    },
    {
      question:
        'If a commercial operator builds a servicing vehicle and a national actor builds an inspector, who carries the burden of demonstrating intent?',
      instructorNotes:
        'Open. In practice, both do, but through different mechanisms. Commercial operators via customer contracts and transparency. National actors via declared doctrine, pre-notification, and observed pattern of life.',
    },
  ],
  primaryCitation: {
    title: 'DARPA Orbital Express Space Operations Architecture',
    source: 'DARPA Program Final Report (2007 public release)',
    url: 'https://apps.dtic.mil/sti/citations/ADA481143',
  },
}
