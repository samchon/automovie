/*
 * The sharpness an edge's two halves carry after one refinement step.
 *
 * DeRose, Kass and Truong (1998) lower a semi-sharp edge's sharpness by one per
 * step, never below zero, so sharpness `s` keeps the sharp rules for `s` steps;
 * the infinitely sharp value 10 never decays.
 * Parameter sharpness: Parent sharpness from 0 to 10.
 * Returns: Child sharpness from 0 to 10.
 */
export const decaySubdivisionSharpness = (sharpness: number): number =>
  sharpness >= 10 ? 10 : Math.max(0, sharpness - 1);
