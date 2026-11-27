/*
 * The four lower tyre sites in a level board frame.
 */
export const WHEELS: readonly string[] = [
  "wheel-front-left",
  "wheel-front-right",
  "wheel-back-left",
  "wheel-back-right",
];

// The staging coefficients below are provisional. The cited studies time
// the launch, landing and foot separation but give no posture heights, so
// each value is an authored staging choice that the board-sport test
// bounds through its deck, street and clearance checks, not a measurement.

/*
 * Push-foot clearance outside the deck's edge, in foot lengths (provisional).
 */
export const PUSH_MARGIN: number = 1 / 4;

/*
 * Toe lift over the deck while a foot travels or the board rises, in foot
 * lengths (provisional).
 */
export const TOE_CLEARANCE: number = 1 / 3;

/*
 * Extra push-foot lift at take-off, in toe clearances (provisional).
 */
export const TAKEOFF_TOE_LIFT: number = 1.5;

/*
 * Pelvis drop loading the pop, in thigh lengths (provisional).
 */
export const LOAD_DROP: number = 0.18;

/*
 * Pelvis drop absorbing the landing, in thigh lengths (provisional).
 */
export const ABSORB_DROP: number = 0.24;

/*
 * Pelvis drop toward a street push, in thigh lengths, before the push fit
 * lowers it to reach (provisional).
 */
export const PUSH_DROP: number = 0.17;
