/**
 * The sharpness an edge's two halves carry after one refinement step.
 *
 * DeRose, Kass and Truong (1998) lower a semi-sharp edge's sharpness by one per
 * step, never below zero, so sharpness `s` keeps the sharp rules for `s` steps;
 * the infinitely sharp value 10 never decays.
 *
 * @param sharpness Parent sharpness from 0 to 10.
 * @returns Child sharpness from 0 to 10.
 *
 * @evidence contracts/common.md#principled-implementation The uniform decrement of the published semi-sharp crease model, with OpenSubdiv's infinite value held fixed.
 * @evidence contracts/common.md#clear-and-simple-design One rule shared by edge refinement, vertex-rule transitions and the limit ring, so all three age a crease alike.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller-specific schedule; the decrement is the same for every edge.
 * @evidence contracts/common.md#meaningful-documentation States the rule, its source, the floor and the fixed infinite value.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One comparison and one subtraction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar function with nothing to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
 */
export const decaySubdivisionSharpness = (sharpness: number): number =>
  sharpness >= 10 ? 10 : Math.max(0, sharpness - 1);
