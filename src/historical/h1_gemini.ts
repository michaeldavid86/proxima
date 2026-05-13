// Gemini 76 historical vignette. Restructured for v1.4 to match Jack
// Anthony's "Gemini 76 Story" framing in Astro Corner: a two-act narrative,
// Act I covering setup and launch, Act II covering the rendezvous itself.
// The two parts of the reading list (Part 1 / Part 2) are designed to be
// read alongside the matching act.
import type { HistoricalVignette } from './types'

export const h1_gemini: HistoricalVignette = {
  id: 'h1_gemini',
  title: 'The Gemini 76 Story',
  subtitle: 'The first orbital rendezvous, in two acts',
  era: 'December 1965',
  regime: 'LEO',
  estimatedRuntimeSec: 195,
  thumbnail: '🛰️',
  intro: {
    title: 'Why this mattered',
    body:
      'In 1965 no two crewed spacecraft had ever met in orbit. Every lunar and station ' +
      'plan on the Apollo program assumed rendezvous was possible. Gemini VII and Gemini VI-A ' +
      'had to prove it. The story comes in two parts. Part 1 is the setup and launch: ' +
      'eleven days of waiting, a pad abort, and a re-engineered launch window. Part 2 is the ' +
      'rendezvous itself: six hours of orbital mechanics ending with two spacecraft holding ' +
      'station within a foot of each other for five hours.',
    citation: 'Jack Anthony, "The Gemini 76 Story" (Astro Corner, Parts 1 and 2)',
  },
  snapshots: [
    // -------- ACT I: SETUP AND LAUNCH --------
    {
      t_sec: 0,
      label: 'Act I · Gemini VII on station',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Part 1: Gemini VII waits',
        body:
          'Gemini VII launched first, on December 4. Frank Borman and Jim Lovell are in an ' +
          'elliptical 162 by 327 km orbit. Their job is to be a target. They have been on orbit ' +
          'eleven days when the second spacecraft is ready to launch.',
        citation: 'NASA SP-4203, Appendix H; Anthony, "Gemini 76 Story Part 1"',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 18,
      label: 'Act I · Pad abort',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'The pad shuts down',
        body:
          'On December 12, Gemini VI-A ignites on the pad and shuts down 1.2 seconds later. ' +
          'An umbilical drops early. The crew, Schirra and Stafford, do not eject. Schirra reads ' +
          'the gauges, sees no liftoff, and trusts the hardware. The launch window slips three ' +
          'days. This is the moment that almost ended the mission.',
        operationalNote: 'Schirra\'s call to ride out the abort kept the rendezvous attempt alive.',
        citation: 'Anthony, "Gemini 76 Story Part 1"; NASA SP-4203',
      },
    },
    {
      t_sec: 35,
      label: 'Act I · Ascent and insertion',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
        { id: 'g6', name: 'Gemini VI-A', side: 'blue', x_km: -1800, y_km: -120, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Lower and behind',
        body:
          'December 15. Schirra and Stafford reach orbit six hours earlier in the day. Their ' +
          'first insertion is deliberately lower and behind Gemini VII. Lower means faster. ' +
          'Behind means closing. They plan to run the phasing on the first few orbits.',
        operationalNote:
          'This is the same catch-up rule the Orbital Primer taught: to close on a target ahead, drop lower.',
        citation: 'Anthony, "Gemini 76 Story Part 1"',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 60,
      label: 'Act I · Phasing burns',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
        { id: 'g6', name: 'Gemini VI-A', side: 'blue', x_km: -400, y_km: -40, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Closing the gap',
        body:
          'Stafford handles the radar and optical tracking. The crew executes a sequence of ' +
          'small prograde burns to refine the intercept. Each burn raises apogee a little and ' +
          'slows the rate at which they are catching Gemini VII. This is the bridge between ' +
          'the two parts of the story: math becomes flight.',
        citation: 'Gemini VI-A Mission Report, NASA',
      },
    },
    // -------- ACT II: THE RENDEZVOUS --------
    {
      t_sec: 90,
      label: 'Act II · Inside two kilometers',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
        { id: 'g6', name: 'Gemini VI-A', side: 'blue', x_km: -5, y_km: 0, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Part 2: Terminal approach',
        body:
          'The final closure is hand-flown on thrusters. No autopilot. Schirra and Stafford ' +
          'see Gemini VII visually, then through the optical reticle. They brake on V-bar using ' +
          'small aft impulses. At this stage the pilots have transitioned from orbital ' +
          'mechanics to something that looks much more like formation flying.',
        citation: 'Anthony, "Gemini 76 Story Part 2"; Schirra debrief transcript, NASA',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 120,
      label: 'Act II · Station at 30 cm',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
        { id: 'g6', name: 'Gemini VI-A', side: 'blue', x_km: -0.0003, y_km: 0, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Station-keeping at one foot',
        body:
          'For about five hours the two spacecraft hold station within a few feet of each ' +
          'other. They fly in formation. They do not dock. Nobody had ever tried. The question ' +
          'they answered was simpler: can two vehicles be controlled into proximity? Yes.',
        operationalNote:
          'Five hours of station-keeping proved the control authority was there. Docking would come with Gemini VIII in March 1966.',
        citation: 'Anthony, "Gemini 76 Story Part 2"; NASA Oral History: Schirra, Stafford',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 165,
      label: 'Act II · Separation',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
        { id: 'g6', name: 'Gemini VI-A', side: 'blue', x_km: 80, y_km: 40, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Departure',
        body:
          'Gemini VI-A backs away and deorbits two days later. Gemini VII continues for three ' +
          'more days. The splashdown photos are famous. The engineering result is more ' +
          'important: every orbital rendezvous that follows, from Apollo to Shuttle to ISS to ' +
          'Dragon, inherits the playbook proven here.',
        citation: 'NASA SP-4203',
      },
    },
  ],
  outro: {
    title: 'The playbook survives',
    body:
      'The sequence you just watched is the canonical rendezvous. Insert lower and behind. ' +
      'Phase via prograde burns until the gap is small. Transition to RIC-frame station-keeping ' +
      'for terminal approach. Brake on V-bar. Modern automated systems do this faster, but the ' +
      'steps are identical. Every Gemini crewmember involved said later that the hard part was ' +
      'not the math. It was trusting the math while flying it.',
    citation: 'Anthony, "Gemini 76 Story" Parts 1 and 2; Gemini VI-A and VII Mission Reports, NASA',
  },
  discussionPrompts: [
    {
      question:
        'Schirra rode out a pad abort rather than ejecting. What does that decision tell you about the relationship between training and trust in the underlying hardware?',
      instructorNotes:
        'Schirra had instrumented evidence the vehicle had not lifted. Ejecting would have destroyed the spacecraft for nothing and ended the mission. The decision required trusting the gauges over the body\'s shock response. Anthony emphasizes this in Part 1.',
    },
    {
      question:
        'Schirra and Stafford chose to launch into an orbit below and behind Gemini VII rather than above and ahead. What did that choice trade away, and what did it buy them?',
      instructorNotes:
        'Trade: longer phasing time and a less flexible abort window. Buy: faster relative closing rate and a simpler, fuel-cheaper terminal approach geometry.',
    },
    {
      question:
        'The two spacecraft held formation for about five hours without docking. What does a five-hour station-keep demonstrate about the control system that a fast flyby would not?',
      instructorNotes:
        'It demonstrates sustained control authority under real-world drift: thermal, CW drift, thruster dead-band. A flyby proves you can reach. Station-keeping proves you can stay.',
    },
    {
      question:
        'Every crewed rendezvous since 1965 uses essentially the same choreography. Why has the shape of the problem proved so stable even as spacecraft have changed?',
      instructorNotes:
        'The shape is dictated by the physics, not the hardware. Kepler and Clohessy-Wiltshire set the geometry. The engineering changes, the geometry does not.',
    },
  ],
  primaryCitation: {
    title: 'The Gemini 76 Story (Parts 1 and 2)',
    source: 'Jack Anthony, Astro Corner; NASA History Office SP-4203 (Hacker and Grimwood, 1977)',
    url: 'https://history.nasa.gov/SP-4203/toc.htm',
  },
}
