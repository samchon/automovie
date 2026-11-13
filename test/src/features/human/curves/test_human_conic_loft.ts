import { AutoMovieLoftChain, type AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection } from "@automovie/human";

/**
 * A conic family's loft, its twin and its closed end, against closed forms.
 *
 * Scenarios:
 * 1. A cylinder: a family of circular sections of radius 20 along a straight course lofts to points 20 mm from the course at every station and phase.
 * 2. The twin is the reflection: on a slanted course with an off-centre section whose four shoulders differ, the twin's point at phase `-phi` is the original's point at `phi` reflected in `z = 0`.
 * 3. A cylinder's cap leaves it with neither slope nor bend: with a tip 12 mm past the cap's start the wall's taper and bend are zero, so the cap is `r = 20 sqrt(1 - u^3)` with `u = (s - 80) / 12`, the one cubic in `u` for `r^2` that is 400 at the start with zero first and second derivatives there and 0 at the tip, turned about the course, and the loft carries a pole at the tip on the course.
 * 4. A cap starts where its tip says and is meshed in rings: stations past `from` are not lofted from the fields, so the part's stations end at `from`, twelve rings at `92 - 12 (k / 13)^2` and the tip.
 * 5. Phases spaced by turn (`IFamily.turn`): a flat section with sharp ends turns by more than 0.3 rad between uniform phases; with a turn of 0.1 rad the part declares ordered phases and its lofted rings turn by at most 0.12 rad between neighbours.
 * 6. A grooved family's twin is its reflection: the slanted family with a groove after its +u extreme (`inflected(0, [0])`) mirrors without refusal, and its point at phase `-phi` is the original's at `phi` reflected in `z = 0`.
 * 7. A featured family's twin is its reflection: the slanted family with a feature point between its +u and +v extremes mirrors to the same reflected points at every station and phase.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanConicLoft.create`, `mirror` and `part` and reads the engine's chain with `AutoMovieLoftChain.point`.
 * @evidence contracts/development/testing.md#independent-expectations A circle's radius, a reflection in a plane and the cubic fixed by four end conditions are closed forms that owe nothing to this code.
 * @evidence contracts/development/testing.md#distinguishing-cases A centred circle, an off-centre section with unequal shoulders on a slanted course, a closed end and an open one.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit on made numbers, reached by `--include human_conic_loft`, with no reference body or figure.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario with the closed form it is checked against.
 */
export function test_human_conic_loft(): void {
  const failures: string[] = [];
  const stations: number[] = Array.from({ length: 51 }, (_: unknown, i: number): number => 2 * i);
  const ellipse: number = Math.SQRT2 - 1;
  const cylinder: AutoMovieHumanConicLoft.IFamily = {
    name: "probe",
    centres: [[0, 0, 0], [0, 100, 0]],
    halves: [],
    up: [1, 0, 0],
    layout: AutoMovieHumanConicSection.limb(0),
    knots: [0, 50, 100],
    values: [[20, 20, 20], [0, 0, 0], [0, 0, 0], [20, 20, 20], [-20, -20, -20], [0, 0, 0], [0, 0, 0], [-20, -20, -20], ...[0, 1, 2, 3].map((): number[] => [ellipse, ellipse, ellipse])],
  };
  const lofted = (family: AutoMovieHumanConicLoft.IFamily, label: string): NonNullable<AutoMovieViewLoft.IResult["chain"]> | null => {
    const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, stations);
    if (loft.chain === null || loft.diagnostics.length > 0) failures.push(`${label}: not lofted cleanly: ${JSON.stringify(loft.diagnostics).slice(0, 300)}`);
    return loft.chain;
  };
  const phases: number[] = Array.from({ length: 24 }, (_: unknown, k: number): number => (2 * Math.PI * (k + 0.31)) / 24);

  // 1. Every point of the cylinder is 20 mm from the course, the y axis.
  const tube: NonNullable<AutoMovieViewLoft.IResult["chain"]> | null = lofted(cylinder, "cylinder");
  if (tube !== null)
    for (const s of [0, 31, 100])
      for (const phi of phases) {
        const p: number[] = AutoMovieLoftChain.point(tube, s, phi);
        if (!(Math.abs(Math.hypot(p[0]!, p[2]!) - 20) <= 1e-6 && Math.abs(p[1]! - s) <= 1e-9)) failures.push(`cylinder at station ${s}, phase ${phi.toFixed(3)}: point (${p.join(", ")})`);
      }

  // 2. The twin of a slanted, off-centre, unevenly full family.
  const slanted: AutoMovieHumanConicLoft.IFamily = {
    ...cylinder,
    name: "slanted",
    centres: [[5, 0, 10], [8, 100, 30]],
    values: [[22, 21, 19], [3, 4, 2], [-2, -1, 0], [17, 18, 16], [-25, -24, -23], [-3, -2, -1], [4, 3, 2], [-14, -15, -16], [0.31, 0.33, 0.35], [0.47, 0.45, 0.44], [0.55, 0.5, 0.52], [0.4, 0.42, 0.38]],
  };
  const one: NonNullable<AutoMovieViewLoft.IResult["chain"]> | null = lofted(slanted, "slanted");
  const two: NonNullable<AutoMovieViewLoft.IResult["chain"]> | null = lofted(AutoMovieHumanConicLoft.mirror(slanted, "slanted.mirror"), "twin");
  if (one !== null && two !== null)
    for (const s of [0, 44, 100])
      for (const phi of phases) {
        const p: number[] = AutoMovieLoftChain.point(one, s, phi);
        const q: number[] = AutoMovieLoftChain.point(two, s, -phi);
        const apart: number = Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! + q[2]!);
        if (!(apart <= 1e-9)) failures.push(`twin at station ${s}, phase ${phi.toFixed(3)}: ${apart} mm from the reflected original`);
      }

  // 3. A cylinder closed 12 mm past station 80: the cap with no slope and no bend at its start, r^2 = 400 (1 - u^3) with u = (s - 80) / 12.
  const capped: AutoMovieHumanConicLoft.IFamily = { ...cylinder, name: "capped", tips: [null, { from: 80, tip: 92 }] };
  const closed: NonNullable<AutoMovieViewLoft.IResult["chain"]> | null = lofted(capped, "capped");
  if (closed !== null) {
    const pole: number[] | undefined = closed.pole?.point;
    if (closed.pole?.end !== "top" || pole === undefined || !(Math.hypot(pole[0]!, pole[1]! - 92, pole[2]!) <= 1e-9)) failures.push(`capped: pole ${JSON.stringify(closed.pole?.point)} at the ${closed.pole?.end}, expected (0, 92, 0) at the top`);
    for (const s of closed.layers.map((layer: { y: number }): number => layer.y).filter((y: number): boolean => y > 80)) {
      const expected: number = 20 * Math.sqrt(1 - ((s - 80) / 12) ** 3);
      const p: number[] = AutoMovieLoftChain.point(closed, s, 0.7);
      if (!(Math.abs(Math.hypot(p[0]!, p[2]!) - expected) <= 0.02)) failures.push(`capped at station ${s}: radius ${Math.hypot(p[0]!, p[2]!)}, expected ${expected}`);
    }
  }

  // 4. The part's stations: the requested ones short of the cap's start, that start, the cap's twelve rings at 92 - 12 (k / 13)^2, and the tip.
  const part: number[] = AutoMovieHumanConicLoft.part(capped, stations).stations;
  const rings: number[] = Array.from({ length: 12 }, (_: unknown, i: number): number => 92 - 12 * ((12 - i) / 13) ** 2);
  const cap: number[] = part.slice(-13, -1);
  if (part.at(-1) !== 92 || part.at(-14) !== 80 || part.at(-15) !== 78 || part.length !== 54 || cap.some((s: number, i: number): boolean => !(Math.abs(s - rings[i]!) <= 1e-9))) failures.push(`capped part: stations end ${part.slice(-15).join(", ")} with ${part.length} in all, expected 78, 80, the twelve rings, 92 and 54`);

  // 5. Phases spaced by turn: an elliptic section 40 by 5 mm turns by half a turn round each narrow end within about 2 mm (its radius of
  // curvature there is 5^2 / 40 = 0.6 mm). Uniform, its 48 phases (the least count; girth 4 mm apart asks fewer) turn by more than
  // 0.3 rad between neighbours there; with `turn` 0.1 the part declares its phases, `samples` of them from 0, strictly increasing, and
  // its lofted rings turn by at most 0.12 rad between neighbours (the spacing reads the rings on 1024 phases, finer than the end).
  const flat: AutoMovieHumanConicLoft.IFamily = { ...cylinder, name: "flat", values: [[40, 40, 40], [0, 0, 0], [0, 0, 0], [5, 5, 5], [-40, -40, -40], [0, 0, 0], [0, 0, 0], [-5, -5, -5], ...[0, 1, 2, 3].map((): number[] => [ellipse, ellipse, ellipse])] };
  const widest = (family: AutoMovieHumanConicLoft.IFamily): { turn: number; phases: number[] | undefined; samples: number } => {
    const made = AutoMovieHumanConicLoft.part(family, stations);
    const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> | null = lofted(family, family.name);
    const ring: number[] = made.phases ?? Array.from({ length: made.samples }, (_: unknown, k: number): number => (2 * Math.PI * k) / made.samples);
    let turn: number = 0;
    if (chain !== null)
      for (const s of [0, 50, 100]) {
        const points: number[][] = ring.map((phi: number): number[] => AutoMovieLoftChain.point(chain, s, phi));
        points.forEach((b: number[], k: number): void => {
          const a: number[] = points[(k + points.length - 1) % points.length]!;
          const c: number[] = points[(k + 1) % points.length]!;
          const u: number[] = [0, 1, 2].map((i: number): number => b[i]! - a[i]!);
          const w: number[] = [0, 1, 2].map((i: number): number => c[i]! - b[i]!);
          const cosine: number = (u[0]! * w[0]! + u[1]! * w[1]! + u[2]! * w[2]!) / (Math.hypot(u[0]!, u[1]!, u[2]!) * Math.hypot(w[0]!, w[1]!, w[2]!));
          turn = Math.max(turn, Math.acos(Math.max(-1, Math.min(1, cosine))));
        });
      }
    return { turn, phases: made.phases, samples: made.samples };
  };
  const even = widest(flat);
  const spaced = widest({ ...flat, name: "flat.spaced", turn: 0.1 });
  if (even.phases !== undefined || !(even.turn > 0.3)) failures.push(`flat, uniform: phases ${even.phases === undefined ? "absent" : "declared"}, largest turn ${even.turn.toFixed(3)} rad, expected absent and above 0.3`);
  const ordered: boolean = spaced.phases !== undefined && spaced.phases.length === spaced.samples && spaced.phases[0] === 0 && spaced.phases.every((phi: number, k: number): boolean => k === 0 || phi > spaced.phases![k - 1]!) && spaced.phases.at(-1)! < 2 * Math.PI;
  if (!ordered || !(spaced.turn <= 0.12)) failures.push(`flat, spaced: ${spaced.samples} phases ${ordered ? "in order" : "not in order"}, largest turn ${spaced.turn.toFixed(3)} rad, expected at most 0.12`);

  // 6. The twin of a grooved family: the slanted family with a groove after its +u extreme (`inflected(0, [0])`), two inflections and the
  // groove's floor; reflected, the order of its anchors reverses, so each inflection's neighbours swap.
  const grooved: AutoMovieHumanConicLoft.IFamily = {
    ...slanted,
    name: "grooved",
    layout: AutoMovieHumanConicSection.inflected(0, [0]),
    values: [[22, 21, 19], [3, 4, 2], [0.3, 0.3, 0.3], [0.4, 0.4, 0.4], [0.4, 0.4, 0.4], [0.75, 0.75, 0.75], [-0.4, -0.4, -0.4], [-2, -1, 0], [17, 18, 16], [-25, -24, -23], [-3, -2, -1], [4, 3, 2], [-14, -15, -16], ...[0, 1, 2, 3, 4, 5, 6].map((): number[] => [ellipse, ellipse, ellipse])],
  };
  const three: NonNullable<AutoMovieViewLoft.IResult["chain"]> | null = lofted(grooved, "grooved");
  let four: NonNullable<AutoMovieViewLoft.IResult["chain"]> | null = null;
  try {
    four = lofted(AutoMovieHumanConicLoft.mirror(grooved, "grooved.mirror"), "grooved twin");
  } catch (error: unknown) {
    failures.push(`grooved twin: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (three !== null && four !== null)
    for (const s of [0, 44, 100])
      for (const phi of phases) {
        const p: number[] = AutoMovieLoftChain.point(three, s, phi);
        const q: number[] = AutoMovieLoftChain.point(four, s, -phi);
        const apart: number = Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! + q[2]!);
        if (!(apart <= 1e-9)) failures.push(`grooved twin at station ${s}, phase ${phi.toFixed(3)}: ${apart} mm from the reflected original`);
      }

  // 7. The twin of a featured family: the slanted family with a feature point between its +u and +v extremes, at (14, 13) heading 2.5 rad
  // from +u toward +v, about the direction of travel from the one extreme to the other (atan2(14, -24) = 2.61).
  const featured: AutoMovieHumanConicLoft.IFamily = {
    ...slanted,
    name: "featured",
    layout: { mirror: false, anchors: [...AutoMovieHumanConicSection.limb(0).anchors.slice(0, 1), { kind: "f" }, ...AutoMovieHumanConicSection.limb(0).anchors.slice(1)] },
    // The feature's numbers are its share along the chord from the +u extreme to the +v one, its offset square to it and its turn from it
    // (`AutoMovieHumanConicSection.place`), read at each knot from that point and heading.
    values: ((): number[][] => {
      const plane: number[][] = [0, 1, 2].map((m: number): number[] => AutoMovieHumanConicSection.unplace([[22, 21, 19][m]!, [3, 4, 2][m]!], [[-2, -1, 0][m]!, [17, 18, 16][m]!], [[14, 14, 13][m]!, [13, 13.5, 12][m]!], 2.5, 0).values);
      return [[22, 21, 19], [3, 4, 2], plane.map((n: number[]): number => n[0]!), plane.map((n: number[]): number => n[1]!), plane.map((n: number[]): number => n[2]!), [-2, -1, 0], [17, 18, 16], [-25, -24, -23], [-3, -2, -1], [4, 3, 2], [-14, -15, -16], ...[0, 1, 2, 3, 4].map((): number[] => [ellipse, ellipse, ellipse])];
    })(),
  };
  const five: NonNullable<AutoMovieViewLoft.IResult["chain"]> | null = lofted(featured, "featured");
  const six: NonNullable<AutoMovieViewLoft.IResult["chain"]> | null = lofted(AutoMovieHumanConicLoft.mirror(featured, "featured.mirror"), "featured twin");
  if (five !== null && six !== null)
    for (const s of [0, 44, 100])
      for (const phi of phases) {
        const p: number[] = AutoMovieLoftChain.point(five, s, phi);
        const q: number[] = AutoMovieLoftChain.point(six, s, -phi);
        const apart: number = Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! + q[2]!);
        if (!(apart <= 1e-9)) failures.push(`featured twin at station ${s}, phase ${phi.toFixed(3)}: ${apart} mm from the reflected original`);
      }

  if (failures.length > 0) throw new Error("human conic loft:\n" + failures.join("\n"));
}
