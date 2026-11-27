import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../../audit/internal/AutoMovieMotionHumanAuditTangleModel";

/**
 * Measure one pair of seated-body segments beyond their built-in overlap. Use
 * the same directed hull and axis probes in both directions as the
 * displayed-body collision reading.
 */
export function seatedPairDepth(
  body: IAutoMovieMotionHumanBody,
  first: AutoMovieHumanoidBone,
  second: AutoMovieHumanoidBone,
): (placed: readonly IAutoMovieMotionHumanColliders.IPlaced[]) => number {
  const model: IAutoMovieMotionHumanAuditTangleModel.IModel = body.tangle;
  const a: number = model.parts.findIndex(
    (p: IAutoMovieMotionHumanAuditTangleModel.IPart): boolean =>
      p.bone === first,
  );
  const b: number = model.parts.findIndex(
    (p: IAutoMovieMotionHumanAuditTangleModel.IPart): boolean =>
      p.bone === second,
  );
  return (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): number => {
    if (a < 0 || b < 0) return 0;
    return Math.max(
      Tangle.excess(model, placed, a, b),
      Tangle.excess(model, placed, b, a),
    );
  };
}
