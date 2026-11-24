import { autoMovieSliceVisibility } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * The occlusion estimator the renderer runs sees half of a floor's
 * cosine-weighted hemisphere blocked beside a wall and none of it in the open:
 * the slice integral of Jimenez et al. 2016, evaluated over the exact horizons
 * of a floor meeting a wall at a right angle.
 *
 * The floor is y = 0 for x ≥ 0 and the wall x = 0 for y ≥ 0, both large; the
 * view direction is fixed (an orthographic camera) along normalize(1, 1, 0.5),
 * so both surfaces face it. For each of 256 slice directions spread over the
 * half turn, the slice's horizons are found exactly: the floor's own tangent
 * bounds them, and the wall raises the horizon on its side wherever a wall
 * point of the slice plane lies within `radius`, searched along the line where
 * the slice plane meets the wall at 1 mm steps. `autoMovieSliceVisibility`
 * turns them into the slice's visibility, as the shader does.
 *
 * Scenarios:
 *
 * 1. With `radius: 0.5`, a floor point 1 cm from the crease has visibility 0.5 ±
 *    0.05: the wall removes the half of the hemisphere facing it, and only
 *    directions within about 1° of grazing reach past the radius.
 * 2. A floor point 2 m from the wall has visibility 1.00 ± 0.02.
 * 3. With no wall at all the estimator returns exactly the open value, 1 within
 *    1e-9, for a normal facing the view and for the tilted floor normal alike.
 *
 * The GPU program's horizon search over a real depth buffer is compared with
 * these values in a capture under the visual-debugging skill.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the closed-form slice visibility over exact horizons; a wrong arc formula, a missing hemisphere clamp or a wrong projected-normal weight moves the crease value off one half or the open value off one.
 * @evidence contracts/development/testing.md#independent-expectations One half follows from the wall blocking the half-space it faces, a fact of the cosine-weighted integral; one for an open surface follows from the integral of the cosine lobe. The horizons are found here from the planes' geometry, not from the renderer.
 * @evidence contracts/development/testing.md#distinguishing-cases A point beside the wall, one beyond the radius and an open surface with two normals; the stage's ordering is owned by `test_draw_film_occlusion_order`, direct light by `test_draw_film_occlusion_direct`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_occlusion_crease`, with closed-form inputs and no GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_film_occlusion_crease(): void {
  const view: number[] = unit([1, 1, 0.5]);
  const floor: number[] = [0, 1, 0];

  // 1 and 2.
  const near: number = visibility([0.01, 0, 0], view, floor, 0.5, true);
  const far: number = visibility([2, 0, 0], view, floor, 0.5, true);
  TestValidator.predicate(
    `1 cm from the crease sees half its hemisphere (${near.toFixed(4)})`,
    Math.abs(near - 0.5) <= 0.05,
  );
  TestValidator.predicate(
    `2 m from the wall sees all of it (${far.toFixed(4)})`,
    Math.abs(far - 1) <= 0.02,
  );

  // 3. Open surfaces.
  TestValidator.predicate(
    "an open surface is fully visible for any normal",
    nclose(visibility([0, 0, 0], view, view, 0.5, false), 1, 1e-9) &&
      nclose(visibility([0, 0, 0], view, floor, 0.5, false), 1, 1e-9),
  );
}

/** The mean slice visibility at a point over 256 slices. */
function visibility(
  point: number[],
  view: number[],
  normal: number[],
  radius: number,
  wall: boolean,
): number {
  // The camera's screen axes: right and up perpendicular to the view.
  const right: number[] = unit(cross([0, 1, 0], view));
  const up: number[] = cross(view, right);
  const slices: number = 256;
  let sum: number = 0;
  for (let k: number = 0; k < slices; ++k) {
    const phi: number = (Math.PI * (k + 0.5)) / slices;
    const along: number[] = add(
      scale(right, Math.cos(phi)),
      scale(up, Math.sin(phi)),
    );
    const ortho: number[] = unit(sub(along, scale(view, dot(along, view))));
    const axis: number[] = unit(cross(along, view));
    const projected: number[] = sub(normal, scale(axis, dot(normal, axis)));
    const length: number = Math.hypot(...projected);
    const n: number =
      Math.sign(dot(ortho, projected)) *
      Math.acos(Math.max(-1, Math.min(1, dot(projected, view) / length)));
    let low: number = n - Math.PI / 2;
    let high: number = n + Math.PI / 2;
    if (wall) {
      // The slice plane meets the wall x = 0 along a line; walk it within the radius.
      const plane: number[] = cross(view, ortho);
      const direction: number[] = unit(cross(plane, [1, 0, 0]));
      // A point of both planes: x = 0 and plane · (s − point) = 0, taken on the line through (0, y, z).
      const base: number[] =
        Math.abs(plane[1]!) > Math.abs(plane[2]!)
          ? [0, point[1]! + (plane[0]! * point[0]!) / plane[1]!, point[2]!]
          : [0, point[1]!, point[2]! + (plane[0]! * point[0]!) / plane[2]!];
      for (let t: number = -1; t <= 1; t += 0.001) {
        const s: number[] = add(base, scale(direction, t));
        if (s[1]! < 0) continue;
        const d: number[] = sub(s, point);
        if (Math.hypot(...d) >= radius) continue;
        const angle: number = Math.atan2(dot(d, ortho), dot(d, view));
        if (angle >= 0) high = Math.min(high, angle);
        else low = Math.max(low, angle);
      }
    }
    sum += autoMovieSliceVisibility(n, length, low, high);
  }
  return sum / slices;
}

/** `a + b`. */
function add(a: number[], b: number[]): number[] {
  return a.map((v: number, i: number): number => v + b[i]!);
}

/** `a − b`. */
function sub(a: number[], b: number[]): number[] {
  return a.map((v: number, i: number): number => v - b[i]!);
}

/** `a × s`. */
function scale(a: number[], s: number): number[] {
  return a.map((v: number): number => v * s);
}

/** `a · b`. */
function dot(a: number[], b: number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

/** `a × b`. */
function cross(a: number[], b: number[]): number[] {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

/** The vector scaled to unit length. */
function unit(a: number[]): number[] {
  return scale(a, 1 / Math.hypot(...a));
}
