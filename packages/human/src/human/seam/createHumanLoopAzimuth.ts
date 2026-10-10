import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The azimuth parameterization of a closed loop that circles a vertical axis
 * once: the angle of each vertex about the axis, and a lookup that finds the
 * two loop vertices bracketing any angle.
 *
 * The angle is measured in the horizontal plane from +Z towards +X about the
 * vertical line through `center`, in the frame's Y-up convention, and lies in
 * (-pi, pi]. A neck's cut is such a loop, and this is how a seam names "the
 * loop at the same side of the neck as this vertex" for two loops that share
 * no vertex. The loop must be star-shaped about the axis: walking it, the
 * angle advances in one direction and returns after exactly one turn. A loop
 * that doubles back, winds twice or does not surround the axis has no such
 * parameterization and refuses, because interpolating along it would join the
 * wrong sides.
 *
 * `bracket(angle)` returns loop indices `low` and `high` and the fraction
 * `along` from `low` to `high` at which the angle lies, so a value known at the
 * loop's vertices interpolates linearly in the angle. At a vertex's own angle
 * the answer is that vertex with fraction zero.
 */
export function createHumanLoopAzimuth(
  loop: readonly IAutoMovieVector3[],
  center: { x: number; z: number },
): {
  angle: number[];
  bracket: (angle: number) => { low: number; high: number; along: number };
} {
  const count = loop.length;
  if (count < 3) throw new Error("A loop around an axis needs three vertices.");
  const wrap = (value: number): number => {
    let wrapped = value;
    while (wrapped <= -Math.PI) wrapped += 2 * Math.PI;
    while (wrapped > Math.PI) wrapped -= 2 * Math.PI;
    return wrapped;
  };
  const angle = loop.map((point) =>
    wrap(Math.atan2(point.x - center.x, point.z - center.z)),
  );
  let total = 0;
  let increasing = 0;
  let decreasing = 0;
  for (let k = 0; k < count; k++) {
    const step = wrap(angle[(k + 1) % count] - angle[k]);
    total += step;
    if (step > 0) increasing++;
    if (step < 0) decreasing++;
  }
  if (
    Math.abs(Math.abs(total) - 2 * Math.PI) > 1e-6 ||
    (increasing > 0 && decreasing > 0)
  )
    throw new Error(
      "The loop does not wind once around its axis in one direction.",
    );
  // loop indices in increasing angle, from the smallest angle
  const walk =
    total > 0 ? loop.map((_, k) => k) : loop.map((_, k) => count - 1 - k);
  let first = 0;
  for (let k = 1; k < count; k++)
    if (angle[walk[k]] < angle[walk[first]]) first = k;
  const order = walk.map((_, k) => walk[(first + k) % count]);
  const sorted = order.map((index) => angle[index]);
  return {
    angle,
    bracket: (value) => {
      const at = wrap(value);
      // the last sorted angle not above `at`, or the largest when `at` lies
      // below all of them (the interval that wraps through pi)
      let lo = 0;
      let hi = count - 1;
      if (at < sorted[0]) lo = count - 1;
      else {
        while (lo < hi) {
          const middle = (lo + hi + 1) >> 1;
          if (sorted[middle] <= at) lo = middle;
          else hi = middle - 1;
        }
      }
      const next = (lo + 1) % count;
      const start = sorted[lo];
      let end = sorted[next];
      let target = at;
      if (end < start) end += 2 * Math.PI;
      if (target < start) target += 2 * Math.PI;
      const span = end - start;
      return {
        low: order[lo],
        high: order[next],
        along: Math.min(1, Math.max(0, (target - start) / span)),
      };
    },
  };
}
