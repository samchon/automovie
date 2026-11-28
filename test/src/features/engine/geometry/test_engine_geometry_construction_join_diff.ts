
import { AutoMovieEngineConstruction } from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionView,
  IAutoMovieSolidIntersection,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A diff join realizes the part cut from the host: the seam lies on both
 * spheres, and no vertex of the host's surface is left inside the cutter.
 *
 * Construction: a sphere of radius 0.015 m centred on the equator of a sphere
 * of radius 0.04 m at distance 0.04 m, cut from it under the angle parameter
 * about the host's outward normal; with R = 0.04, r = 0.015 and d = 0.04, the
 * seam is the circle in the plane x = (R^2 - r^2 + d^2) / 2d.
 *
 * Scenarios:
 *
 * 1. No diagnostic is recorded, and every traced seam point lies on both spheres
 *    within the larger of the two realized spheres' own approximation bounds
 *    (pole spline over the stations plus section spline over 16 points).
 * 2. Every skin vertex the host owns stands outside the cutter within that bound.
 * 3. With one host vertex moved to the cutter's centre the same check reports a
 *    vertex inside, so it is not vacuous.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the difference seam, host-vertex exclusion and a deliberate surface corruption control.
 * @evidence contracts/development/testing.md#behavioral-verification Realizes a spherical subtractive join, observes seam and surviving host positions, then puts one measured host vertex at the cutter centre to exercise the checker.
 * @evidence contracts/development/testing.md#independent-expectations Subtracting the two sphere equations gives their common plane. Surviving host vertices must lie at least one cutter radius from its centre within the spline bound.
 */
export function test_engine_geometry_construction_join_diff(): void {
  type V3 = [number, number, number];
  const R: number = 0.04;
  const r: number = 0.015;
  const d: number = 0.04;
  const plane: number = (R * R - r * r + d * d) / (2 * d);
  const ring: number = Math.sqrt(R * R - plane * plane);
  const ball: IAutoMovieConstructionView = ConstructionShapes.ellipsoid(
    "ball",
    ConstructionShapes.DOWN,
    R,
    R,
    R,
  );
  const cutter: IAutoMovieConstructionView = ConstructionShapes.ellipsoid(
    "dimple",
    {
      origin: { x: d, y: 0, z: 0 },
      u: { x: 1, y: 0, z: 0 },
      v: { x: 0, y: 1, z: 0 },
    },
    r,
    r,
    r,
  );
  const tree: IAutoMovieConstructionNode = ConstructionShapes.join(
    "diff",
    "dimple.cut",
    ball,
    cutter,
    {
      partFace: "dimple",
      hostFace: "ball",
      part: { station: -ring + 0.0005, phase: Math.PI },
      host: { station: -ring + 0.0005, phase: 0.01 },
    },
    {
      part: { type: "chord", value: 0.002 },
      host: { type: "chord", value: 0.002 },
    },
    {
      type: "angle",
      centre: { x: plane, y: 0, z: 0 },
      normal: { x: 1, y: 0, z: 0 },
      reference: { x: 0, y: 0, z: 1 },
    },
  );
  const real: IAutoMovieConstructionRealization.IRealization =
    AutoMovieEngineConstruction.realize({ name: "made", root: tree }, { chord: 1e-4 });
  TestValidator.equals("diagnostics", real.diagnostics.length, 0);
  const joined: IAutoMovieConstructionRealization.IJoin | undefined =
    real.joins.find(
      (j: IAutoMovieConstructionRealization.IJoin): boolean =>
        j.blend.chain.name === "dimple.cut",
    );
  if (joined === undefined)
    throw new Error("the realization has no join dimple.cut");
  const centre: IAutoMovieVector3 = { x: d, y: 0, z: 0 };
  const points: V3[] = joined.join.curve.points.map(
    (q: IAutoMovieSolidIntersection.IPoint): V3 => [
      q.point[0] / 1000,
      q.point[1] / 1000,
      q.point[2] / 1000,
    ],
  );
  const shape = (view: IAutoMovieConstructionView, radius: number): number =>
    ConstructionChecks.poleSpline(radius, radius, view.stations) +
    ConstructionChecks.polarSpline(radius, radius, view.order);
  const bound: number = Math.max(shape(ball, R), shape(cutter, r));
  TestValidator.equals(
    "seam on both",
    ConstructionChecks.onBoth(
      points,
      (p: V3): number => Math.hypot(...p) - R,
      (p: V3): number => Math.hypot(p[0] - d, p[1], p[2]) - r,
      bound,
    ),
    [],
  );
  TestValidator.equals(
    "outside the cutter",
    ConstructionChecks.outside(real.mesh, new Set(["ball"]), centre, r, bound),
    [],
  );

  const host: number = real.mesh.owners.indexOf("ball");
  const count: number = real.mesh.positions.length / 3;
  let v: number = -1;
  for (let i: number = 0; i < count && v < 0; i++)
    if (real.mesh.coordinates[3 * i] === host) v = i;
  TestValidator.predicate("a host vertex exists", v >= 0);
  const moved: number[] = [...real.mesh.positions];
  moved[3 * v] = d;
  moved[3 * v + 1] = 0;
  moved[3 * v + 2] = 0;
  TestValidator.predicate(
    "vertex at the cutter centre",
    ConstructionChecks.outside(
      { ...real.mesh, positions: moved },
      new Set(["ball"]),
      centre,
      r,
      1e-9 * R,
    ).length !== 0,
  );
}
