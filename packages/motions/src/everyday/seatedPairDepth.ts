import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../audit/AutoMovieMotionHumanAuditTangleModel";

/**
 * Measure one pair of seated-body segments beyond their built-in overlap.
 * Use the same directed hull and axis probes in both directions as the
 * displayed-body collision reading.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Both segments belong to the same body and the placed segments describe one world-metre posture.
 * @evidence contracts/development/implementation.md#principled-implementation Each directed excess removes only the overlap present in the reference anatomy.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two fixed part indices feed the two directed measurements of one placement.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each requested posture supplies its own real profile placement.
 * @evidence contracts/development/implementation.md#efficient-algorithms Only the two selected segments' probes are compared.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The reader shares the body's native material model and its fixed indices.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources It retains no observed pose or result.
 */
export function seatedPairDepth(
  body: IAutoMovieMotionHumanBody,
  first: AutoMovieHumanoidBone,
  second: AutoMovieHumanoidBone,
): (placed: readonly IAutoMovieMotionHumanColliders.IPlaced[]) => number {
  const model: Tangle.IModel = Tangle.model(body);
  const a: number = model.parts.findIndex((p: Tangle.IPart): boolean => p.bone === first);
  const b: number = model.parts.findIndex((p: Tangle.IPart): boolean => p.bone === second);
  return (placed: readonly IAutoMovieMotionHumanColliders.IPlaced[]): number => {
    if (a < 0 || b < 0) return 0;
    return Math.max(Tangle.excess(model, placed, a, b), Tangle.excess(model, placed, b, a));
  };
}
