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
 * @evidence contracts/common.md#principled-implementation Inside-disk spherical ray residuals determine least-squares axial depth constrained by visible canthal half-lines while keeping declared radius.
 * @evidence contracts/common.md#clear-and-simple-design The canthal midpoint owns transverse identity and the optical body depth stays separate from later source skin/corneal contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exterior anchors do not inflate the optical radius; the 1e-9 depth comparison is a stated construction arithmetic tolerance, not anatomical clearance.
 * @evidence contracts/common.md#meaningful-documentation The prose states millimetres, forward ray, residual law, endpoint identity and unsupported-disk refusal.
 * @evidence contracts/performance.md#efficient-algorithms Upper/lower curve scans and fixed-size vector residuals require linear time and proportional residual storage.
 * @evidence contracts/performance.md#reuse-equivalent-work A normalized ray and shared midpoint serve every residual; each anchor's depth bound is computed once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an owned sphere escapes; curve/residual arrays expire with no retained input or external resource.
 */
export function fitPortraitCanthalSphere(
  upper: readonly Point[],
  lower: readonly Point[],
  direction: Point,
  radius: number,
  lift: number = 0,
): IPortraitEyeSphere {
  if (
    upper.length < 3 ||
    lower.length < 3 ||
    !Number.isFinite(radius) ||
    radius <= 0 ||
    !Number.isFinite(lift) ||
    [...upper, ...lower, direction].some(
      (p: Point): boolean => ![p.x, p.y, p.z].every(Number.isFinite),
    ) ||
    Vector3.length(direction) === 0
  )
    throw new Error(
      "Canthal fitting needs finite curves, direction and optical dimensions.",
    );
  const anchors: Point[] = [upper[0], upper[upper.length - 1]];
  if (
    Vector3.length(Vector3.subtract(anchors[0], lower[0])) !== 0 ||
    Vector3.length(Vector3.subtract(anchors[1], lower[lower.length - 1])) !==
      0 ||
    Vector3.length(Vector3.subtract(...(anchors as [Point, Point]))) === 0
  )
    throw new Error("Canthal curves must share two distinct fixed endpoints.");
  const midpoint: Point = Vector3.scale(
    Vector3.add(anchors[0], anchors[1]),
    0.5,
  );
  const ray: Point = Vector3.normalize(direction);
  const residual: (point: Point) => number[] = (point: Point): number[] => {
    const delta: Point = Vector3.subtract(point, midpoint);
    const depth: number = Vector3.dot(delta, ray);
    const squared: number =
      radius * radius - Vector3.dot(delta, delta) + depth * depth;
    return squared < 0 ? [] : [depth - Math.sqrt(squared)];
  };
  const offsets: number[] = [...lower, ...upper.slice(1, -1)].flatMap(residual);
  if (offsets.length === 0)
    throw new Error(
      "The optical disk must support at least one observed lid ray.",
    );
  const bounds: number[] = anchors.flatMap(residual);
  const mean: number =
    offsets.reduce((sum: number, value: number): number => sum + value, 0) /
    offsets.length;
  const depth: number = Math.min(mean, ...bounds) + lift;
  if (
    !Number.isFinite(depth) ||
    bounds.some((bound: number): boolean => depth > bound + 1e-9)
  )
    throw new Error(
      "Optical depth must preserve visible canthi in its finite domain.",
    );
  const center: Point = Vector3.add(midpoint, Vector3.scale(ray, depth));
  if (![center.x, center.y, center.z].every(Number.isFinite))
    throw new Error("Canthal fitting exceeds finite construction coordinates.");
  return { center, radius };
}
