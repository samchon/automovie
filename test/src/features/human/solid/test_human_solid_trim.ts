import { AutoMovieSolidBlend, type AutoMovieSolidRibbon, AutoMovieSolidTrim, type AutoMovieSolidVector, type IAutoMovieSolidSurface } from "@automovie/engine";
import { HumanSeamObserver } from "../../internal/HumanSeamObserver";
import { HumanSolidShapes } from "../../internal/HumanSolidShapes";

type Vec3 = AutoMovieSolidVector.Vec3;
const { cylinder, distance, dot, plane, sum } = HumanSolidShapes;

/**
 * A through-cut's trim loop passes through its landmarks' feet in the skin's
 * chart, tells the opening from the skin on either branch of a periodic phase,
 * and leaves the skin toward the opening with a ribbon a rolled rim meets G2.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds trims with `AutoMovieSolidTrim.create` from 12 landmarks on a 5 mm circle on the plane z = 0, lifted 0.7 mm off it, and from 10 landmarks round a point of a 10 mm cylinder; reads `ITrim.at`, `ITrim.inside` and `ITrim.ribbon`, and blends the plane's ribbon to a rim curve 2 mm under the margin with `AutoMovieSolidBlend.jet`, read with `HumanSeamObserver.surface`. It catches a loop off its landmarks' feet, an inside test that misses the opening or claims the skin, a phase branch that hides the opening, a ribbon that points away from the opening, a rim that breaks G2 with the skin, and a margin of too few landmarks accepted. Any trim passes whose loop interpolates the feet and whose ribbon is the skin's own jet toward the hole.
 * @evidence contracts/testing.md#independent-expectations Expectations are closed forms: a point lifted along the plane's normal has its foot straight under it, so the feet are the circle's points; the opening is the disc about the circle's centre, so its centre and a point 4.9 mm out are inside and points 5.1 mm and 12 mm out are not (the cubic interpolant of 12 points of a circle departs from it by under 1e-3 of its radius); the ribbon at a knot points to the centre within 1e-3 rad. Limits: the loop at its knots within 1e-6 mm of the feet, the periodic filter's 14-neighbour truncation leaving about 1e-8 of the coordinates; seam readings `HumanSeamObserver.exact(20, 0.005)` plus the stencils' truncation, `h^4 f5 / 5` on the slope and `5 h^3 f5 / 6` on the second derivative, f5 the rim quintic's fifth derivative from its two ribbons (about 32 per mm^5 for a rim turning 2 mm down over 2 mm).
 * @evidence contracts/testing.md#distinguishing-cases Green: the plane's loop and its rim, the cylinder's loop read on the phase branch two pi away. Red: points 5.1 and 12 mm from the centre and the cylinder's far side must read as skin. Refused: three landmarks. The blend's response to a bent ribbon is `test_human_solid_merge`'s; merge and diff own their rails.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_solid_trim`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 */
export function test_human_solid_trim(): void {
  const failures: string[] = [];
  const skin: IAutoMovieSolidSurface = plane("skin", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const centre: [number, number] = [3, -2];
  const count: number = 12;
  const landmarks: Vec3[] = Array.from({ length: count }, (_: unknown, m: number): Vec3 => {
    const t: number = (2 * Math.PI * m) / count;
    return [centre[0] + 5 * Math.cos(t), centre[1] + 5 * Math.sin(t), 0.7];
  });
  const guesses: [number, number][] = landmarks.map((p: Vec3): [number, number] => [p[0] + 0.3, p[1] - 0.2]);
  const result: AutoMovieSolidTrim.IResult = AutoMovieSolidTrim.create(skin, landmarks, guesses, 1e-12);

  if (result.trim === null) failures.push("plane: no trim");
  else {
    const trim: AutoMovieSolidTrim.ITrim = result.trim;
    for (let m: number = 0; m < count; m++) {
      const [u, v]: [number, number, number, number] = trim.at((2 * Math.PI * m) / count);
      if (!(Math.hypot(u - landmarks[m]![0], v - landmarks[m]![1]) <= 1e-6)) failures.push(`plane loop at knot ${m}: ${u}, ${v}, expected the foot ${landmarks[m]![0]}, ${landmarks[m]![1]}`);
    }
    const cases: [number, number, boolean][] = [
      [0, 0, true],
      [4.9, 0, true],
      [0, -4.9, true],
      [5.1, 0, false],
      [-12, 0, false],
    ];
    for (const [dx, dy, want] of cases)
      if (trim.inside(centre[0] + dx, centre[1] + dy) !== want) failures.push(`plane inside at ${dx}, ${dy}: ${!want}, expected ${want}`);

    // The ribbon at each knot points to the centre.
    for (let m: number = 0; m < count; m++) {
      const t: number = (2 * Math.PI * m) / count;
      const r: AutoMovieSolidRibbon.IRibbon = trim.ribbon(t, 2);
      const toward: Vec3 = [centre[0] - r.point[0], centre[1] - r.point[1], 0];
      const cosine: number = dot(r.first, toward) / (Math.hypot(...r.first) * Math.hypot(...toward));
      if (!(cosine >= Math.cos(1e-3))) failures.push(`plane ribbon at knot ${m}: ${Math.acos(Math.min(1, cosine))} rad from the centre`);
    }

    // A rolled rim from the skin's ribbon down to a curve 2 mm under the
    // margin, arriving straight down: G2 with the skin at the margin.
    const inner = (a: number): AutoMovieSolidRibbon.IRibbon => {
      const [u, v]: [number, number, number, number] = trim.at(a);
      return { point: [u, v, -2], first: [0, 0, -2], second: [0, 0, 0] };
    };
    const outer = (a: number, sigma: number): number[] => {
      const r: AutoMovieSolidRibbon.IRibbon = trim.ribbon(a, 1);
      const l: number = Math.hypot(...r.first);
      return sum([1, r.point], [-sigma / l, r.first]);
    };
    const rim = (a: number, sigma: number): number[] => AutoMovieSolidBlend.jet(trim.ribbon(a, 2), inner(a), sigma / 2).point;

    // The observer's one-sided stencils truncate by `h^4 f5 / 5` (slope) and
    // `5 h^3 f5 / 6` (second derivative), f5 the rim's fifth derivative in
    // its arc: the rim is the quintic Hermite of its two ribbons in w = sigma / 2,
    // whose w^5 coefficient is `-6 p0 - 3 d0 - s0 / 2 + 6 p1 - 3 d1 + s1 / 2`,
    // so f5 = 120 |c5| / 2^5 per mm^5 at unit speed. The rim turns 2 mm down
    // over 2 mm, so this truncation passes the rounding the exact limits hold.
    const places: number[] = [0, 1.1, 2.9, 4.4];
    const f5: number = Math.max(
      ...places.map((a: number): number => {
        const s: AutoMovieSolidRibbon.IRibbon = trim.ribbon(a, 2);
        const e: AutoMovieSolidRibbon.IRibbon = inner(a);
        const c5: number[] = [0, 1, 2].map((k: number): number => -6 * s.point[k]! - 3 * s.first[k]! - 0.5 * s.second[k]! + 6 * e.point[k]! - 3 * e.first[k]! + 0.5 * e.second[k]!);
        return (120 * Math.hypot(...c5)) / 2 ** 5;
      }),
    );
    const h: number = 0.005;
    const exact: HumanSeamObserver.ITolerance = HumanSeamObserver.exact(20, h);
    const tolerance: HumanSeamObserver.ITolerance = {
      gap: exact.gap,
      angle: exact.angle + (h ** 4 * f5) / 5,
      curvature: exact.curvature + (5 * h ** 3 * f5) / 6,
      basis: `${exact.basis}, plus the stencils' truncation on the rim's fifth derivative ${f5} per mm^5`,
    };
    failures.push(
      ...HumanSeamObserver.audit(
        places.map((a: number): HumanSeamObserver.IReading => HumanSeamObserver.surface("rolled rim", `t ${a}`, outer, rim, a, h)),
        "G2",
        tolerance,
      ),
    );
  }

  // A loop round a point of a cylinder, read on the phase branch two pi away.
  const tube: IAutoMovieSolidSurface = cylinder("tube", [0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0], 10);
  const ring: Vec3[] = Array.from({ length: 10 }, (_: unknown, m: number): Vec3 => {
    const t: number = (2 * Math.PI * m) / 10;
    const phi: number = 0.1 + 0.2 * Math.cos(t);
    return [10 * Math.cos(phi), 10 * Math.sin(phi), 5 + 2 * Math.sin(t)];
  });
  const around: AutoMovieSolidTrim.IResult = AutoMovieSolidTrim.create(
    tube,
    ring,
    ring.map((): [number, number] => [5, 0.1]),
    1e-12,
  );
  if (around.trim === null) failures.push("cylinder: no trim");
  else {
    const trim: AutoMovieSolidTrim.ITrim = around.trim;
    if (!trim.inside(5, 0.1 + 2 * Math.PI)) failures.push("cylinder: the opening's centre on the next phase branch reads as skin");
    if (trim.inside(5, 0.1 + Math.PI)) failures.push("cylinder: the far side reads as the opening");
    if (!(distance(tube.jet(...trim.feet[0]!).p, ring[0]!) <= 1e-9)) failures.push("cylinder: the first foot is off its landmark");
  }

  // Refused: three landmarks.
  const few: AutoMovieSolidTrim.IResult = AutoMovieSolidTrim.create(skin, landmarks.slice(0, 3), guesses.slice(0, 3), 1e-12);
  if (few.trim !== null || few.diagnostics.length === 0) failures.push("a margin of three landmarks is not refused");

  if (failures.length) throw new Error(`${failures.length} solid trim failures:\n${failures.join("\n")}`);
}
