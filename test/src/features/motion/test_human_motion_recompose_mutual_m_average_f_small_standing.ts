import { motionRecomposeMutual } from "../internal/motionRecomposeMutual";

/**
 * The mutual and prop-handling laws composed over the grammar's bases, roles
 * and props (`motionRecomposeMutual`'s eight scenarios) for the m-average with
 * the f-small, standing; the other pairs and bases are its sibling parts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs every law of the matrix through the public chains for this pair and base (`motionRecomposeMutual`); a broken verdict fails with its cell.
 * @evidence contracts/development/testing.md#independent-expectations The verdicts and bounds are `motionRecomposeMutual`'s, each with its source there.
 * @evidence contracts/development/testing.md#distinguishing-cases One pair of statures on one base; the parts together are the whole matrix.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on prepared polygon-man bodies and archetype props, discovered by its exported name; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the pair, the base and where the scenarios are listed.
 */
export function test_human_motion_recompose_mutual_m_average_f_small_standing(): void {
  motionRecomposeMutual("m-average", "f-small", "standing");
}
