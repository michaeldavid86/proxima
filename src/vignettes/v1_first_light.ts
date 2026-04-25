// Mission 1 Watch script — First Light (LEO rendezvous).
// Teaching beats from the v1.1 spec Section 8: Hohmann ascent, phasing
// awareness, terminal V-bar braking, Gemini VII/VI-A callout.
import type { VignetteScript } from './types'

export const vignette1: VignetteScript = {
  id: 'v1_first_light',
  missionId: 'm1_first_light',
  title: 'First Light',
  subtitle: 'Scripted LEO rendezvous',
  totalDurationSec: 7200,
  intro: {
    title: 'Rendezvous geometry',
    body:
      'A friendly cubesat, CUBESAT-7, has drifted off its test orbit. You (the ' +
      'chaser) are 60 degrees behind it on a slightly lower orbit at 400 km. You ' +
      'cannot just "fly there". You have to change orbits to catch up, then ' +
      'brake in the RIC frame to hold station. This vignette runs about six ' +
      'minutes and shows the canonical flow.',
  },
  outro: {
    title: 'Rendezvous complete',
    body:
      'What you just watched mirrors the Gemini VII and VI-A rendezvous in ' +
      'December 1965, the first crewed rendezvous in space. Two spacecraft met ' +
      'in orbit, held station a few feet apart, and demonstrated that the ' +
      'orbital mechanics work out if you plan the burns. Every cargo resupply ' +
      'to the ISS, every crewed Dragon flight, every RPO mission public or ' +
      'otherwise inherits this playbook.',
    citation: 'NASA History: Gemini VII / VI-A (December 1965)',
  },
  waypoints: [
    { t_sim: 0, kind: 'phase_marker', id: 'p-plan', phase: 'Transfer' },
    {
      t_sim: 0,
      kind: 'narration',
      id: 'n-plan',
      narration: {
        title: 'The catching-up problem',
        body:
          'Target leads us by 60 degrees on a 420 km orbit. We are at 400 km. A ' +
          'lower orbit has a shorter period, so we are already gaining on the ' +
          "target slowly. A Hohmann rise to 420 km doesn't just change our " +
          'altitude — it also consumes delta-V that we cannot get back. ' +
          'Plan the minimum we need.',
      },
    },
    {
      t_sim: 15,
      kind: 'teach_pause',
      id: 't-higher-vs-lower',
      teach: {
        title: 'Higher or lower to catch up?',
        body:
          'Counterintuitive but true: to catch up to a target ahead of you, you ' +
          'typically drop lower (faster angular rate), not higher. The classic ' +
          'textbook path is a phasing orbit. For this demonstration we will ' +
          'Hohmann up to match altitude first, then let phasing happen.',
        diagram: 'ric',
      },
    },
    {
      t_sim: 30,
      kind: 'maneuver',
      id: 'm-hohmann-up-1',
      maneuver: {
        craftId: 'chaser',
        direction: 'prograde',
        dv_mps: 6,
        label: 'Prograde: raise apogee toward 420 km',
      },
    },
    {
      t_sim: 30,
      kind: 'narration',
      id: 'n-apogee-raise',
      narration: {
        title: 'Apogee raise',
        body:
          'Prograde burn. Periapsis stays at 400, apogee raises toward 420. This ' +
          'is the first Hohmann impulse.',
      },
    },
    {
      t_sim: 2800,
      kind: 'maneuver',
      id: 'm-hohmann-up-2',
      maneuver: {
        craftId: 'chaser',
        direction: 'prograde',
        dv_mps: 6,
        label: 'Prograde: circularize at 420 km',
      },
    },
    {
      t_sim: 2800,
      kind: 'narration',
      id: 'n-circ',
      narration: {
        title: 'Circularized at 420 km',
        body:
          'Second prograde burn at the new apogee circularizes you at 420 km. ' +
          'You are now coorbital with the target, but behind. Phasing physics ' +
          'now does the work.',
        operationalNote: 'Two Hohmann burns: 12 m/s of delta-V spent.',
      },
    },
    { t_sim: 2810, kind: 'phase_marker', id: 'p-closure', phase: 'Closure' },
    {
      t_sim: 2820,
      kind: 'teach_pause',
      id: 't-approach-corridor',
      teach: {
        title: 'Approach corridor',
        body:
          'Once you are within a few kilometers, you stop thinking about orbits ' +
          'and start thinking in the RIC frame. The V-bar approach is passive-' +
          'safe: if your engine fails and you stop burning, you drift parallel ' +
          'to the target rather than into it. That is why every crewed ' +
          'rendezvous since Shuttle has ended on V-bar.',
        diagram: 'vbar_approach',
      },
    },
    { t_sim: 4500, kind: 'view_change', id: 'v-prox', viewChange: 'prox' },
    {
      t_sim: 4500,
      kind: 'narration',
      id: 'n-ric',
      narration: {
        title: 'Target-centered view',
        body:
          'Switching to the proximity view. Origin is the target. You appear on ' +
          'the positive-V-bar side, drifting slowly. Time to start terminal ' +
          'braking.',
      },
    },
    {
      t_sim: 5200,
      kind: 'maneuver',
      id: 'm-brake-1',
      maneuver: {
        craftId: 'chaser',
        direction: 'vbar_minus',
        dv_mps: 1.2,
        label: 'V-bar braking impulse',
      },
    },
    {
      t_sim: 5500,
      kind: 'maneuver',
      id: 'm-brake-2',
      maneuver: {
        craftId: 'chaser',
        direction: 'vbar_minus',
        dv_mps: 0.8,
        label: 'Final V-bar braking',
      },
    },
    {
      t_sim: 5800,
      kind: 'teach_pause',
      id: 't-hold',
      teach: {
        title: 'Station-keeping realism',
        body:
          'In real missions, holding station is not "parking". It is a small ' +
          'continuous dance. Drag, J2, solar radiation, and CW second-order ' +
          'effects all push you off. Operators burn small corrections every ' +
          'few minutes or automate it with onboard guidance. Today we will ' +
          'just freeze the clock.',
      },
    },
    { t_sim: 5810, kind: 'phase_marker', id: 'p-terminal', phase: 'Terminal' },
  ],
  recommendedActions: {
    Transfer: [],
    Closure: [],
    Terminal: [],
  },
  learningObjectives: [
    'Explain why catching up requires a combination of altitude change and phasing time.',
    'Recognize V-bar approach as the passive-safe terminal corridor.',
    'Describe station-keeping as continuous small corrections, not static parking.',
  ],
}
