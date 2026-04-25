import type { HistoricalVignette } from './types'

export const h4_sj21_beidou: HistoricalVignette = {
  id: 'h4_sj21_beidou',
  title: 'SJ-21 and the Beidou Tow',
  subtitle: 'Grapple and reposition in GEO',
  era: 'January 2022',
  regime: 'GEO',
  estimatedRuntimeSec: 145,
  thumbnail: '🪝',
  intro: {
    title: 'A dead satellite moves',
    body:
      "In January 2022 commercial space-situational-awareness firms observed China's Shijian-21, launched the previous October, executing a coordinated sequence with Beidou-2 G2, a Chinese navigation satellite that had been declared dead in 2011. SJ-21 closed on the dead satellite, grappled it, and towed it several hundred kilometers above the GEO belt to the graveyard orbit. The demonstration was conducted on Chinese hardware. The capability it demonstrated is dual-use in the sharpest sense.",
    citation: 'COMSPOC public analysis; Breaking Defense reporting',
  },
  snapshots: [
    {
      t_sec: 0,
      label: 'Beidou-2 G2, dead at GEO',
      craft: [
        { id: 'bd2', name: 'Beidou-2 G2 (dead)', side: 'neutral', x_km: 0, y_km: 0, regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'A dead spacecraft in the belt',
        body:
          'Beidou-2 G2 was declared inoperable in 2011. It remained in the GEO belt, drifting in longitude without control. For more than a decade it was one of thousands of debris objects cataloged in the belt. Then something changed.',
        citation: 'U.S. Space Command catalog; ESA DISCOS',
      },
    },
    {
      t_sec: 20,
      label: 'SJ-21 approaches',
      craft: [
        { id: 'bd2', name: 'Beidou-2 G2', side: 'neutral', x_km: 0, y_km: 0, regime: 'GEO', labelVisible: true },
        { id: 'sj21', name: 'SJ-21', side: 'red', x_km: -25, y_km: 5, regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'Closing on a cold target',
        body:
          'SJ-21 had launched in October 2021. Three months later it was closing on Beidou-2 G2. Commercial SSA firms, including COMSPOC and s2a Systems, tracked the approach in near-real time. The target was not maneuvering. It could not.',
        citation: 'COMSPOC event summary, January 2022',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 50,
      label: 'Grapple',
      craft: [
        { id: 'stack', name: 'SJ-21 + Beidou-2', side: 'red', x_km: 0, y_km: 0, regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'Grappled',
        body:
          'The two spacecraft converged to within hundreds of meters, then appeared on optical and RF tracking as a single object. Whatever mechanism SJ-21 used to capture Beidou-2 G2 was mechanical. The combined stack maneuvered as one.',
        operationalNote: 'Grapple of a non-cooperating target is harder than grapple of a target designed to be grappled. This demonstration showed both capabilities.',
        citation: 'Breaking Defense, January 22, 2022',
      },
    },
    {
      t_sec: 80,
      label: 'Tow to graveyard',
      craft: [
        { id: 'stack', name: 'combined stack', side: 'red', x_km: 0, y_km: 150, regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'Raising apogee',
        body:
          'The combined stack performed a series of prograde burns to raise its orbit above the GEO belt. Over several hours it climbed roughly 300 km above the operational GEO ring. This is the disposal orbit, the graveyard, reserved by international convention for spent spacecraft.',
        citation: 'IADC Space Debris Mitigation Guidelines',
      },
    },
    {
      t_sec: 110,
      label: 'Release and return',
      craft: [
        { id: 'bd2', name: 'Beidou-2 G2', side: 'neutral', x_km: 0, y_km: 300, regime: 'GEO', labelVisible: true },
        { id: 'sj21', name: 'SJ-21', side: 'red', x_km: 10, y_km: 260, regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'Separation in the graveyard',
        body:
          'SJ-21 released Beidou-2 G2 in the graveyard orbit. It then executed a retrograde burn to drop back toward the active GEO ring. A piece of long-standing debris was now parked where it belonged. The demonstration was complete.',
        citation: 'COMSPOC event wrap-up',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 135,
      label: 'What was shown',
      craft: [
        { id: 'sj21', name: 'SJ-21', side: 'red', x_km: 0, y_km: 0, regime: 'GEO', labelVisible: true },
      ],
      narration: {
        title: 'The capability is general',
        body:
          "Public analysis characterized the event in two ways. One framing: debris remediation, which is a positive contribution to the shared GEO environment. A second framing: an active-debris-removal vehicle is functionally equivalent to a kinetic counterspace vehicle against a non-cooperating target. Both framings describe the same hardware.",
        citation: 'Secure World Foundation analysis, 2022',
      },
    },
  ],
  outro: {
    title: 'Dual-use in practice',
    body:
      'The grapple-and-tow demonstrated on SJ-21 is now a publicly known capability. It can be used to clean up the GEO belt, and responsible operators may yet choose to. It can also be used to remove an adversary operational satellite from its working slot and leave it elsewhere. Whether the international community treats future demonstrations as debris remediation or as counterspace signaling will depend, in part, on what the operator says beforehand.',
    citation: 'Space Force, Space Warfighting: A Framework for Planners, April 2025',
  },
  discussionPrompts: [
    {
      question:
        'SJ-21 towed a dead satellite to the graveyard. If it had towed a functioning adversary satellite, what would be different about the observed geometry? What would be the same?',
      instructorNotes:
        'Observed geometry would be similar. Differences: the target would likely maneuver to evade, creating an obvious approach-evasion dance that would alarm the international community and would burn more delta-V on both sides.',
    },
    {
      question:
        'Active-debris-removal and kinetic counterspace are not physically distinguishable at the hardware level. What legal or doctrinal norms could meaningfully separate them?',
      instructorNotes:
        'Pre-notification, target ownership and consent, neutral observation. Norms exist in partial form. They are not yet comprehensive.',
    },
    {
      question:
        'If an operator wanted a grapple-capable servicer but also wanted to avoid the counterspace interpretation, what operational transparency would they need to adopt?',
      instructorNotes:
        'Published maneuver plans, international observer access, customer-operator consent procedures, public pattern-of-life baselines. Commercial servicing programs are moving in this direction.',
    },
  ],
  primaryCitation: {
    title: 'SJ-21 Grapple and Tow Event Analysis',
    source: 'COMSPOC Corporation public release, January 2022',
  },
}
