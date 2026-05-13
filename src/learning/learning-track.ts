// The ten-section foundational RPO Learning Track content.
// Course-agnostic: no specific course, lesson, or institution is named.
// Tone matches the established PROXIMA narration voice.
import type { LearningSection, QuizQuestion } from './types'

export const LEARNING_SECTIONS: LearningSection[] = [
  {
    id: 'rpo_intro',
    title: 'RPO Introduction and History',
    subtitle: 'What rendezvous and proximity operations are, and why they matter',
    estMinutes: 5,
    demoKind: 'historical_carousel',
    body:
      'Rendezvous and Proximity Operations, or RPO, is the coordinated maneuvering of two ' +
      'spacecraft into close proximity for a shared purpose. It is one of the oldest disciplines ' +
      'in spaceflight and one of the most operationally important today.\n\n' +
      'The mission use cases span the civil, commercial, and military domains. Crewed rendezvous ' +
      'and docking connect cargo and crew to space stations. Satellite inspection characterizes ' +
      'the configuration and behavior of a spacecraft from up close. On-orbit servicing extends ' +
      'mission life through refueling, component replacement, or repositioning. Formation flying ' +
      'enables distributed-aperture missions: gravity mapping, RF interferometry, ' +
      'multi-baseline imaging. And in the military domain, RPO is the foundation of every ' +
      'counterspace mission area that involves moving relative to another spacecraft.\n\n' +
      'A few notable firsts: Gemini VII and VI-A executed the first crewed rendezvous in ' +
      'December 1965. Kosmos 186 / 188 performed the first unmanned docking in October 1967. ' +
      'AFRL XSS-11 demonstrated autonomous inspection in 2005, foreshadowing the inspector class ' +
      'of satellites that dominate modern public-domain RPO reporting.',
    citation: 'Vallado, Fundamentals of Astrodynamics §6.6 (rendezvous introduction)',
  },
  {
    id: 'three_phases',
    title: 'Three Phases of Rendezvous',
    subtitle: 'How a chase matches orbital elements with a target',
    estMinutes: 10,
    demoKind: 'three_phase_demo',
    body:
      'A rendezvous is executed by matching the chase spacecraft\'s orbital elements to the ' +
      'target\'s, in three sequential phases.\n\n' +
      'Phase 1 — Plane Matching. Match inclination (i) and right ascension of ascending node ' +
      '(Ω). Plane changes are by far the most expensive maneuvers in delta-V. A typical ' +
      'one-degree plane change in LEO costs over a hundred meters per second. For this reason, ' +
      'a chase is most often launched directly into the target\'s plane. When two spacecraft ' +
      'appear to share a plane without any visible plane-changing burn, it is usually a signal ' +
      'about how the operator timed the launch.\n\n' +
      'Phase 2 — Shape and Alignment. Match semi-major axis (a), eccentricity (e), and argument ' +
      'of perigee (ω). These determine the shape and orientation of the orbit within the plane. ' +
      'Most operational RPO uses a circular reference orbit, so shape matching often reduces to ' +
      'matching altitude.\n\n' +
      'Phase 3 — Phasing. Match true anomaly (ν). The chase is now in the same shape orbit as ' +
      'the target but at a different position along it. Phasing closes that gap by temporarily ' +
      'changing orbital period (dropping lower to overtake, or raising to fall behind) and ' +
      'then returning to the target\'s altitude.\n\n' +
      'Phase 4 — Close-In. Once range drops below roughly 100 km, the chase transitions from ' +
      'thinking in orbital elements to thinking in the RIC relative frame. Engagement ' +
      'considerations (CATS angle, keep-zones, the 10-to-1 rule) take over.',
    citation: 'Vallado §6.6; Curtis Ch. 7',
  },
  {
    id: 'terminology',
    title: 'Terminology',
    subtitle: 'Target, chase, and the relative position vector',
    estMinutes: 3,
    demoKind: 'rho_side_by_side',
    body:
      'Target: the non-maneuvering reference spacecraft. The chase\'s motion is described ' +
      'relative to the target.\n\n' +
      'Chase: the spacecraft executing maneuvers. The chase is the one with the delta-V budget ' +
      'to spend.\n\n' +
      'Relative position vector (rho): the vector from the target to the chase. Symbol: ρ. ' +
      'During RPO, mission planners care about ρ, not the absolute ECI positions. A 5 km ' +
      'rho vector pointing along +V-bar means "the chase is 5 km ahead of the target in the ' +
      'in-track direction." That sentence is operationally useful. The chase\'s ECI position ' +
      'is not.\n\n' +
      'The companion view to ρ is the relative velocity vector (rho-dot, ρ̇). Together they ' +
      'specify the chase\'s state in the target\'s frame.',
    citation: 'Vallado §6.7',
  },
  {
    id: 'ric_frame',
    title: 'RIC Coordinate Frame',
    subtitle: 'Radial, In-track, Cross-track — the operator\'s mental model',
    estMinutes: 5,
    demoKind: 'ric_frame_demo',
    body:
      'RIC stands for Radial, In-track, Cross-track. The frame is centered at the target\'s ' +
      'center of mass and moves with the target along its orbit.\n\n' +
      '+x (R-bar / Radial): along the target\'s position vector from Earth\'s center. "Up" ' +
      'from the target, away from Earth.\n\n' +
      '+y (V-bar / In-track): along the target\'s velocity vector. "Ahead" of the target in the ' +
      'direction of motion.\n\n' +
      '+z (H-bar / Cross-track): along the target\'s angular momentum vector. "Left" of the ' +
      'target if the target is moving in the +V direction.\n\n' +
      'The RIC frame rotates as the target orbits, so it is non-inertial. The CW equations ' +
      'capture this rotation as a set of Coriolis and centrifugal-like terms in the equations ' +
      'of relative motion. Operators think in RIC, the physics tracks the rotation.',
    citation: 'Vallado §6.7; Curtis Ch. 7',
  },
  {
    id: 'cw_model',
    title: 'CW Model and Assumptions',
    subtitle: 'Closed-form relative motion when the assumptions hold',
    estMinutes: 5,
    demoKind: 'cw_vs_kepler',
    body:
      'The Clohessy-Wiltshire (CW) equations provide closed-form analytical solutions for ' +
      'relative motion in the RIC frame. They were originally derived for satellite rendezvous ' +
      'guidance, and they remain the workhorse model for proximity operations training and ' +
      'first-cut planning today.\n\n' +
      'Assumptions:\n' +
      '  1. The target is in a circular orbit (eccentricity ≈ 0).\n' +
      '  2. The dynamics are two-body: no J2, no drag, no third-body perturbations.\n' +
      '  3. The chase is close to the target — typically within 1% of orbit radius.\n' +
      '  4. The chase\'s mass is negligible (no mutual gravity).\n\n' +
      'When these assumptions hold, CW is fast and accurate. When they break — large offsets, ' +
      'eccentric target orbit, long propagation times where J2 matters — you switch to ' +
      'numerical propagation of the full relative dynamics. For RPO inside about 10 km in LEO, ' +
      'CW is excellent. Beyond that, validate against the full nonlinear model.',
    citation: 'Clohessy & Wiltshire (1960); Vallado §6.7; Curtis Ch. 7',
  },
  {
    id: 'perch',
    title: 'Perch Trajectory',
    subtitle: 'Stationary in the RIC frame',
    estMinutes: 5,
    demoKind: 'sandbox_perch',
    problemId: 'p1_perch',
    body:
      'A perch is the simplest relative-motion trajectory. The chase shares the target\'s ' +
      'orbit exactly, but is displaced along the in-track direction. In the RIC frame, the ' +
      'chase appears stationary at (0, y₀, 0) for all time.\n\n' +
      'All classical orbital elements match between chase and target except true anomaly. The ' +
      'chase is at the same altitude, same plane, same shape — just at a different point along ' +
      'the same orbit.\n\n' +
      'A perch is operationally useful for fixed observation geometry: an inspector that wants ' +
      'to view the target from a consistent angle, perhaps to characterize a recurring event ' +
      '(spin period, antenna scan cycle, payload activation). The downside: only one viewing ' +
      'angle. If you need to see other faces of the target, you need a different trajectory.',
    citation: 'Vallado §6.7',
  },
  {
    id: 'linear_drift',
    title: 'Linear Drift',
    subtitle: 'Constant along-track motion from a radial offset',
    estMinutes: 5,
    demoKind: 'sandbox_drift',
    problemId: 'p2_drift',
    body:
      'A linear drift trajectory results from a radial offset with zero relative velocity at ' +
      'insertion. The chase is at a slightly different altitude than the target. The chase ' +
      'orbital period is therefore slightly different, and over time the chase drifts along ' +
      'the in-track direction.\n\n' +
      'Above the target (positive R-bar offset): the chase orbit has a larger semi-major axis, ' +
      'longer period, smaller mean motion. The chase falls behind in the in-track direction. ' +
      'Drift rate is negative along V-bar.\n\n' +
      'Below the target (negative R-bar offset): smaller orbit, faster, drifts ahead. Drift ' +
      'rate is positive along V-bar.\n\n' +
      'The CW closed-form drift rate is:\n' +
      '  ẏ = −1.5 · n · x₀\n' +
      'where n is the target\'s mean motion and x₀ is the radial offset. The insertion ' +
      'delta-V from coorbital is 1.5 · n · x₀ along radial.\n\n' +
      'Linear drift is the natural state of any chase whose semi-major axis does not exactly ' +
      'match the target. It is also the cheapest way to close the in-track gap when phasing.',
    citation: 'Vallado §6.7',
  },
  {
    id: 'nmc',
    title: 'Natural Motion Circumnavigation',
    subtitle: 'A 2:1 ellipse around the target — no fuel to maintain',
    estMinutes: 5,
    demoKind: 'sandbox_nmc',
    problemId: 'p3_nmc',
    body:
      'A Natural Motion Circumnavigation (NMC) is a periodic elliptical trajectory in the RIC ' +
      'frame, completing one orbit around the target per target orbital period. It is caused ' +
      'by matched semi-major axis but differing eccentricity, with appropriate initial ' +
      'conditions.\n\n' +
      'The ellipse is always 2:1: twice as long in-track as in-radial. For a radial amplitude ' +
      'of A_r kilometers, the chase sweeps from +A_r to −A_r radially while sweeping from −2·A_r ' +
      'to +2·A_r in-track. The chase wraps around the target once per orbital period.\n\n' +
      'Operationally, an NMC sweeps through multiple viewing angles without consuming ' +
      'propellant once established. Long-duration inspections (commercial servicing rehearsals, ' +
      'GSSAP-style characterization) routinely use NMCs to vary the sun-target-chase geometry ' +
      'as Earth and the orbit progress.',
    citation: 'Vallado §6.7; Curtis Ch. 7',
  },
  {
    id: 'engagement',
    title: 'Engagement Considerations',
    subtitle: 'What turns an academic computation into a real mission',
    estMinutes: 10,
    demoKind: 'engagement_toggles',
    body:
      'A clean CW solution that closes ρ from 100 km to 1 km is mathematically a rendezvous. ' +
      'It is not yet a mission. Five additional considerations turn the computation into a ' +
      'flight plan:\n\n' +
      '1. Relative-motion sensors. Optical, infrared, and LIDAR sensors each have effective ' +
      'ranges, field-of-view limits, and bias / noise characteristics. A trajectory that is ' +
      'mathematically correct but flies outside the sensor envelope is operationally blind.\n\n' +
      '2. Lighting, quantified by the CATS angle (Camera-Target-Sun). When the chase is on ' +
      'the sun-side of the target (CATS angle small), the target is lit and the sensor is ' +
      'unblinded — favorable imaging. When the target is between the sun and the chase (CATS ' +
      'large), the target is back-lit and the sensor risks looking into the sun.\n\n' +
      '3. Ground contacts. Operators plan maneuvers around the windows where ground sites have ' +
      'line of sight, so commands can be sent and telemetry returned. A pre-positioned burn ' +
      'executed during a ground gap may not be aborted in time if something goes wrong.\n\n' +
      '4. Keep-in and keep-out zones. Approach corridors (keep-in) constrain the chase to a ' +
      'pre-cleared volume of space, for safety, sensor geometry, or operational reasons. ' +
      'Exclusion regions (keep-out) bound off antenna boresight beams, plume cones, or other ' +
      'sensitive volumes that the chase must avoid.\n\n' +
      '5. Passive safety. A trajectory is passively safe if the chase\'s free-drift trajectory ' +
      'after any single burn does not impact the target or violate a keep-out zone within the ' +
      'planning horizon. This is the canonical check that follow-on burns can be missed without ' +
      'consequence. It is the single most important engagement constraint in real RPO.\n\n' +
      'The 10-to-1 rule (Jack Anthony, "Astro Corner") is the simplest field check for closure ' +
      'rate: closing rate in m/s should not exceed range in km divided by ten. Plenty of ' +
      'real-world conjunctions trace back to violations of this rule.',
    citation: 'Vallado §6.6; Jack Anthony, Astro Corner — The 10-to-1 Rule',
  },
  {
    id: 'self_check',
    title: 'Self-Check',
    subtitle: 'Five questions to test the foundation',
    estMinutes: 5,
    demoKind: 'quiz',
    body:
      'Five multiple-choice questions covering the foundational RPO concepts from the ' +
      'preceding sections. Submit your answer, then reveal the explanation. There is no ' +
      'penalty for a wrong answer — the goal is calibration.',
  },
]

// --- Quiz questions ---

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1_ric',
    prompt:
      'In the target-centered RIC frame, the +z (cross-track) axis points along which target vector?',
    choices: [
      { id: 'a', text: 'The position vector from Earth' },
      { id: 'b', text: 'The velocity vector' },
      { id: 'c', text: 'The angular momentum vector (r × v)' },
      { id: 'd', text: 'The vector from target to chase (rho)' },
    ],
    correctChoiceId: 'c',
    explanation:
      'Cross-track is defined along the orbital angular momentum vector, h = r × v. Radial (R) is along r, in-track (I) is along v.',
  },
  {
    id: 'q2_cw',
    prompt:
      'Which of the following is NOT an assumption of the Clohessy-Wiltshire model?',
    choices: [
      { id: 'a', text: 'The target orbit is circular' },
      { id: 'b', text: 'Two-body gravity only (no J2 or drag)' },
      { id: 'c', text: 'The chase is close to the target' },
      { id: 'd', text: 'The chase mass is large compared to the target mass' },
    ],
    correctChoiceId: 'd',
    explanation:
      'CW assumes the chase mass is negligible (no mutual gravity perturbation). It does NOT assume the chase is large.',
  },
  {
    id: 'q3_coes',
    prompt:
      'Which orbital element differs between chase and target for a Perch trajectory?',
    choices: [
      { id: 'a', text: 'Inclination (i)' },
      { id: 'b', text: 'Semi-major axis (a)' },
      { id: 'c', text: 'Eccentricity (e)' },
      { id: 'd', text: 'True anomaly (ν)' },
    ],
    correctChoiceId: 'd',
    explanation:
      'A Perch has all COEs matched except true anomaly — the chase is at the same orbit shape and orientation, just at a different point along it.',
  },
  {
    id: 'q4_cats',
    prompt:
      'The CATS angle is measured between which two vectors at the target vertex?',
    choices: [
      { id: 'a', text: 'Target → Earth and target → Sun' },
      { id: 'b', text: 'Target → Chase (rho) and target → Sun' },
      { id: 'c', text: 'Chase velocity and target velocity' },
      { id: 'd', text: 'Target → Earth and target → Chase' },
    ],
    correctChoiceId: 'b',
    explanation:
      'CATS is the angle between the rho vector (target → chase) and the target → Sun direction. A small CATS angle means the chase is on the sun-side of the target — favorable imaging.',
  },
  {
    id: 'q5_passive_safety',
    prompt:
      'A trajectory is passively safe if...',
    choices: [
      { id: 'a', text: 'It uses less than 100 m/s of delta-V' },
      { id: 'b', text: 'The chase free-drift after any burn does not impact or violate keep-out within the horizon' },
      { id: 'c', text: 'The chase always closes range monotonically' },
      { id: 'd', text: 'The chase remains within 10 km of the target throughout the mission' },
    ],
    correctChoiceId: 'b',
    explanation:
      'Passive safety means even if subsequent burns are missed, the resulting free-drift trajectory does not produce a conjunction or zone violation. It is the canonical RPO safety guardrail.',
  },
]
