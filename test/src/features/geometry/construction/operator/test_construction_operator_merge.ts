import { type AutoMovieLoftContract, AutoMovieSolidBlend, type AutoMovieSolidJoin, AutoMovieSolidMerge, type AutoMovieSolidRail, type AutoMovieSolidVector, type IAutoMovieSolidSurface } from "@automovie/engine";
import { HumanSeamObserver } from "../../../../../../packages/human/src/inspection/HumanSeamObserver";
import { HumanSolidShapes } from "../../../internal/HumanSolidShapes";

type Vec3 = AutoMovieSolidVector.Vec3;
const { cylinder, distance, plane, sum } = HumanSolidShapes;

/**
 * The solid merge of a cylinder standing on a plane places both rails the
 * declared chords from the intersection on the kept sides, spans them by a
 * blend that meets both surfaces G2, and draws a surface of revolution when
 * the widths are constant.
 *
 * @evidence contracts/testing.md#behavioral-verification Merges a 20 mm cylinder along z onto the plane z = 0 (the solid below it) with `AutoMovieSolidMerge.create`, constant widths of 8 mm and a host width law `6 + 2 cos 2 phi`, and reads `IJoin.rail` and `IJoin.column` with `AutoMovieSolidBlend.jet`; reads both rails with `HumanSeamObserver.surface` from points alone, the plane continued past its rail and the cylinder past its own. It catches a rail on the wrong side or at the wrong chord, a blend that breaks position, tangent plane or normal curvature at either rail, a blend that is not rotationally symmetric for a symmetric input, and a width law that is not obeyed at every phase. Any merge passes whose rails and blend satisfy those closed forms.
 * @evidence contracts/testing.md#independent-expectations Expectations are closed forms of the configuration: the intersection is the circle of radius 20 at z = 0; the part's rail is the cylinder's circle at z = w_A (a chord along a straight generator); the host's rail is the circle of radius 20 + w_B(phi) (a chord along a straight radial line); a constant-width blend's columns are one column turned about z, so the radius and height at a share agree across phases. A second cross derivative moved by e along the cylinder's normal at its rail reads a normal curvature jump `e / |q_w|^2`, `q_w` the ribbon's cross derivative, square to the rail there. Limits: points 1e-9 mm, a thousand times the 1e-12 mm solve tolerance; seam readings `HumanSeamObserver.exact(40, 0.005)`, a hundred times the observer's rounding at 40 mm and a 0.005 mm stencil, whose truncation on a blend of chord near 11 mm stays near 1e-9 per mm.
 * @evidence contracts/testing.md#distinguishing-cases Green: constant and varying host widths, readings at phases 0, 1, 2.5 and 4. Red: the made curvature defect at the part's rail must read its closed form. Refused: a host width of zero leaves no rail and must return no join with a diagnostic, and a fixed part station inside the host must return no join; a fixed station on the kept side must give that section as the rail. The intersection's own accuracy is `test_construction_operator_intersection`'s; the diff's kept sides are `test_construction_operator_diff`'s.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_solid_merge`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 */
export function test_construction_operator_merge(): void {
  const failures: string[] = [];
  const r: number = 20;
  const part: IAutoMovieSolidSurface = cylinder("column", [0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0], r);
  const host: IAutoMovieSolidSurface = plane("floor", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const input = (hostWidth: (phi: number) => number): AutoMovieSolidJoin.IInput => ({
    part,
    host,
    seed: { phi: 0, s: 0.5, y: r - 0.4, theta: 0.3 },
    count: 48,
    tolerance: 1e-12,
    grazing: 0.05,
    width: { part: (): number => 8, host: hostWidth },
  });
  const details = (result: AutoMovieSolidJoin.IResult): string =>
    result.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => d.detail).join("; ");
  const places: number[] = [0, 1, 2.5, 4];
  const tolerance: HumanSeamObserver.ITolerance = HumanSeamObserver.exact(40, 0.005);

  // 1. Constant widths: rails at their chords, a surface of revolution.
  const constant: AutoMovieSolidJoin.IResult = AutoMovieSolidMerge.create(input((): number => 8));
  if (constant.join === null) failures.push(`constant widths: no join (${details(constant)})`);
  else {
    const join: AutoMovieSolidJoin.IJoin = constant.join;
    const zero: AutoMovieSolidJoin.IColumn | null = join.column(0);
    for (const phi of places) {
      const c: AutoMovieSolidJoin.IColumn | null = join.column(phi);
      if (c === null || zero === null) {
        failures.push(`constant widths: no column at ${phi}`);
        continue;
      }
      if (!(distance(c.rail.partPoint, [r * Math.cos(phi), r * Math.sin(phi), 8]) <= 1e-9))
        failures.push(`part rail at ${phi}: ${c.rail.partPoint.join(", ")}, expected the circle at z = 8`);
      if (!(distance(c.rail.hostPoint, [28 * Math.cos(phi), 28 * Math.sin(phi), 0]) <= 1e-9))
        failures.push(`host rail at ${phi}: ${c.rail.hostPoint.join(", ")}, expected the circle of radius 28`);
      for (const w of [0.2, 0.5, 0.8]) {
        const p: Vec3 = AutoMovieSolidBlend.jet(c.start, c.end, w).point;
        const q: Vec3 = AutoMovieSolidBlend.jet(zero.start, zero.end, w).point;
        if (!(Math.abs(Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1])) <= 1e-9 && Math.abs(p[2] - q[2]) <= 1e-9))
          failures.push(`revolution at ${phi}, share ${w}: radius ${Math.hypot(p[0], p[1])} height ${p[2]} against ${Math.hypot(q[0], q[1])} ${q[2]}`);
      }
    }
  }

  // 2. A varying host width: chords obeyed, both rails G2.
  const law = (phi: number): number => 6 + 2 * Math.cos(2 * phi);
  const varying: AutoMovieSolidJoin.IResult = AutoMovieSolidMerge.create(input(law));
  if (varying.join === null) failures.push(`varying width: no join (${details(varying)})`);
  else {
    const join: AutoMovieSolidJoin.IJoin = varying.join;
    const column = (a: number): AutoMovieSolidJoin.IColumn => {
      const c: AutoMovieSolidJoin.IColumn | null = join.column(a);
      if (c === null) throw new Error(`varying width: no column at ${a}`);
      return c;
    };
    const chord = (c: AutoMovieSolidJoin.IColumn): number => distance(c.rail.partPoint, c.rail.hostPoint);
    for (const phi of places) {
      const c: AutoMovieSolidJoin.IColumn = column(phi);
      const rail: AutoMovieSolidRail.IRail = c.rail;
      if (!(Math.abs(distance(rail.hostPoint, rail.curve.point) - law(phi)) <= 1e-9))
        failures.push(`host chord at ${phi}: ${distance(rail.hostPoint, rail.curve.point)}, expected ${law(phi)}`);
      if (!(Math.abs(distance(rail.partPoint, rail.curve.point) - 8) <= 1e-9))
        failures.push(`part chord at ${phi}: ${distance(rail.partPoint, rail.curve.point)}, expected 8`);
    }

    // The plane continued past its rail against the blend from w = 0; the
    // cylinder continued past its rail against the blend from w = 1.
    const plate = (a: number, sigma: number): number[] => {
      const rail: AutoMovieSolidRail.IRail = column(a).rail;
      return host.jet(rail.host[0] + sigma * rail.across[0], rail.host[1] + sigma * rail.across[1]).p;
    };
    const fromPlate = (a: number, sigma: number): number[] => {
      const c: AutoMovieSolidJoin.IColumn = column(a);
      return AutoMovieSolidBlend.jet(c.start, c.end, sigma / chord(c)).point;
    };
    const tube = (a: number, sigma: number): number[] => {
      const rail: AutoMovieSolidRail.IRail = column(a).rail;
      return part.jet(rail.s + rail.sigma * sigma, a).p;
    };
    const fromTube =
      (bend: number): ((a: number, sigma: number) => number[]) =>
      (a: number, sigma: number): number[] => {
        const c: AutoMovieSolidJoin.IColumn = column(a);
        const radial: Vec3 = [Math.cos(a), Math.sin(a), 0];
        return AutoMovieSolidBlend.jet(c.start, { ...c.end, second: sum([1, c.end.second], [bend, radial]) }, 1 - sigma / chord(c)).point;
      };
    failures.push(
      ...HumanSeamObserver.audit(
        places.flatMap((a: number): HumanSeamObserver.IReading[] => [
          HumanSeamObserver.surface("host rail", `phi ${a}`, plate, fromPlate, a, 0.005),
          HumanSeamObserver.surface("part rail", `phi ${a}`, tube, fromTube(0), a, 0.005),
        ]),
        "G2",
        tolerance,
      ),
    );

    // Red: the part's ribbon bent by e along the cylinder's normal.
    const e: number = 0.01;
    for (const a of places) {
      const c: AutoMovieSolidJoin.IColumn = column(a);
      const got: HumanSeamObserver.IReading = HumanSeamObserver.surface("bent part rail", `phi ${a}`, tube, fromTube(e), a, 0.005);
      const first: Vec3 = c.end.first;
      const want: number = e / (first[0] ** 2 + first[1] ** 2 + first[2] ** 2);
      if (!(Math.abs(got.curvature - want) <= tolerance.curvature + 1e-6 * want))
        failures.push(`bent part rail at ${a}: curvature jump ${got.curvature}, expected ${want}`);
    }
  }

  // 3. The part's rail at one station for every phase, as a chain's first
  // own section: on the kept side it is that section, on the other refused.
  const fixed: AutoMovieSolidJoin.IResult = AutoMovieSolidMerge.create({ ...input((): number => 8), width: { part: { station: 8 }, host: (): number => 8 } });
  const fixedRail: AutoMovieSolidRail.IRail | null = fixed.join?.rail(1) ?? null;
  if (fixedRail === null || !(distance(fixedRail.partPoint, [r * Math.cos(1), r * Math.sin(1), 8]) <= 1e-9))
    failures.push(`fixed station: the part's rail is not the section at z = 8 (${fixed.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => d.detail).join("; ")})`);
  const inside: AutoMovieSolidJoin.IResult = AutoMovieSolidMerge.create({ ...input((): number => 8), width: { part: { station: -3 }, host: (): number => 8 } });
  if (inside.join !== null) failures.push("a part station inside the host is not refused");

  // 4. Refused: a host width of zero leaves no rail.
  const none: AutoMovieSolidJoin.IResult = AutoMovieSolidMerge.create(input((): number => 0));
  if (none.join !== null || none.diagnostics.length === 0) failures.push("a zero host width is not refused");

  if (failures.length) throw new Error(`${failures.length} solid merge failures:\n${failures.join("\n")}`);
}
