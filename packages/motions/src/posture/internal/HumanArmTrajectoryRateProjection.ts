import { AutoMovieEngineRomTolerance } from "@automovie/engine";

import type { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/*
 * A knotted iterate's rates projected onto the ranges its positions keep: a
 * knot whose bounded coordinate lies on its bound (within the joint's
 * resolution, `AutoMovieEngineRomTolerance`) is still on it, its velocity zero (any motion
 * would leave the range on one side of the knot) and its acceleration's outward
 * part dropped, so the quintics on both sides (`HumanArmTrajectoryKnots`) meet
 * the bound tangentially. Both intervals' Bernstein control points are inside
 * the native boxes and the swing disc (each segment is a convex combination of
 * its controls). Scaling one knot's shared rates keeps the joins C².
 * Parameter c: The knots' context.
 * Parameter x: Each arm's coordinates at each knot, in their ranges.
 * Parameter rates: Their velocities and accelerations.
 * Returns: The rates projected, fresh arrays.
 */
export function HumanArmTrajectoryRateProjection(
  c: RangeContext,
  x: readonly (readonly (readonly number[])[])[],
  rates: Knots.IRates,
): Knots.IRates {
  const velocities: number[][][] = rates.velocities.map(
    (arm: number[][]): number[][] => arm.map((v: number[]): number[] => [...v]),
  );
  const accelerations: number[][][] = rates.accelerations.map(
    (arm: number[][]): number[][] => arm.map((v: number[]): number[] => [...v]),
  );
  for (let k: number = 1; k < c.n; ++k) {
    if (!M.inner(c, k)) continue;
    const spans: readonly number[] =
      k + 1 < c.n
        ? [c.times[k - 1]! - c.times[k]!, c.times[k + 1]! - c.times[k]!]
        : [c.times[k - 1]! - c.times[k]!];
    c.free.forEach((free: readonly number[], a: number): void => {
      const p: readonly number[] = x[a]![k]!;
      const v: number[] = velocities[a]![k]!;
      const acc: number[] = accelerations[a]![k]!;
      free.forEach((d: number): void => {
        const b: [number, number] | null | undefined = c.bounds[a]![d];
        if (b === null || b === undefined) return;
        const q: number = p[d]!;
        // The inward sense: up from the lower bound, down from the upper.
        const inward: number =
          q <= b[0] + AutoMovieEngineRomTolerance ? 1 : q >= b[1] - AutoMovieEngineRomTolerance ? -1 : 0;
        // Either sense of motion leaves the range on one side of the knot:
        // the knot is still there, turning back inward at most.
        if (inward !== 0) v[d] = 0;
        if (inward * acc[d]! < 0) acc[d] = 0;
        let scale: number = 1;
        for (const span of spans)
          for (const delta of controls(span, v[d]!, acc[d]!))
            if (delta !== 0)
              scale = Math.min(
                scale,
                Math.max(0, ((delta < 0 ? b[0] : b[1]) - q) / delta),
              );
        v[d] = v[d]! * scale;
        acc[d] = acc[d]! * scale;
      });
      if (c.bounds[a]![0] !== null || c.bounds[a]![1] !== null) return;
      const radius: number = M.swing(c, a);
      let scale: number = 1;
      for (const span of spans) {
        const dx: [number, number] = controls(span, v[0]!, acc[0]!);
        const dy: [number, number] = controls(span, v[1]!, acc[1]!);
        for (const i of [0, 1])
          scale = Math.min(scale, disc(p[0]!, p[1]!, dx[i]!, dy[i]!, radius));
      }
      v[0] = v[0]! * scale;
      v[1] = v[1]! * scale;
      acc[0] = acc[0]! * scale;
      acc[1] = acc[1]! * scale;
    });
  }
  return { velocities, accelerations };
}

/*
 * Physical ranges and the clock shared by the adjacent quintics.
 */
type RangeContext = Pick<
  M.IContext,
  "times" | "n" | "open" | "free" | "bounds" | "rest" | "back"
>;

/*
 * Two endpoint-relative Bernstein controls of a quintic of signed span `h`.
 */
function controls(h: number, v: number, a: number): [number, number] {
  const first: number = (h * v) / 5;
  return [first, 2 * first + (h * h * a) / 20];
}

/*
 * The largest unit step along a control's displacement that stays in the disc.
 */
function disc(
  x: number,
  y: number,
  dx: number,
  dy: number,
  radius: number,
): number {
  if (Math.hypot(x + dx, y + dy) <= radius) return 1;
  const square: number = dx * dx + dy * dy;
  if (square === 0) return 0;
  const dot: number = x * dx + y * dy;
  const room: number = Math.max(0, radius * radius - x * x - y * y);
  const root: number = Math.sqrt(dot * dot + square * room);
  // The conjugate form avoids cancelling the two positive terms near a bound.
  return dot > 0 ? room / (dot + root) : (root - dot) / square;
}
