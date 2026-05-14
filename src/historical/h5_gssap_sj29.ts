// GSSAP / SJ-29 historical vignette. v1.5 3D model: GEO anchor with the
// Chinese pair anchored at the origin and the two GSSAP observers as RIC
// offsets in km. The four-spacecraft bracket geometry is preserved as
// in-track ± offsets on the same GEO ring.
import type { HistoricalVignette } from './types'

export const h5_gssap_sj29: HistoricalVignette = {
  id: 'h5_gssap_sj29',
  title: 'GSSAP brackets SJ-29',
  subtitle: 'Two inspectors, two targets, one observation',
  era: 'March 2026',
  regime: 'GEO',
  estimatedRuntimeSec: 165,
  thumbnail: '⌘',
  anchorOrbit: {
    altitudeKm: 35786,
    inclinationDeg: 0.05,
    raanDeg: 0,
    eccentricity: 0,
  },
  intro: {
    title: 'Inspectors watching inspectors',
    body:
      'In March 2026 two U.S. Geosynchronous Space Situational Awareness Program satellites, USA 324 and USA 325, executed a coordinated bracketed observation of two Chinese Shijian-29 spacecraft in the GEO belt. Commercial SSA firms tracked the event in detail. What you will watch is the geometry they published: a two-on-two encounter in which both sides were, by any reasonable reading, inspecting each other.',
    citation: 'SpaceNews, s2a Systems, COMSPOC public analyses, March 2026',
  },
  snapshots: [
    {
      t_sec: 0,
      label: 'SJ-29A and SJ-29B on station',
      camera: 'close',
      cameraFocusCraftId: 'sj29a',
      craft: [
        { id: 'sj29a', name: 'SJ-29A', side: 'red', ricKm: [0, -30, 0], regime: 'GEO', labelVisible: true },
        { id: 'sj29b', name: 'SJ-29B', side: 'red', ricKm: [0, 30, 0], regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'Pair on station',
        body:
          'Shijian-29A and Shijian-29B had been coorbital for weeks, separated by roughly 60 km in the GEO belt. Their station-keeping pattern was consistent with a coordinated inspector pair. Public analysts characterized them as performing formation work.',
        citation: 'SpaceNews, early March 2026',
      },
    },
    {
      t_sec: 25,
      label: 'USA 325 arrives from the west',
      camera: 'close',
      cameraFocusCraftId: 'sj29a',
      craft: [
        { id: 'sj29a', name: 'SJ-29A', side: 'red', ricKm: [0, -30, 0], regime: 'GEO', labelVisible: true },
        { id: 'sj29b', name: 'SJ-29B', side: 'red', ricKm: [0, 30, 0], regime: 'GEO', labelVisible: true },
        { id: 'usa325', name: 'USA 325', side: 'blue', ricKm: [20, -120, 0], regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'Approach from the west',
        body:
          'USA 325, GSSAP-6, began a slow drift toward the SJ-29 pair from the west. Closing rate was deliberately small. At GEO, a rapid approach itself carries signaling weight. USA 325 was signaling that the approach was deliberate and not hostile.',
        citation: 's2a Systems GEO tracking',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 55,
      label: 'USA 324 arrives from the east',
      camera: 'close',
      cameraFocusCraftId: 'sj29a',
      craft: [
        { id: 'sj29a', name: 'SJ-29A', side: 'red', ricKm: [0, -30, 0], regime: 'GEO', labelVisible: true },
        { id: 'sj29b', name: 'SJ-29B', side: 'red', ricKm: [0, 30, 0], regime: 'GEO', labelVisible: true },
        { id: 'usa325', name: 'USA 325', side: 'blue', ricKm: [15, -80, 0], regime: 'GEO', labelVisible: true },
        { id: 'usa324', name: 'USA 324', side: 'blue', ricKm: [-15, 80, 0], regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'The bracket forms',
        body:
          'USA 324, GSSAP-5, arrived from the east. The two U.S. spacecraft were now on opposite sides of the Chinese pair. This is the bracket geometry. Both sides have optical coverage of both targets, continuously, from complementary angles. Neither target can simply move away from one inspector without closing with the other.',
        operationalNote: 'A bracket forces the target to either accept observation or spend delta-V to leave. Both choices are legible to the inspectors.',
        citation: 'COMSPOC event analysis, March 2026',
      },
    },
    {
      t_sec: 85,
      label: 'Four days of observation',
      camera: 'close',
      cameraFocusCraftId: 'sj29a',
      craft: [
        { id: 'sj29a', name: 'SJ-29A', side: 'red', ricKm: [0, -30, 0], regime: 'GEO', labelVisible: true },
        { id: 'sj29b', name: 'SJ-29B', side: 'red', ricKm: [0, 30, 0], regime: 'GEO', labelVisible: true },
        { id: 'usa325', name: 'USA 325', side: 'blue', ricKm: [10, -70, 0], regime: 'GEO', labelVisible: true },
        { id: 'usa324', name: 'USA 324', side: 'blue', ricKm: [-10, 70, 0], regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'Hold',
        body:
          'The four-spacecraft formation held for roughly four days. Both U.S. spacecraft stayed in their respective positions relative to the Chinese pair. Commercial tracking was continuous. No public reports of anomalies. No public reports of interference. Just mutual observation, for days.',
        citation: 'SpaceNews live coverage',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 125,
      label: 'Handoff',
      camera: 'close',
      cameraFocusCraftId: 'sj29a',
      craft: [
        { id: 'sj29a', name: 'SJ-29A', side: 'red', ricKm: [0, -30, 0], regime: 'GEO', labelVisible: true },
        { id: 'sj29b', name: 'SJ-29B', side: 'red', ricKm: [0, 30, 0], regime: 'GEO', labelVisible: true },
        { id: 'usa325', name: 'USA 325', side: 'blue', ricKm: [25, -130, 0], regime: 'GEO', labelVisible: true },
        { id: 'usa324', name: 'USA 324', side: 'blue', ricKm: [0, 63, 0], regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'USA 325 departs, USA 324 closes',
        body:
          'USA 325 executed a departure burn to the west. At the same time, USA 324 closed in from the east, reaching approximately 63 km range. Coverage of the SJ-29 pair was continuous throughout the handoff. Neither the departing nor the arriving spacecraft lost the target during the transition.',
        operationalNote: 'This is the exact mechanic Mission 4 teaches: two assets coordinating so that coverage is never interrupted.',
        citation: 'COMSPOC handoff analysis',
      },
    },
    {
      t_sec: 155,
      label: 'Steady state',
      camera: 'close',
      cameraFocusCraftId: 'sj29a',
      craft: [
        { id: 'sj29a', name: 'SJ-29A', side: 'red', ricKm: [0, -30, 0], regime: 'GEO', labelVisible: true },
        { id: 'sj29b', name: 'SJ-29B', side: 'red', ricKm: [0, 30, 0], regime: 'GEO', labelVisible: true },
        { id: 'usa324', name: 'USA 324', side: 'blue', ricKm: [0, 63, 0], regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'Single-inspector hold',
        body:
          'USA 324 remained at approximately 63 km and continued observation. What the public saw was a careful, bounded, reciprocal encounter. Each side demonstrated capability. Each side observed the other. Neither side created a public incident. That is, itself, a norm in formation.',
        citation: 'Air and Space Forces Magazine, April 2026',
      },
    },
  ],
  outro: {
    title: 'Reciprocity as a stabilizer',
    body:
      'For decades, close inspection in GEO was a one-way action: an inspector maneuvered, a target tolerated or moved. March 2026 demonstrated something different. When both sides have inspectors, and both sides accept observation without interference, a kind of mutual transparency forms. The Dean has asked for cadets to understand this dynamic before they commission. The spiral from single-asset RPO to formation command to reciprocal observation is not an abstract progression. It is the path the operational environment is actually taking.',
    citation: 'Space Force, Space Warfighting: A Framework for Planners, April 2025',
  },
  discussionPrompts: [
    {
      question:
        'USA 325 and USA 324 approached from opposite sides of the SJ-29 pair rather than from the same direction. What did the bracket geometry give the observer team that a stacked approach would not?',
      instructorNotes:
        'Complementary viewing angles, redundant coverage, and the ability to execute handoffs without a coverage gap. Also forces the target to burn delta-V to escape, which is itself an observable signal.',
    },
    {
      question:
        'At what range does an approach stop reading as routine inspection and start reading as hostile intent? Whose perception matters: the target, the international community, or both?',
      instructorNotes:
        'Below roughly 50 km in GEO, attribution begins to climb sharply. Both perceptions matter. The target sets operational risk; the international community sets norm-enforcement pressure.',
    },
    {
      question:
        'If SJ-29A and SJ-29B are themselves inspectors, and USA 324 and USA 325 are inspectors, what operational norm is emerging from inspectors watching inspectors? What are the escalation risks and the stabilizing dynamics?',
      instructorNotes:
        'Emerging norm: reciprocal observation as accepted behavior. Stabilizer: mutual transparency deters surprise. Risk: miscalculation at close range, or the wrong spacecraft ending up in the wrong geometry during a crisis.',
    },
  ],
  primaryCitation: {
    title: 'GSSAP Bracketed Observation of Shijian-29',
    source: 'SpaceNews, COMSPOC, s2a Systems (March 2026)',
    url: 'https://spacenews.com/',
  },
}
