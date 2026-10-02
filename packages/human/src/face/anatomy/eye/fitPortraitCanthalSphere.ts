import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 as Point } from "@automovie/interface";

import type { IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";

/**
 * Fit an optical body independently of the complete canthal aperture width.
 * The eye component supplies observed, shaped upper/lower curves in common
 * construction millimetres before applying blink. The camera ray points
 * forward; the canthal midpoint owns transverse placement, never the iris's
 * gaze marker. This routine owns no caller data and returns one fixed sphere.
 *
 * Only rays inside the declared optical disk contribute a spherical residual.
 * Each visible canthus inside that disk also bounds the body's forward depth.
 * Projecting the least-squares depth onto their common half-line preserves
 * those anchors. Exterior anchors are connected by portraitCanthalMesh; they
 * do not force a larger optical radius. Radius remains an authored dimension,
 * not a clinical estimate. Skin attachment and performed corneal clearance
 * remain separate admission conditions of the consuming component.
 *
 * For each lid point inside the optical disk, the ray parallel to `direction`
 * meets the sphere of the given radius, centred on the canthal-midpoint axis,
 * in front of that centre by the half-chord `sqrt(radius^2 - t^2)`, with `t`
 * the point's distance from the axis. The centre depth that puts that point
 * on the sphere is the point's depth minus the half-chord; the fit takes the
 * mean of these depths over the lower rim and the interior upper points, which
 * is the least-squares centre depth along the ray. It is then capped at the
 * value that keeps each visible canthus on or in front of the sphere and moved
 * by `lift` (millimetres along the ray, positive towards the camera side). The
 * inputs are head millimetres, and the returned centre and radius are in them.
 * Curves shorter than three samples, a non-positive radius, a non-finite
 * value, a zero direction, endpoints that are not shared or not distinct, no
 * lid ray inside the disk, and a depth that would hide a canthus all throw.
 *
 * @evidence contracts/common.md#principled-implementation With the radius and the transverse position fixed by the canthal midpoint axis, each lid point constrains only the centre depth, and the mean of those constraints minimises the sum of squared depth residuals, so the fit is the exact least-squares solution of its one-parameter model. Points outside the disk have no intersection and contribute nothing, which is why at least one must remain. Capping by the canthal residuals keeps the fixed corners visible rather than enlarging the globe, and the fit says it does not recover an anatomical globe centre.
 * @evidence contracts/common.md#clear-and-simple-design One function reduces two curves, a ray and a radius to one sphere by one depth solve, and delegates the connective tissue between the sphere and the corners to the canthal mesh builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The depth is computed from the given curves and radius alone, with no value chosen for a subject or fixture and no compensating retry.
 * @evidence contracts/common.md#meaningful-documentation The comment states the model, why the mean is the least-squares depth, the cap and the lift, the units and every refusal, and says that the radius is authored and not a clinical estimate.
 * @evidence contracts/modeling.md#spatial-conventions Every input and the returned sphere are head millimetres in one right-handed frame with the camera ray pointing anteriorly; the depth solve is along that named ray and converts no frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function fits one sphere and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes the eye's radius and lift and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function returns a sphere and builds no surface; the canthal mesh builder joins this sphere to the fixed corners.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing; the globe it places is observed under the eye component.
 */
export function fitPortraitCanthalSphere(
  upper: readonly Point[],
  lower: readonly Point[],
  direction: Point,
  radius: number,
  lift = 0,
): IPortraitEyeSphere {
  if (
    upper.length < 3 ||
    lower.length < 3 ||
    !Number.isFinite(radius) ||
    radius <= 0 ||
    !Number.isFinite(lift) ||
    [...upper, ...lower, direction].some(
      (p) => ![p.x, p.y, p.z].every(Number.isFinite),
    ) ||
    Vector3.length(direction) === 0
  )
    throw new Error(
      "Canthal fitting needs finite curves, direction and optical dimensions.",
    );
  const anchors = [upper[0], upper[upper.length - 1]];
  if (
    Vector3.length(Vector3.subtract(anchors[0], lower[0])) !== 0 ||
    Vector3.length(Vector3.subtract(anchors[1], lower[lower.length - 1])) !==
      0 ||
    Vector3.length(Vector3.subtract(...(anchors as [Point, Point]))) === 0
  )
    throw new Error("Canthal curves must share two distinct fixed endpoints.");
  const midpoint = Vector3.scale(Vector3.add(anchors[0], anchors[1]), 0.5);
  const ray = Vector3.normalize(direction);
  const residual = (point: Point): number[] => {
    const delta = Vector3.subtract(point, midpoint);
    const depth = Vector3.dot(delta, ray);
    const squared = radius * radius - Vector3.dot(delta, delta) + depth * depth;
    return squared < 0 ? [] : [depth - Math.sqrt(squared)];
  };
  const offsets = [...lower, ...upper.slice(1, -1)].flatMap(residual);
  if (offsets.length === 0)
    throw new Error(
      "The optical disk must support at least one observed lid ray.",
    );
  const bounds = anchors.flatMap(residual);
  const mean = offsets.reduce((sum, value) => sum + value, 0) / offsets.length;
  const depth = Math.min(mean, ...bounds) + lift;
  if (!Number.isFinite(depth) || bounds.some((bound) => depth > bound + 1e-9))
    throw new Error(
      "Optical depth must preserve visible canthi in its finite domain.",
    );
  const center = Vector3.add(midpoint, Vector3.scale(ray, depth));
  if (![center.x, center.y, center.z].every(Number.isFinite))
    throw new Error("Canthal fitting exceeds finite construction coordinates.");
  return { center, radius };
}
