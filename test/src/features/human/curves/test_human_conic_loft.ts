import { AutoMovieLoftChain, type AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection } from "@automovie/human";

/**
 * A conic family's loft, its twin and its closed end, against closed forms.
 *
 * Scenarios:
 * 1. A cylinder: a family of circular sections of radius 20 along a straight course lofts to points 20 mm from the course at every station and phase.
 * 2. The twin is the reflection: on a slanted course with an off-centre section whose four shoulders differ, the twin's point at phase `-phi` is the original's point at `phi` reflected in `z = 0`.
 * 3. A cylinder's cap is half an ellipsoid: with a tip 12 mm past the cap's start the taper is zero, so the cap is the quarter ellipse of semi-axes 12 and 20 turned about the course, `r = 20 sqrt(1 - ((12 - d) / 12)^2)` at distance `d` from the tip, and the loft carries a pole at the tip on the course.
 * 4. A cap starts where its tip says: stations past `from` are not lofted from the fields, so the part's stations end at `from` and the tip.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanConicLoft.create`, `mirror` and `part` and reads the engine's chain with `AutoMovieLoftChain.point`.
 * @evidence contracts/development/testing.md#independent-expectations A circle's radius, a reflection in a plane and an ellipse's equation are closed forms that owe nothing to this code.
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

  // 3. A cylinder closed 12 mm past station 80: half an ellipsoid of semi-axes 12 along the course and 20 across it.
  const capped: AutoMovieHumanConicLoft.IFamily = { ...cylinder, name: "capped", tips: [null, { from: 80, tip: 92 }] };
  const closed: NonNullable<AutoMovieViewLoft.IResult["chain"]> | null = lofted(capped, "capped");
  if (closed !== null) {
    const pole: number[] | undefined = closed.pole?.point;
    if (closed.pole?.end !== "top" || pole === undefined || !(Math.hypot(pole[0]!, pole[1]! - 92, pole[2]!) <= 1e-9)) failures.push(`capped: pole ${JSON.stringify(closed.pole?.point)} at the ${closed.pole?.end}, expected (0, 92, 0) at the top`);
    for (const s of closed.layers.map((layer: { y: number }): number => layer.y).filter((y: number): boolean => y > 80)) {
      const expected: number = 20 * Math.sqrt(1 - ((s - 80) / 12) ** 2);
      const p: number[] = AutoMovieLoftChain.point(closed, s, 0.7);
      if (!(Math.abs(Math.hypot(p[0]!, p[2]!) - expected) <= 0.02)) failures.push(`capped at station ${s}: radius ${Math.hypot(p[0]!, p[2]!)}, expected ${expected}`);
    }
  }

  // 4. The part's stations: the requested ones short of the cap's start, that start, and the tip.
  const part: number[] = AutoMovieHumanConicLoft.part(capped, stations).stations;
  if (part.at(-1) !== 92 || part.at(-2) !== 80 || part.at(-3) !== 78 || part.length !== 42) failures.push(`capped part: stations end ${part.slice(-3).join(", ")} with ${part.length} in all, expected 78, 80, 92 and 42`);

  if (failures.length > 0) throw new Error("human conic loft:\n" + failures.join("\n"));
}
