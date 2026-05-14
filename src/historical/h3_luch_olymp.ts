// Luch/Olymp historical vignette. v1.5 3D model: GEO anchor orbit. Luch
// drifts in longitude as phaseDeg along the GEO ring, holding station near
// successive targets which are placed at their own phaseDeg around the belt.
import type { HistoricalVignette } from './types'

export const h3_luch_olymp: HistoricalVignette = {
  id: 'h3_luch_olymp',
  title: 'Luch / Olymp',
  subtitle: 'Pattern of life in the GEO belt',
  era: '2014 to present',
  regime: 'GEO',
  estimatedRuntimeSec: 170,
  thumbnail: '👁️',
  anchorOrbit: {
    altitudeKm: 35786, // GEO
    inclinationDeg: 0.05,
    raanDeg: 0,
    eccentricity: 0,
  },
  intro: {
    title: 'An inspector at work',
    body:
      'Launched in September 2014 as Luch, and referred to in some Russian documents as Olymp, this spacecraft has spent the last decade maneuvering into close proximity with a series of commercial and military geostationary satellites. Analysts at Secure World Foundation and CSIS have tracked more than a dozen such close approaches. What follows is a compressed pattern-of-life sketch.',
    citation: 'Secure World Foundation, Global Counterspace Capabilities 2024',
  },
  snapshots: [
    {
      t_sec: 0,
      label: 'On orbit',
      camera: 'regime',
      cameraFocusCraftId: 'luch',
      craft: [
        { id: 'luch', name: 'Luch', side: 'red', phaseDeg: 0, regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'Quiet start',
        body:
          'Luch launched in September 2014 and drifted to the GEO belt. Its early months on orbit were not unusual. The pattern that drew attention came later, when the spacecraft began executing repeated drift-and-hold sequences close to other operators.',
        citation: 'CSIS Space Threat Assessment 2023',
      },
    },
    {
      t_sec: 20,
      label: 'First close approach',
      camera: 'close',
      cameraFocusCraftId: 'sat1',
      craft: [
        { id: 'sat1', name: 'Intelsat 7', side: 'neutral', phaseDeg: 30, regime: 'GEO', labelVisible: true },
        { id: 'sat2', name: 'Intelsat 901', side: 'neutral', phaseDeg: 31.5, regime: 'GEO', labelVisible: false },
        { id: 'luch', name: 'Luch', side: 'red', phaseDeg: 30.75, regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'Between two commercial SATCOMs',
        body:
          'In 2015 Luch drifted to a position between Intelsat 7 and Intelsat 901 and held station. Intelsat acknowledged the event publicly, which was unusual. Close approaches in GEO were a known capability. A declared, multi-week hold between two commercial spacecraft was new behavior.',
        operationalNote: 'The close approach forced Intelsat operators to characterize the spacecraft, plan avoidance if needed, and publicly state their concern.',
        citation: 'Intelsat public statement, 2015',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 50,
      label: 'Drift to next target',
      camera: 'close',
      cameraFocusCraftId: 'sat3',
      craft: [
        { id: 'luch', name: 'Luch', side: 'red', phaseDeg: 75, regime: 'GEO', labelVisible: true },
        { id: 'sat3', name: 'Athena-Fidus (FR/IT mil)', side: 'neutral', phaseDeg: 77, regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'Shadowing a military SATCOM',
        body:
          'In 2017 French Defense Minister Parly publicly identified a close approach to Athena-Fidus, a French-Italian military communications satellite. Parly named Luch. The statement itself was operationally significant. A national leader calling out a counterspace behavior on the record was a break from the usual quiet.',
        citation: 'Florence Parly, French Minister of the Armed Forces, 2018',
      },
    },
    {
      t_sec: 80,
      label: 'Continuing cycle',
      camera: 'close',
      cameraFocusCraftId: 'luch',
      craft: [
        { id: 'luch', name: 'Luch', side: 'red', phaseDeg: 130, regime: 'GEO', labelVisible: true },
        { id: 'sat4', name: 'target n', side: 'neutral', phaseDeg: 131, regime: 'GEO', labelVisible: false },
      ],
      narration: {
        title: 'Pattern, not incident',
        body:
          'Over the decade the cycle repeated: drift, approach, hold, move on. Targets spanned commercial, allied military, and U.S. government spacecraft. No physical interference was reported. No collision. No visible weapons effect. Just presence.',
        citation: 'SWF Global Counterspace Capabilities 2024',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 110,
      label: 'Signals and ambiguity',
      camera: 'regime',
      cameraFocusCraftId: 'luch',
      craft: [
        { id: 'luch', name: 'Luch', side: 'red', phaseDeg: 200, regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'What we can and cannot observe',
        body:
          'Public tracking sees the geometry. It cannot see what Luch was doing at close range. Signals intelligence collection, optical characterization, and electronic warfare reconnaissance are all consistent with the observed behavior. So is technical demonstration. Public analysis does not resolve the question definitively.',
        operationalNote: 'This is the gray-zone problem: observable capability without definitive intent.',
        citation: 'CSIS Space Threat Assessment',
      },
    },
    {
      t_sec: 140,
      label: 'Aggregate picture',
      camera: 'regime',
      cameraFocusCraftId: 'luch',
      craft: [
        { id: 'luch', name: 'Luch', side: 'red', phaseDeg: 260, regime: 'GEO', labelVisible: true },
        { id: 't1', name: 'target', side: 'neutral', phaseDeg: 30, regime: 'GEO', labelVisible: false },
        { id: 't2', name: 'target', side: 'neutral', phaseDeg: 130, regime: 'GEO', labelVisible: false },
        { id: 't3', name: 'target', side: 'neutral', phaseDeg: 220, regime: 'GEO', labelVisible: false },
        { id: 't4', name: 'target', side: 'neutral', phaseDeg: 320, regime: 'GEO', labelVisible: false },
      ],
      narration: {
        title: 'A decade of data',
        body:
          'What was once an incident became a pattern, and a pattern became a category. Operators in the GEO belt plan for close approaches by inspectors as a standing feature of the environment. Procedures exist. Public attribution has become more common. The behavior has not stopped.',
        citation: 'SWF, CSIS, Breaking Defense',
      },
    },
  ],
  outro: {
    title: 'The gray zone',
    body:
      'Close approach without interference is a useful tool precisely because it is ambiguous. It gathers information. It signals presence. It imposes planning costs on the target. And it does not cross any threshold that would justify a proportional response. That is why it has persisted for a decade and why you should expect to see more of it, from more actors, over your career.',
    citation: 'Space Force, Space Warfighting: A Framework for Planners, April 2025',
  },
  discussionPrompts: [
    {
      question:
        'A close approach without physical interference gathers information and imposes planning costs on the target. Is that sufficient to call it a hostile act? What would need to change to reach that threshold?',
      instructorNotes:
        'Open. Good answers engage with proportionality, signals about norms, and the difference between capability demonstration and effects.',
    },
    {
      question:
        'Public attribution by a national official, as in the French case in 2018, was a departure from usual practice. What does declared attribution buy the defender, and what does it cost?',
      instructorNotes:
        'Buy: external pressure, ally coordination, a factual record. Cost: reveals what you can detect and characterize, and constrains your own future ambiguity if you later want to use similar tactics.',
    },
    {
      question:
        'If "close approach without interference" is a settled feature of the GEO environment, what operational adaptations should commercial and military operators be making?',
      instructorNotes:
        'Characterization and attribution capability, pre-planned avoidance maneuvers, sensor protection and emission-control doctrine, allied information sharing.',
    },
  ],
  primaryCitation: {
    title: 'Global Counterspace Capabilities',
    source: 'Secure World Foundation (annual report)',
    url: 'https://swfound.org/counterspace/',
  },
}
