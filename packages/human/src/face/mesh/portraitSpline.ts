import { p } from "./p";
import type { Point } from "./structures/Point";

/**
 * Uniform Catmull-Rom interpolation through at least two ordered landmarks.
 * Progress is clamped, and endpoint neighbours repeat rather than extrapolate.
 * This is a spatial curve, not an arc-length parameterization.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Supplies the continuous spatial guides used by anatomical rims and attachments.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Evaluates uniform Catmull-Rom interpolation with clamped progress and repeated endpoint neighbors, without claiming arc-length spacing.
 * @author Samchon
 */
export const portraitSpline = (points: Point[], progress: number): Point => {
  const t = Math.max(0, Math.min(1, progress)) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(t)),
    u = t - i;
  const a = points[Math.max(0, i - 1)],
    b = points[i],
    c = points[i + 1],
    d = points[Math.min(points.length - 1, i + 2)];
  const component = (axis: "x" | "y" | "z"): number =>
    0.5 *
    (2 * b[axis] +
      (-a[axis] + c[axis]) * u +
      (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * u * u +
      (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * u * u * u);
  return p(component("x"), component("y"), component("z"));
};
