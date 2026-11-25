import {
  frameAutoMovieSweepSpine,
  transportAutoMovieSweepSpine,
} from "@automovie/engine";
import type {
  IAutoMovieSweepTransport,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `transportAutoMovieSweepSpine(count, frames)` compiles a spine into the
 * centripetal Catmull-Rom curve through its points (Yuksel, Schaefer and Keyser
 * 2011), parameterized by chord-length share, and transports its first axis by
 * double reflection (Wang, Juttler, Zheng and Liu 2008);
 * `frameAutoMovieSweepSpine` does the same for an authored spine.
 *
 * Frames are written [origin, first axis, second axis, tangent], the second
 * axis tangent x first.
 *
 * Scenarios:
 *
 * 1. The straight spine (0,0,0), (0,1,0), (0,2,0) with normal (1, 1, 0): length 2,
 *    point at 0.5 (0, 1, 0), tangent (0, 1, 0), first axis (1, 0, 0), second (0,
 *    0, -1).
 * 2. The bend (0,0,0), (1,1,0), (2,0,0) meets its middle point at u = 0.5 with
 *    tangent (1, 0, 0) there.
 * 3. A planar arc in z = 0 with normal +z keeps its first axis (0, 0, 1) within
 *    1e-9 at 50 points, the frame orthonormal.
 * 4. Coinciding points, a reversal, a normal along the first tangent, one point
 *    and a frame read without frames are refused.
 * 5. The authored spine reads the same frames as the transport.
 */
export function test_unit_engine_geometry_sweep_spine_transport(): void {
  const build = (points: number[][], normal: number[], frames: boolean = true): IAutoMovieSweepTransport => {
    const t: IAutoMovieSweepTransport = transportAutoMovieSweepSpine(points.length, frames);
    t.points.set(points.flat());
    t.normal.set(normal);
    t.update();
    return t;
  };
  const read = (t: IAutoMovieSweepTransport, u: number): number[] => {
    const out: Float64Array = new Float64Array(12);
    t.frame(u, out, 0);
    return [...out];
  };
  const near = (a: readonly number[], b: readonly number[], e: number = 1e-12): boolean =>
    a.length === b.length && a.every((x: number, i: number): boolean => Math.abs(x - b[i]!) <= e);

  // 1.
  const line: IAutoMovieSweepTransport = build(
    [
      [0, 0, 0],
      [0, 1, 0],
      [0, 2, 0],
    ],
    [1, 1, 0],
  );
  TestValidator.equals("length", line.length(), 2);
  TestValidator.predicate("frame", near(read(line, 0.5), [0, 1, 0, 1, 0, 0, 0, 0, -1, 0, 1, 0]));

  // 2.
  const bend: IAutoMovieSweepTransport = build(
    [
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
    ],
    [0, 0, 1],
  );
  const middle: number[] = read(bend, 0.5);
  TestValidator.predicate("knot", near(middle.slice(0, 3), [1, 1, 0]) && near(middle.slice(9, 12), [1, 0, 0]));

  // 3.
  const arc: number[][] = Array.from({ length: 7 }, (_: unknown, k: number): number[] => [Math.cos((k * Math.PI) / 8), Math.sin((k * Math.PI) / 8), 0]);
  const planar: IAutoMovieSweepTransport = build(arc, [0, 0, 1]);
  TestValidator.predicate(
    "planar",
    Array.from({ length: 50 }, (_: unknown, k: number): number => k / 49).every((u: number): boolean => {
      const f: number[] = read(planar, u);
      const x: number[] = f.slice(3, 6);
      const y: number[] = f.slice(6, 9);
      const n: number[] = f.slice(9, 12);
      const dot = (a: number[], b: number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
      return near(x, [0, 0, 1], 1e-9) && Math.abs(dot(x, n)) <= 1e-9 && Math.abs(dot(y, n)) <= 1e-9 && Math.abs(dot(y, y) - 1) <= 1e-9;
    }),
  );

  // 4.
  for (const [label, run, message] of [
    ["coincide", () => build([[0, 0, 0], [0, 0, 0], [0, 1, 0]], [1, 0, 0]), "sweep spine points 0 and 1 coincide"],
    ["reversal", () => build([[0, 0, 0], [0, 1, 0], [0, 0.5, 0]], [1, 0, 0]), "sweep spine doubles back at point 1"],
    ["parallel", () => build([[0, 0, 0], [0, 1, 0]], [0, 3, 0]), "normal must not be parallel to its first tangent"],
    ["one point", () => transportAutoMovieSweepSpine(1, true), "sweep spine needs at least two points"],
    ["no frames", () => read(build([[0, 0, 0], [0, 1, 0]], [1, 0, 0], false), 0.5), "carries no frames"],
  ] satisfies [string, () => unknown, string][])
    TestValidator.predicate(label, throwsError(run, message));

  // 5.
  const spine = { points: arc.map((p: number[]): IAutoMovieVector3 => ({ x: p[0]!, y: p[1]!, z: p[2]! })), normal: { x: 0, y: 0, z: 1 } };
  const path = frameAutoMovieSweepSpine(spine);
  TestValidator.equals("authored length", path.length, planar.length());
  TestValidator.predicate(
    "authored frame",
    [0.2, 0.7].every((u: number): boolean => {
      const p: IAutoMovieVector3 = path.point(u);
      return near([p.x, p.y, p.z], read(planar, u).slice(0, 3));
    }),
  );
}
