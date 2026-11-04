import { realizeAutoMovieConstruction, type AutoMovieConstructionRealization, type AutoMovieSolidIntersection } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieVector3 } from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A diff realizes the part cut from the host: the seam lies on both
 * spheres, and no vertex of the host's surface is left inside the cutter.
 *
 * Scenarios:
 * 1. A sphere of radius 0.015 m centred on the equator of a sphere of radius 0.04 m, cut from it under the angle parameter about the host's outward normal: the seam's traced points lie on both spheres within 1e-9 of the host's size (the circle in the plane `x = (R^2 - r^2 + d^2) / 2d`), no diagnostic is recorded, and every skin vertex the host owns stands outside the cutter.
 * 2. Red: the skin with one host vertex moved to the cutter's centre reads a vertex inside.
 *
 * @evidence contracts/testing.md#behavioral-verification Realizes the diff with `realizeAutoMovieConstruction` and reads the join's traced curve and the skin's host vertices. It catches a seam off either sphere, a cut that keeps the host's wall inside the cutter (a merge's side, or no trim), and a recess left closed; any construction that cuts the cutter's volume from the host passes.
 * @evidence contracts/testing.md#independent-expectations The two spheres' closed forms: a point's distance from each centre less its radius, zero on the seam; a host vertex's distance from the cutter's centre at least the cutter's radius. Limits: 1e-9 of the host's radius, the trace's tolerance and the solve's rounding far below it. Oracle limit: the host's vertices inside the blend's rail stand outside the cutter by the rail's chord, which the check allows but does not size.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the cut. Negative: the moved vertex. A diff whose part is a group belongs to `test_construction_diagnostics`; the blend's continuity to `test_construction_merge`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_diff`; it realizes made trees in process and starts no host, browser or GPU.
 */
export function test_construction_diff(): void {
  const failures: string[] = [];
  const [R, r, d]: [number, number, number] = [0.04, 0.015, 0.04];
  const plane: number = (R * R - r * r + d * d) / (2 * d);
  const ring: number = Math.sqrt(R * R - plane * plane);
  const host: AutoMovieConstructionNode = ConstructionShapes.ellipsoid("ball", ConstructionShapes.DOWN, R, R, R);
  const cutter: AutoMovieConstructionNode = ConstructionShapes.ellipsoid("dimple", { origin: { x: d, y: 0, z: 0 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 1, z: 0 } }, r, r, r);

  // The seam's top point (plane, 0, ring): on the cutter at station -ring (stations run along -z) and phase pi, on the host at station -ring and phase 0.
  const tree: AutoMovieConstructionNode = ConstructionShapes.join(
    "diff",
    "dimple.cut",
    host,
    cutter,
    { partFace: "dimple", hostFace: "ball", part: [-ring + 0.0005, Math.PI], host: [-ring + 0.0005, 0.01] },
    { part: { type: "chord", value: 0.002 }, host: { type: "chord", value: 0.002 } },
    { type: "angle", centre: { x: plane, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, reference: { x: 0, y: 0, z: 1 } },
  );
  const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "made", root: tree }, { chord: 1e-4 });
  if (real.diagnostics.length !== 0) failures.push(`diagnostics: ${ConstructionRead.diagnostics(real)}`);

  const joined: AutoMovieConstructionRealization.IJoin | undefined = real.joins.find((j: AutoMovieConstructionRealization.IJoin): boolean => j.blend.chain.name === "dimple.cut");
  if (joined === undefined) failures.push("no join");
  else {
    const centre: IAutoMovieVector3 = { x: d, y: 0, z: 0 };
    // The traced curve is in the kernel's millimetres; the spheres' closed forms in metres.
    const points: V3[] = joined.join.curve.points.map((q: AutoMovieSolidIntersection.IPoint): V3 => [q.point[0] / 1000, q.point[1] / 1000, q.point[2] / 1000]);
    failures.push(...ConstructionChecks.onBoth(points, (p: V3): number => Math.hypot(...p) - R, (p: V3): number => Math.hypot(p[0] - d, p[1], p[2]) - r, 1e-9 * R));
    failures.push(...ConstructionChecks.outside(real.mesh, new Set(["ball"]), centre, r, 1e-9 * R));

    // Red: a host vertex moved to the cutter's centre.
    const host: number = real.mesh.owners.indexOf("ball");
    const v: number = Array.from({ length: real.mesh.positions.length / 3 }, (_: unknown, i: number): number => i).find((i: number): boolean => real.mesh.coordinates[3 * i] === host) ?? -1;
    if (v < 0) failures.push("no host vertex in the skin");
    else {
      const moved: number[] = [...real.mesh.positions];
      [moved[3 * v], moved[3 * v + 1], moved[3 * v + 2]] = [d, 0, 0];
      if (ConstructionChecks.outside({ ...real.mesh, positions: moved }, new Set(["ball"]), centre, r, 1e-9 * R).length === 0) failures.push("proof: a host vertex at the cutter's centre reads outside");
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} diff failures:\n${failures.join("\n")}`);
}
