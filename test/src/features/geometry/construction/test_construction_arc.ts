import { type AutoMovieConstructionRealization, type AutoMovieSolidIntersection, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A join traced by the curve's own arclength realizes through the construction: its traced points lie on both surfaces at uniform arclength, and its rails stand at their chords.
 *
 * Scenarios:
 * 1. A post of radius 0.015 m merged square onto a beam of radius 0.03 m under the arc parameter: the realization records no diagnostic; every traced point lies on both cylinders within the realized sections' spline bound; consecutive traced points stand at equal chords along the loop, each within 1 percent of their mean; and both rails stand 6 mm from the curve.
 * 2. Red: the same points read on a beam 1 mm wider miss it.
 *
 * @evidence contracts/testing.md#behavioral-verification Realizes the merge with `realizeAutoMovieConstruction` under `{ type: "arc" }` and reads the join's traced curve and rails. It catches an arc trace that leaves either surface, a parameter that is not the curve's own arclength, and a rail off its chord; any join that traces by arclength and places its rails at their chords passes.
 * @evidence contracts/testing.md#independent-expectations The arc parameter's document (`IAutoMovieConstructionArcParameter`): the curve's arclength over its length times a turn, so the traced points at uniform parameters stand at equal arc steps; on the Steinmetz curve of these cylinders, whose curvature varies by a factor under 3, the chords of equal arcs of 1/48 of the loop differ from each other by well under 1 percent. Surfaces are the closed-form cylinders read within the 16-point section spline's bound (`ConstructionChecks.polarSpline`); chords as `test_construction_merge` reads them.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the arc-traced merge. Negative: the wider beam. The phase and angle parameters belong to `test_construction_merge` and `test_construction_operator_merge_angle`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_arc`; it realizes made trees in process and starts no host, browser or GPU.
 */
export function test_construction_arc(): void {
  const failures: string[] = [];
  const R: number = 0.03;
  const r: number = 0.015;
  const w: number = 0.006;
  const host: AutoMovieConstructionNode = ConstructionShapes.cylinder("beam", { origin: { x: -0.1, y: 0, z: 0 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } }, R, 0.2);
  const part: AutoMovieConstructionNode = ConstructionShapes.cylinder("post", { origin: { x: 0, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, v: { x: 1, y: 0, z: 0 } }, r, 0.08);
  const tree: AutoMovieConstructionNode = ConstructionShapes.join(
    "merge",
    "blend.post",
    host,
    part,
    { partFace: "post", hostFace: "beam", part: [R + 0.001, Math.PI / 2], host: [0.1 + r, 0.01] },
    { part: { type: "chord", value: w }, host: { type: "chord", value: w } },
    { type: "arc" },
  );
  const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "made", root: tree }, { chord: 1e-4 });
  if (real.diagnostics.length !== 0) failures.push(`diagnostics: ${ConstructionRead.diagnostics(real)}`);
  const joined: AutoMovieConstructionRealization.IJoin | undefined = real.joins.find((j: AutoMovieConstructionRealization.IJoin): boolean => j.name === "blend.post");
  if (joined === undefined) throw new Error(`arc failures:\nno join (${ConstructionRead.diagnostics(real)})`);

  const points: V3[] = joined.join.curve.points.map((q: AutoMovieSolidIntersection.IPoint): V3 => [q.point[0] / 1000, q.point[1] / 1000, q.point[2] / 1000]);
  const bound: number = ConstructionChecks.polarSpline(R, R, 16);
  const onPost: (p: V3) => number = (p: V3): number => Math.hypot(p[0], p[1]) - r;
  const onBeam: (wider: number) => (p: V3) => number = (wider: number): ((p: V3) => number) => (p: V3): number => Math.hypot(p[1], p[2]) - (R + wider);
  failures.push(...ConstructionChecks.onBoth(points, onPost, onBeam(0), bound));
  if (ConstructionChecks.onBoth(points, onPost, onBeam(0.001), bound).length === 0) failures.push("proof: the seam reads on a beam 1 mm wider");

  // Equal arcs: the chords between consecutive traced points agree.
  const chords: number[] = points.map((p: V3, k: number): number => {
    const q: V3 = points[(k + 1) % points.length]!;
    return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  });
  const mean: number = chords.reduce((a: number, b: number): number => a + b, 0) / chords.length;
  chords.forEach((c: number, k: number): void => {
    if (!(Math.abs(c - mean) <= 0.01 * mean)) failures.push(`step ${k}: chord ${c} m against the mean ${mean} m`);
  });
  failures.push(...ConstructionChecks.chords(joined.join, (): number => 1000 * w, (): number => 1000 * w, 1e-6 * R));
  if (failures.length !== 0) throw new Error(`${failures.length} arc failures:\n${failures.join("\n")}`);
}
