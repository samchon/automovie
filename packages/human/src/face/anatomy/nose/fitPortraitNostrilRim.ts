import { Vector3 } from "@automovie/engine";

import { normalizedRim } from "./normalizedRim";
import { portraitNostrilRimNormal } from "./portraitNostrilRimNormal";

/**
 * Regularize one ordered nasal rim in its own fitted plane. Zero copies the
 * measured boundary; one uses an ellipse whose principal axes and extents come
 * from that boundary. Perimeter progress preserves cyclic vertex ownership,
 * and recentering preserves the original centroid before blending.
 * The operation is independent of head orientation and does not choose a new
 * nasal opening or alter its connectivity. All distances remain millimetres.
 *
 * @evidence contracts/common.md#principled-implementation The rim is projected into its Newell plane, the longest planar chord fixes a frame, and the principal angle 0.5 atan2(2 Sxy, Sxx - Syy) of the second moments is the classical orientation of the moment ellipse; the fitted ellipse uses the boundary's own extents on those axes, is parameterised by perimeter progress so each vertex keeps its cyclic owner, and is recentred to the measured centroid before a linear blend by the amount. Zero copies the rim exactly. A collinear rim gives a zero radius and refuses through the finite-output check.
 * @evidence contracts/common.md#clear-and-simple-design One fit that blends a measured cycle toward its own moment ellipse; connectivity and the opening choice stay with the host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased; the ellipse is derived from the rim alone and the blend amount is the caller's named roundness.
 * @evidence contracts/common.md#meaningful-documentation The comment states the plane, the axes, the perimeter parameterisation, the recentring, the exact-copy case and the units.
 * @evidence contracts/modeling.md#spatial-conventions Input and output are head millimetres; the blend amount is dimensionless in [0,1]; the fit is head-orientation independent because it works in the rim's own plane.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nostril aperture owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no mesh primitives; it returns values for its caller to place.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the callers that share its result own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; callers admit theirs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on values its owner already named, not an input through which a caller shapes a human form.
 */
export function fitPortraitNostrilRim(
  points: number[][],
  amount: number,
): number[][] {
  if (
    points.length < 3 ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > 1 ||
    points.some((point) => point.length !== 3 || !point.every(Number.isFinite))
  )
    throw new Error(
      "Nasal rim fitting needs finite three-dimensional points and a blend in [0,1].",
    );
  if (amount === 0) return points.map((point) => [...point]);
  const { scale, normalized, center, local } = normalizedRim(points);
  const normal = portraitNostrilRimNormal(local);
  let chord = Vector3.create(0, 0, 0),
    longest = 0;
  for (let i = 0; i < local.length; i++)
    for (let j = i + 1; j < local.length; j++) {
      const delta = Vector3.subtract(local[j], local[i]);
      const planar = Vector3.subtract(
        delta,
        Vector3.scale(normal, Vector3.dot(delta, normal)),
      );
      const length = Vector3.length(planar);
      if (length > longest) {
        chord = planar;
        longest = length;
      }
    }
  const u = Vector3.normalize(chord);
  const v = Vector3.cross(normal, u);
  const projected = local.map((point) => [
    Vector3.dot(point, u),
    Vector3.dot(point, v),
  ]);
  let xx = 0,
    xy = 0,
    yy = 0;
  for (const [x, y] of projected) {
    xx += x * x;
    xy += x * y;
    yy += y * y;
  }
  const angle = 0.5 * Math.atan2(2 * xy, xx - yy),
    cos = Math.cos(angle),
    sin = Math.sin(angle);
  const principal = projected.map(([x, y]) => [
    x * cos + y * sin,
    -x * sin + y * cos,
  ]);
  const radiusX = Math.max(...principal.map((point) => Math.abs(point[0])));
  const radiusY = Math.max(...principal.map((point) => Math.abs(point[1])));
  const distances = [0];
  for (let i = 0; i < principal.length; i++) {
    const a = principal[i],
      b = principal[(i + 1) % principal.length];
    distances.push(distances[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const phase = Math.atan2(
    principal[0][1] / radiusY,
    principal[0][0] / radiusX,
  );
  const major = Vector3.add(Vector3.scale(u, cos), Vector3.scale(v, sin));
  const minor = Vector3.add(Vector3.scale(u, -sin), Vector3.scale(v, cos));
  const ellipse = points.map((_point, i) => {
    const t =
      phase + (2 * Math.PI * distances[i]) / distances[distances.length - 1];
    const point = Vector3.add(
      Vector3.scale(major, radiusX * Math.cos(t)),
      Vector3.scale(minor, radiusY * Math.sin(t)),
    );
    return [point.x, point.y, point.z];
  });
  const drift = [0, 1, 2].map(
    (axis) =>
      ellipse.reduce((sum, point) => sum + point[axis], 0) / ellipse.length,
  );
  const output = normalized.map((point, i) =>
    point.map(
      (value, axis) =>
        (value * (1 - amount) +
          amount * (center[axis] + ellipse[i][axis] - drift[axis])) *
        scale,
    ),
  );
  if (output.some((point) => !point.every(Number.isFinite)))
    throw new Error(
      "The fitted nasal rim exceeds its representable coordinate range.",
    );
  return output;
}
