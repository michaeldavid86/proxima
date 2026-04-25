import type { HistoricalVignette } from './types'

export const h1_gemini: HistoricalVignette = {
  id: 'h1_gemini',
  title: 'Gemini VII / VI-A',
  subtitle: 'The first rendezvous in orbit',
  era: 'December 15, 1965',
  regime: 'LEO',
  estimatedRuntimeSec: 150,
  thumbnail: '🛰️',
  intro: {
    title: 'Why this mattered',
    body:
      'In 1965 no two crewed spacecraft had ever met in orbit. Every lunar and station plan on the Apollo program assumed rendezvous was possible. Gemini VII and Gemini VI-A had to prove it. What you are about to watch is the first time in history humans executed a controlled orbital rendezvous.',
    citation: 'NASA History, On the Shoulders of Titans (Hacker and Grimwood, 1977)',
  },
  snapshots: [
    {
      t_sec: 0,
      label: 'Gemini VII on station',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Gemini VII waits',
        body:
          'Gemini VII launched first, on December 4. Frank Borman and Jim Lovell are in an elliptical 162 by 327 km orbit. Their job is to be a target. They have been on orbit eleven days when the second spacecraft launches.',
        citation: 'NASA SP-4203, Appendix H',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 20,
      label: 'Gemini VI-A ascent',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
        { id: 'g6', name: 'Gemini VI-A', side: 'blue', x_km: -1800, y_km: -120, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Ascent and insertion',
        body:
          'Wally Schirra and Tom Stafford reach orbit six hours earlier in the day. Their first insertion is deliberately lower and behind. Lower means faster. Behind means closing. They will run the phasing on the first few orbits.',
        operationalNote: 'This is the same catch-up rule the Orbital Primer taught: to close on a target ahead, drop lower.',
        citation: 'NASA SP-4203',
      },
    },
    {
      t_sec: 45,
      label: 'Phasing burns',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
        { id: 'g6', name: 'Gemini VI-A', side: 'blue', x_km: -400, y_km: -40, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Closing the gap',
        body:
          'Stafford handles the radar and optical tracking. The crew executes a sequence of small prograde burns to refine the intercept. Each burn raises apogee a little and slows the rate at which they are catching Gemini VII.',
        citation: 'Gemini VI-A Mission Report, NASA',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 70,
      label: 'Terminal approach',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
        { id: 'g6', name: 'Gemini VI-A', side: 'blue', x_km: -5, y_km: 0, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Inside two kilometers',
        body:
          'The final closure is hand-flown on thrusters. No autopilot. Schirra and Stafford see Gemini VII visually, then through the optical reticle. They brake on V-bar using small aft impulses. At this stage the pilots have transitioned from orbital mechanics to something that looks much more like formation flying.',
        citation: 'Schirra debrief transcript, NASA',
      },
    },
    {
      t_sec: 100,
      label: 'Station at 30 cm',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
        { id: 'g6', name: 'Gemini VI-A', side: 'blue', x_km: -0.0003, y_km: 0, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Station-keeping at one foot',
        body:
          'For about five hours the two spacecraft held station within a few feet of each other. They flew in formation. They did not dock. Nobody had ever tried. The question they answered was simpler: can two vehicles be controlled into proximity? Yes.',
        operationalNote: 'Five hours of station-keeping proved the control authority was there. Docking would come with Gemini VIII in March 1966.',
        citation: 'NASA Oral History: Schirra, Stafford',
      },
      autoPauseAfter: true,
    },
    {
      t_sec: 140,
      label: 'Separation and return',
      craft: [
        { id: 'g7', name: 'Gemini VII', side: 'neutral', x_km: 0, y_km: 0, regime: 'LEO', labelVisible: true },
        { id: 'g6', name: 'Gemini VI-A', side: 'blue', x_km: 80, y_km: 40, regime: 'LEO', labelVisible: true },
      ],
      narration: {
        title: 'Separation',
        body:
          'Gemini VI-A backs away and deorbits two days later. Gemini VII continues for three more days. The splashdown photos are famous. The engineering result is more important: every orbital rendezvous that follows, from Apollo to Shuttle to ISS to Dragon, inherits the playbook proven here.',
        citation: 'NASA SP-4203',
      },
    },
  ],
  outro: {
    title: 'The playbook survives',
    body:
      'The sequence you just watched is the canonical rendezvous. Insert lower and behind. Phase via prograde burns until the gap is small. Transition to RIC-frame station-keeping for terminal approach. Brake on V-bar. Modern automated systems do this faster, but the steps are identical. Every Gemini crewmember involved said later that the hard part was not the math. It was trusting the math while flying it.',
    citation: 'Gemini VI-A and VII Mission Reports, NASA',
  },
  discussionPrompts: [
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
    title: 'On the Shoulders of Titans: A History of Project Gemini',
    source: 'NASA History Office, SP-4203 (Hacker and Grimwood, 1977)',
    url: 'https://history.nasa.gov/SP-4203/toc.htm',
  },
}
