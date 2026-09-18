import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { assertPortraitEyePerformance } from "./assertPortraitEyePerformance";
import { IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";

/**
 * Move paired lid margins towards one shared seam without changing their
 * identity sphere. The upper margin supplies three quarters of closure travel;
 * the lower supplies one quarter. These are explicit authoring kinematics, not
 * a simulation of individual muscle fibres. The outer skin guide stays separate.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Evaluates open, closed and observed-relative lid movement on one anatomical boundary.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Changes aperture visibility independently of optical dimensions.
 */
export function posePortraitLidCurves(
  upper: readonly IAutoMovieVector3[],
  lower: readonly IAutoMovieVector3[],
  performance: IPortraitEyePerformance,
): { upper: IAutoMovieVector3[]; lower: IAutoMovieVector3[] } {
  assertPortraitEyePerformance(performance);
  if (
    upper.length < 3 ||
    lower.length !== upper.length ||
    [...upper, ...lower].some(
      (point) => ![point.x, point.y, point.z].every(Number.isFinite),
    )
  )
    throw new Error(
      "Animated eyelids need paired finite anatomical margin samples.",
    );
  if (performance.blink === performance.observedBlink)
    return {
      upper: structuredClone([...upper]),
      lower: structuredClone([...lower]),
    };
  const ratio = (1 - performance.blink) / (1 - performance.observedBlink);
  const seam = upper.map((point, i) =>
    Vector3.add(Vector3.scale(point, 0.25), Vector3.scale(lower[i], 0.75)),
  );
  const move = (points: readonly IAutoMovieVector3[]) =>
    points.map((point, i) =>
      Vector3.add(
        seam[i],
        Vector3.scale(Vector3.subtract(point, seam[i]), ratio),
      ),
    );
  const result = { upper: move(upper), lower: move(lower) };
  if (
    [...result.upper, ...result.lower].some(
      (point) => ![point.x, point.y, point.z].every(Number.isFinite),
    )
  )
    throw new Error(
      "Eyelid motion exceeds representable construction coordinates.",
    );
  return result;
}
