import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 as Point } from "@automovie/interface";

import { fitPortraitEyeSphere } from "../../surface/fitPortraitEyeSphere";
import { portraitEyeSphereIntersection } from "../../surface/portraitEyeSphereIntersection";
import { buildPortraitCanthalMesh } from "./buildPortraitCanthalMesh";
import { createPortraitCanthalIntersection } from "./createPortraitCanthalIntersection";
import { fitPortraitCanthalSphere } from "./fitPortraitCanthalSphere";
import type { IPortraitEyeShape } from "./structures/IPortraitEyeShape";

/**
 * Establish one eye's fixed optical identity before its lid performance.
 * createPortraitEyeComponent supplies shaped observed curves in construction
 * millimetres and a forward camera ray. Legacy cap fitting keeps its previous
 * arithmetic and a separate unshifted guide sphere. Tangent canthal support
 * instead keeps the original observed seam and joins fixed canthi to the
 * declared optical body. Gaze never participates in either identity fit.
 *
 * The returned intersection owns the same sampled canthal surface used for
 * drawing and later contact. These owned meshes are read-only to consumers;
 * changes of aperture, dimensions or tessellation require a new fit, whereas
 * blink/gaze reuse the identity. This does not settle final skin clearance.
 *
 * Inputs and results are head millimetres with the camera ray pointing
 * anteriorly. With tangent canthal support the sphere, its hull mesh and an
 * intersection over that mesh are returned. Otherwise the sphere is fitted to
 * the aperture by the shape's fit mode and, when `globeLift` is nonzero, the
 * whole sphere is moved along the normalized ray by that many millimetres while
 * the unshifted `fittedSphere` is retained as the guide for the outer seam;
 * the intersection then projects onto the shifted sphere. Fitting failures of
 * the delegated routines throw unchanged.
 *
 * @evidence contracts/common.md#principled-implementation The identity is chosen once from the observed curves, before any blink or gaze, by delegating to the two fitting routines that each own their derivation, and a globe depth shift is a translation along the recorded ray, which keeps every image coordinate along that ray unchanged. Keeping the unshifted fit beside the shifted sphere is what lets the outer skin seam ignore optical prominence.
 * @evidence contracts/common.md#clear-and-simple-design One function selects between the two fit strategies by one shape field and returns the same shape of result for both, so the consumer does not branch on the strategy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The support is a function of the curves, the ray and the shape only, with no case named after a subject or fixture and no compensating retry.
 * @evidence contracts/common.md#meaningful-documentation The comment states when the identity is fixed, what each strategy returns, how the lift acts and what stays unshifted, the units and where failures come from.
 * @evidence contracts/modeling.md#spatial-conventions Every input and result is head millimetres in one right-handed frame with an anterior camera ray, and the only transformation is the translation along that ray, applied by name.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function fits an optical identity and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes the shape's fit fields and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits the canthal hull only by delegating to its builder, and no primitive of its own.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own; the radius and lift are the shape's.
 */
export function createPortraitEyeSupport(
  upper: readonly Point[],
  lower: readonly Point[],
  direction: Point,
  shape: IPortraitEyeShape,
) {
  if (shape.canthalSupport === "tangent") {
    const sphere = fitPortraitCanthalSphere(
      upper,
      lower,
      direction,
      shape.surfaceRadius,
      shape.globeLift,
    );
    const canthal = buildPortraitCanthalMesh(
      sphere,
      [upper[0], upper[upper.length - 1]],
      Math.max(3, shape.sampling.eyeColumns),
      Math.max(2, shape.sampling.eyeRows),
    );
    return {
      sphere,
      fittedSphere: sphere,
      shifted: false,
      canthal,
      intersect: createPortraitCanthalIntersection(canthal.surface, direction),
    };
  }
  const fittedSphere = fitPortraitEyeSphere(
    [...upper],
    [...lower],
    direction,
    shape.surfaceRadius,
    shape.sphereFit,
  );
  const shifted = shape.globeLift !== undefined && shape.globeLift !== 0;
  const sphere = shifted
    ? {
        ...fittedSphere,
        center: Vector3.add(
          fittedSphere.center,
          Vector3.scale(Vector3.normalize(direction), shape.globeLift!),
        ),
      }
    : fittedSphere;
  return {
    sphere,
    fittedSphere,
    shifted,
    canthal: undefined,
    intersect: (point: Point) =>
      portraitEyeSphereIntersection(sphere, point, direction),
  };
}
