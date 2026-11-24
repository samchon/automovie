import { realizeAutoMovieConstruction } from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieSolidIntersection,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../../internal/construction/ConstructionChecks";
import { ConstructionShapes } from "../../../internal/construction/ConstructionShapes";

/**
 * A merge join traced by the curve's own arclength puts its traced points on
 * both surfaces at uniform arclength, with its rails standing at their chords.
 *
 * Construction: a post of radius 0.015 m merged square onto a beam of radius
 * 0.03 m under the arc parameter, rail width 6 mm, chord 1e-4.
 *
 * Scenarios:
 *
 * 1. The realization records no diagnostic and has the join `blend.post`.
 * 2. Every traced point lies on both cylinders within the realized sections'
 *    spline bound; the same points read on a beam 1 mm wider do not.
 * 3. Consecutive traced points stand at equal chords round the loop, each within 1
 *    percent of their mean.
 * 4. Both rails stand 6 mm from the curve (within 1e-6 of the beam's radius).
 */
export function test_unit_engine_geometry_construction_join_arc(): void {
  const R: number = 0.03;
  const r: number = 0.015;
  const w: number = 0.006;
  const host: IAutoMovieConstructionNode = ConstructionShapes.cylinder(
    "beam",
    {
      origin: { x: -0.1, y: 0, z: 0 },
      u: { x: 0, y: 0, z: 1 },
      v: { x: 0, y: 1, z: 0 },
    },
    R,
    0.2,
  );
  const part: IAutoMovieConstructionNode = ConstructionShapes.cylinder(
    "post",
    {
      origin: { x: 0, y: 0, z: 0 },
      u: { x: 0, y: 1, z: 0 },
      v: { x: 1, y: 0, z: 0 },
    },
    r,
    0.08,
  );
  const tree: IAutoMovieConstructionNode = ConstructionShapes.join(
    "merge",
    "blend.post",
    host,
    part,
    {
      partFace: "post",
      hostFace: "beam",
      part: [R + 0.001, Math.PI / 2],
      host: [0.1 + r, 0.01],
    },
    { part: { type: "chord", value: w }, host: { type: "chord", value: w } },
    { type: "arc" },
  );
  const real: IAutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction({ name: "made", root: tree }, { chord: 1e-4 });
  TestValidator.equals("diagnostics", real.diagnostics.length, 0);
  const joined: IAutoMovieConstructionRealization.IJoin | undefined =
    real.joins.find(
      (j: IAutoMovieConstructionRealization.IJoin): boolean =>
        j.name === "blend.post",
    );
  if (joined === undefined)
    throw new Error("the realization has no join blend.post");

  const points: [number, number, number][] = joined.join.curve.points.map(
    (q: IAutoMovieSolidIntersection.IPoint): [number, number, number] => [
      q.point[0] / 1000,
      q.point[1] / 1000,
      q.point[2] / 1000,
    ],
  );
  const bound: number = ConstructionChecks.polarSpline(R, R, 16);
  const onPost = (p: [number, number, number]): number =>
    Math.hypot(p[0], p[1]) - r;
  const onBeam =
    (wider: number) =>
    (p: [number, number, number]): number =>
      Math.hypot(p[1], p[2]) - (R + wider);
  TestValidator.equals(
    "on both",
    ConstructionChecks.onBoth(points, onPost, onBeam(0), bound),
    [],
  );
  TestValidator.predicate(
    "wider beam is missed",
    ConstructionChecks.onBoth(points, onPost, onBeam(0.001), bound).length !==
      0,
  );

  const chords: number[] = points.map(
    (p: [number, number, number], k: number): number => {
      const q: [number, number, number] = points[(k + 1) % points.length]!;
      return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
    },
  );
  const mean: number =
    chords.reduce((a: number, b: number): number => a + b, 0) / chords.length;
  chords.forEach((c: number, k: number): void => {
    TestValidator.predicate(`chord ${k}`, Math.abs(c - mean) <= 0.01 * mean);
  });
  TestValidator.equals(
    "rail chords",
    ConstructionChecks.chords(
      joined.join,
      (): number => 1000 * w,
      (): number => 1000 * w,
      1e-6 * R,
    ),
    [],
  );
}
