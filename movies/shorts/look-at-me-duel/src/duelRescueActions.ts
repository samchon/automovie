import { duelEvents } from "./duelEvents";

/**
 * The rescue's preparation, action, support reservations and recovery on one clock.
 * These source actions own the 25–48 second performance, not frame corrections.
 * Approach, across-front and four westward transfers have separate
 * support ownership. Runtime contact/clearance remains measured. No boxing
 * timings, range limits or local solver are imported.
 *
 * Ranges are absolute film seconds; distances are court metres. Body planning
 * and contact resolution consume the same frame plan. The fixed 25 second input
 * remains unchanged; this data alone grants no contact or delivery admission.
 */
export const duelRescueActions = {
  approach: { Carina: [30.5, 34.8], Harry: [31.2, 33.2], steps: { Carina: 6, Harry: 2 } },
  acrossFront: [36.0, 37.7],
  wristReach: { prepare: [33.9, 35.2], recover: [36.1, 36.7] },
  redirect: { prepare: [35.1, 35.9], recover: [36.3, 36.8], pushSeconds: 0.30 },
  forearmGrip: [36.2, 36.9],
  shoulder: { prepare: [36.9, 37.7], recover: [44.6, 46] },
  lowerBody: { prepare: [36.7, 37.8], recover: [44.5, 46] },
  escape: { action: [duelEvents.escapeStart, duelEvents.escapePlanted], steps: 4, westMetres: 0.73 },
  wandDrop: { Carina: [29.1, 30.5], Harry: [35.2, 36.2] },
  shield: { prepare: [40, duelEvents.shieldRaised], recover: [duelEvents.shieldFade, 45.2] },
  recoveryStep: [44.6, 45.9],
} as const;
