import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { assertPortraitEyePerformance } from "./assertPortraitEyePerformance";
import { IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";

/**
 * Fraction of the aperture height that the lower margin travels in a full
 * closure, 0.1. A blink is made by the upper lid. Willett, Maenner and Mayo
 * (Front Syst Neurosci 2023), reviewing Doane (Am J Ophthalmol 1980;89:507-516),
 * write that the upper lid descends until it meets the lower lid while the
 * lower lid moves 3 to 5 mm in a nasal horizontal direction: the lower lid
 * closes the aperture by sliding sideways and not by rising. The value is a
 * convention that follows that direction of motion. Neither that review nor
 * any other text read for this declaration states the lower lid's vertical
 * excursion, so the 0.1 is not a measurement and reading Doane (1980) for it
 * is open work. The same ratio applies to every aperture, so a taller fissure
 * moves its lower lid proportionally more.
 */
const LOWER_MARGIN_CLOSURE_SHARE = 0.1;

/**
 * Move paired lid margins towards one shared seam without changing their
 * identity sphere. The upper margin supplies nine tenths of the closure travel
 * and the lower margin one tenth (`LOWER_MARGIN_CLOSURE_SHARE`), so the closed
 * seam lies just above the observed lower margin. These are explicit authoring
 * kinematics, not a simulation of individual muscle fibres. The outer skin
 * guide stays separate.
 *
 * Each pair `upper[i]`, `lower[i]` is one station of the aperture, and the
 * seam of a station is the fixed point between them at that share. A margin
 * point moves along the straight segment to its seam by the ratio
 * `(1 - blink) / (1 - observedBlink)`: one leaves the observation, zero is the
 * common seam and a ratio above one reopens beyond the observation. The
 * segment is a chord, not an arc over the globe, so the caller projects the
 * result back onto the optical surface, as the eye component does. A
 * performance outside its admitted ranges, unpaired or non-finite curves, and
 * a result that overflows finite coordinates all throw, and the caller's
 * curves are never modified. Equal current and observed closure returns owned
 * copies of the inputs.
 *
 * @evidence contracts/common.md#principled-implementation A convex blend of a station with its own seam is the motion that keeps the pair between its endpoints and brings both to one point at full closure. Dividing by (1 - observedBlink) makes the observation the ratio-one state whatever closure it already carried, and the admission's 0.95 ceiling on observed closure keeps that divisor positive. Extrapolation past the observation is allowed and its overflow is checked.
 * @evidence contracts/common.md#clear-and-simple-design One function computes the seam and moves both curves toward it with the single share constant; it has no option and no state, and the caller owns the projection back onto the globe.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The motion is a function of the two curves and the performance only. The share is one named constant with a stated basis, not a value chosen for a fixture or a photograph, and nothing is patched around another module.
 * @evidence contracts/common.md#meaningful-documentation The comment states the share and its basis, the seam definition, the ratio, that the path is a chord the caller projects, every refusal and the ownership of the copies.
 * @evidence contracts/modeling.md#spatial-conventions The function is a pure affine blend of points in whatever right-handed frame and unit its caller uses, so it introduces no conversion; the eye component supplies head millimetres.
 * @evidence contracts/anatomy.md#parametric-authority The input is the named physiological motion of eyelid closure as a fraction relative to the observation; no input addresses a vertex or a curve, since the curves are the subject's own measured aperture and the function moves them by one ratio.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function moves two curves and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes the performance record and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits one point per input point and no primitive of its own.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; the shared seam it computes is the boundary of the upper and lower curves, and the eye component builds the lid rows from it.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing; the lids it moves are observed under the eye component.
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
    Vector3.add(
      Vector3.scale(point, LOWER_MARGIN_CLOSURE_SHARE),
      Vector3.scale(lower[i], 1 - LOWER_MARGIN_CLOSURE_SHARE),
    ),
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
