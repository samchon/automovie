import { type AutoMovieLoftContract, AutoMovieSolidBlend, AutoMovieSolidDiff, type AutoMovieSolidJoin, AutoMovieSolidMerge, type AutoMovieSolidRail, type AutoMovieSolidVector, type IAutoMovieSolidSurface } from "@automovie/engine";
import { HumanSeamObserver } from "../../../../../../packages/human/src/inspection/HumanSeamObserver";
import { HumanSolidShapes } from "../../../internal/HumanSolidShapes";

type Vec3 = AutoMovieSolidVector.Vec3;
const { cross, distance, dot, plane, sphere, sum } = HumanSolidShapes;

/**
 * The solid diff of a sphere sunk into a plane cuts the rim where the closed
 * forms put it, keeps the plane outside the sphere and the sphere's floor
 * inside the plane, and rounds the rim by a blend that meets both G2: flat at the plane, as concave as the bowl at the bowl, convex between.
 *
 * @evidence contracts/testing.md#behavioral-verification Subtracts a 10 mm sphere centred 6 mm under the plane z = 0 (the solid below it, so the recess is 4 mm deep) with `AutoMovieSolidDiff.create`, rim widths 2 mm on the sphere and 3 mm on the plane, and reads `IJoin.curve`, `IJoin.rail` and `IJoin.column` with `AutoMovieSolidBlend.jet`; reads both rails with `HumanSeamObserver.surface` from points alone, and reads the rim's normal curvature along its columns against its outward normal. It catches a rim at the wrong radius, a rail on the wrong side of either surface (the plane kept inside the sphere or the sphere kept above the plane), a rim that breaks G2 at either rail, and an edge left sharp or turned concave between the rails. Any diff passes whose curve, rails and blend meet these closed forms.
 * @evidence contracts/testing.md#independent-expectations Expectations are closed forms: the rim circle of radius `sqrt(R^2 - (R - d)^2)` = 8 mm at z = 0; the plane's rail the circle of radius 8 + 3 mm (a radial chord on the plane); the sphere's rail at polar angle `s* + 2 asin(w / 2R)` from the sphere's top, the chord w = 2 mm along the meridian below the plane; the rim's normal curvature `k_n = q_ww . n / |q_w|^2` against the solid's outward normal n is the plane's 0 at the plane's rail and the bowl's 1 / R at the bowl's (the recess floor is concave from outside), with a convex run between them, a rounded edge. Limits: points 1e-9 mm, a thousand times the 1e-12 mm solve tolerance; seam readings `HumanSeamObserver.exact(20, 0.002)`, a hundred times the observer's rounding at 20 mm and a 0.002 mm stencil, whose truncation on a rim of chord near 4 mm stays near 1e-9 per mm; the rim's end curvatures to 1e-6 per mm, the normal taken from a 1e-4 rad difference along the rim.
 * @evidence contracts/testing.md#distinguishing-cases Green: readings at phases 0, 1.3, 3 and 5. Red: the same configuration composed as a merge (`AutoMovieSolidMerge` keeps the part outside) must put the sphere's rail above the plane, the side a diff must not keep. Refused: a cutter that misses the base (centred 20 mm under it) must return no join with a diagnostic. The intersection's accuracy is `test_construction_operator_intersection`'s; the merge's widths `test_construction_operator_merge`'s.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_solid_diff`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 */
export function test_construction_operator_diff(): void {
  const failures: string[] = [];
  const R: number = 10;
  const depth: number = 4;
  const rim: number = Math.sqrt(R * R - (R - depth) ** 2);
  const base: IAutoMovieSolidSurface = plane("skin", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const axes: [Vec3, Vec3, Vec3] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const cutter = (below: number): IAutoMovieSolidSurface => sphere("bowl", [0, 0, -below], ...axes, R);
  const polar: number = Math.acos((R - depth) / R);
  const input = (c: IAutoMovieSolidSurface): AutoMovieSolidJoin.IInput => ({
    part: c,
    host: base,
    seed: { phi: 0, s: polar + 0.02, y: rim - 0.3, theta: 0.2 },
    count: 48,
    tolerance: 1e-12,
    grazing: 0.05,
    width: { part: (): number => 2, host: (): number => 3 },
  });
  const details = (result: AutoMovieSolidJoin.IResult): string =>
    result.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => d.detail).join("; ");
  const places: number[] = [0, 1.3, 3, 5];

  const diff: AutoMovieSolidJoin.IResult = AutoMovieSolidDiff.create(input(cutter(R - depth)));
  if (diff.join === null) failures.push(`diff: no join (${details(diff)})`);
  else {
    const join: AutoMovieSolidJoin.IJoin = diff.join;
    const bowl: IAutoMovieSolidSurface = cutter(R - depth);
    const column = (a: number): AutoMovieSolidJoin.IColumn => {
      const c: AutoMovieSolidJoin.IColumn | null = join.column(a);
      if (c === null) throw new Error(`diff: no column at ${a}`);
      return c;
    };
    const chord = (c: AutoMovieSolidJoin.IColumn): number => distance(c.rail.partPoint, c.rail.hostPoint);
    const lower: number = polar + 2 * Math.asin(2 / (2 * R));
    for (const phi of places) {
      const rail: AutoMovieSolidRail.IRail = column(phi).rail;
      if (!(distance(rail.curve.point, [rim * Math.cos(phi), rim * Math.sin(phi), 0]) <= 1e-9))
        failures.push(`rim at ${phi}: ${rail.curve.point.join(", ")}, expected radius ${rim} at z = 0`);
      if (!(distance(rail.hostPoint, [(rim + 3) * Math.cos(phi), (rim + 3) * Math.sin(phi), 0]) <= 1e-9))
        failures.push(`plane rail at ${phi}: ${rail.hostPoint.join(", ")}, expected radius ${rim + 3}`);
      const want: Vec3 = sum([1, [0, 0, -(R - depth)]], [R * Math.sin(lower) * Math.cos(phi), axes[0]], [R * Math.sin(lower) * Math.sin(phi), axes[1]], [R * Math.cos(lower), axes[2]]);
      if (!(distance(rail.partPoint, want) <= 1e-9)) failures.push(`bowl rail at ${phi}: ${rail.partPoint.join(", ")}, expected ${want.join(", ")}`);
    }

    // Both rails G2, read from points.
    const plate = (a: number, sigma: number): number[] => {
      const rail: AutoMovieSolidRail.IRail = column(a).rail;
      return base.jet(rail.host[0] + sigma * rail.across[0], rail.host[1] + sigma * rail.across[1]).p;
    };
    const fromPlate = (a: number, sigma: number): number[] => {
      const c: AutoMovieSolidJoin.IColumn = column(a);
      return AutoMovieSolidBlend.jet(c.start, c.end, sigma / chord(c)).point;
    };
    const floor = (a: number, sigma: number): number[] => {
      const rail: AutoMovieSolidRail.IRail = column(a).rail;
      return bowl.jet(rail.s + (rail.sigma * sigma) / R, a).p;
    };
    const fromFloor = (a: number, sigma: number): number[] => {
      const c: AutoMovieSolidJoin.IColumn = column(a);
      return AutoMovieSolidBlend.jet(c.start, c.end, 1 - sigma / chord(c)).point;
    };
    failures.push(
      ...HumanSeamObserver.audit(
        places.flatMap((a: number): HumanSeamObserver.IReading[] => [
          HumanSeamObserver.surface("plane rail", `phi ${a}`, plate, fromPlate, a, 0.002),
          HumanSeamObserver.surface("bowl rail", `phi ${a}`, floor, fromFloor, a, 0.002),
        ]),
        "G2",
        HumanSeamObserver.exact(20, 0.002),
      ),
    );

    // The rim's normal curvature across it, against the solid's outward
    // normal (oriented by the plane's +z at the plane's rail): G2 makes it
    // the plane's 0 at the plane's rail and the bowl's 1 / R at the bowl's
    // rail, where the recess floor is concave from outside, and a rounded
    // rim turns convex (below zero) between them.
    const h: number = 1e-4;
    for (const a of places) {
      const bends: number[] = [];
      for (let k: number = 0; k <= 10; k++) {
        const w: number = k / 10;
        const c: AutoMovieSolidJoin.IColumn = column(a);
        const j: AutoMovieSolidBlend.IJet = AutoMovieSolidBlend.jet(c.start, c.end, w);
        const before: AutoMovieSolidJoin.IColumn = column(a - h);
        const after: AutoMovieSolidJoin.IColumn = column(a + h);
        const along: Vec3 = sum([1, AutoMovieSolidBlend.jet(after.start, after.end, w).point], [-1, AutoMovieSolidBlend.jet(before.start, before.end, w).point]);
        const n0: Vec3 = cross(along, j.first);
        const sign: number = dot(cross(along, AutoMovieSolidBlend.jet(c.start, c.end, 0).first), [0, 0, 1]) > 0 ? 1 : -1;
        const n: Vec3 = sum([sign / Math.hypot(...n0), n0]);
        bends.push(dot(j.second, n) / dot(j.first, j.first));
      }
      if (!(Math.abs(bends[0]!) <= 1e-6)) failures.push(`rim at phi ${a}: normal curvature ${bends[0]} /mm at the plane's rail, expected the plane's 0`);
      if (!(Math.abs(bends[10]! - 1 / R) <= 1e-6)) failures.push(`rim at phi ${a}: normal curvature ${bends[10]} /mm at the bowl's rail, expected the bowl's ${1 / R}`);
      if (!(Math.min(...bends) < 0)) failures.push(`rim at phi ${a}: no convex run between the rails (least normal curvature ${Math.min(...bends)} /mm), the edge is not rounded`);
    }
  }

  // Red: the merge of the same pair keeps the sphere above the plane.
  const merged: AutoMovieSolidJoin.IResult = AutoMovieSolidMerge.create(input(cutter(R - depth)));
  const mergedRail: AutoMovieSolidRail.IRail | null = merged.join?.rail(0) ?? null;
  if (mergedRail === null || !(mergedRail.partPoint[2] > 0))
    failures.push(`the merge of the same pair does not keep the sphere above the plane (${mergedRail === null ? `no rail: ${details(merged)}` : `part rail at ${mergedRail.partPoint.join(", ")}`})`);

  // Refused: a cutter that misses the base.
  const missing: AutoMovieSolidJoin.IResult = AutoMovieSolidDiff.create(input(cutter(20)));
  if (missing.join !== null || missing.diagnostics.length === 0) failures.push("a cutter that misses the base is not refused");

  if (failures.length) throw new Error(`${failures.length} solid diff failures:\n${failures.join("\n")}`);
}
