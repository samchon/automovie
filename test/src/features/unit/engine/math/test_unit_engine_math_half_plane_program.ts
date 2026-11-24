import { solveAutoMovieHalfPlaneProgram } from "@automovie/engine";
import type { IAutoMovieSolveHalfPlaneProgram } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The half-plane program of optimal reciprocal collision avoidance finds the
 * point of a disc nearest a preferred point inside every half-plane, and the
 * least worst violation when there is none.
 *
 * Scenarios:
 * 1. A preferred point inside every half-plane and the disc is returned as it
 *    is, and the result is feasible.
 * 2. One violated half-plane: the result is the preferred point's orthogonal
 *    projection onto its line, within 1e-12.
 * 3. A preferred point outside the disc and no half-plane: the result is the
 *    disc's boundary point toward it, within 1e-12.
 * 4. Two half-planes facing apart across a strip 0.4 wide that the disc
 *    contains nowhere both: `y >= 0.2` and `y <= -0.2`; the result is
 *    infeasible and lies on `y = 0`, where the two violations are equal.
 * 5. 200 random sets of one to six half-planes through the disc: every
 *    feasible result satisfies each half-plane within 1e-9 and lies in the
 *    disc, and no point of a 201 by 201 grid over the disc that satisfies
 *    them all is nearer the preferred point by more than the grid's half
 *    diagonal; an infeasible result has no feasible grid point.
 * 6. Order: the same set listed in reverse gives the same feasible point
 *    within 1e-9.
 * 7. Scenario 4's strip with its first half-plane hard: the result keeps
 *    `y >= 0.2` and lies at `y = 0.2`, where the other's violation is least.
 *    With both hard they clash, so both are relaxed alike and the result lies
 *    at `y = 0`. A hard count that is negative, fractional or beyond the
 *    half-planes is refused.
 */
export function test_unit_engine_math_half_plane_program(): void {
  const findings: string[] = [];
  type ILine = IAutoMovieSolveHalfPlaneProgram.ILine;
  type IPoint = IAutoMovieSolveHalfPlaneProgram.IPoint;
  const inside = (line: ILine, p: IPoint): number =>
    line.direction.x * (line.point.y - p.y) -
    line.direction.y * (line.point.x - p.x);

  // 1. Inside.
  const free: IAutoMovieSolveHalfPlaneProgram.IResult =
    solveAutoMovieHalfPlaneProgram(
      [{ point: { x: 0, y: -1 }, direction: { x: 1, y: 0 } }],
      2,
      { x: 0.3, y: 0.4 },
    );
  if (!free.feasible || free.point.x !== 0.3 || free.point.y !== 0.4)
    findings.push("an admissible preferred point was moved");

  // 2. One violated half-plane, y >= 0.5 (the left of +x through (0, 0.5)).
  const projected: IPoint = solveAutoMovieHalfPlaneProgram(
    [{ point: { x: 0, y: 0.5 }, direction: { x: 1, y: 0 } }],
    2,
    { x: 0.7, y: -0.3 },
  ).point;
  if (Math.hypot(projected.x - 0.7, projected.y - 0.5) > 1e-12)
    findings.push(
      `the projection onto y = 0.5 is (${projected.x}, ${projected.y})`,
    );

  // 3. The disc alone.
  const clipped: IPoint = solveAutoMovieHalfPlaneProgram([], 1, {
    x: 3,
    y: 4,
  }).point;
  if (Math.hypot(clipped.x - 0.6, clipped.y - 0.8) > 1e-12)
    findings.push(`the disc's boundary point is (${clipped.x}, ${clipped.y})`);

  // 4. Infeasible: y >= 0.2 and y <= -0.2.
  const torn: IAutoMovieSolveHalfPlaneProgram.IResult =
    solveAutoMovieHalfPlaneProgram(
      [
        { point: { x: 0, y: 0.2 }, direction: { x: 1, y: 0 } },
        { point: { x: 0, y: -0.2 }, direction: { x: -1, y: 0 } },
      ],
      1,
      { x: 0.1, y: 0.5 },
    );
  if (torn.feasible) findings.push("an empty set was called feasible");
  if (Math.abs(torn.point.y) > 1e-9)
    findings.push(
      `the least worst violation lies at y = ${torn.point.y}, 0 expected`,
    );

  // 5. Random sets against a grid.
  let seed: number = 2026;
  const random = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const R: number = 1;
  const G: number = 201;
  const half: number = (Math.SQRT2 * 2 * R) / (G - 1) / 2;
  for (let trial: number = 0; trial < 200; ++trial) {
    const count: number = 1 + Math.floor(random() * 6);
    const lines: ILine[] = [];
    for (let i: number = 0; i < count; ++i) {
      const a: number = random() * 2 * Math.PI;
      const r: number = random() * 0.9 * R;
      const b: number = random() * 2 * Math.PI;
      lines.push({
        point: { x: r * Math.cos(a), y: r * Math.sin(a) },
        direction: { x: Math.cos(b), y: Math.sin(b) },
      });
    }
    const preferred: IPoint = {
      x: (random() * 2 - 1) * 1.5 * R,
      y: (random() * 2 - 1) * 1.5 * R,
    };
    const result: IAutoMovieSolveHalfPlaneProgram.IResult =
      solveAutoMovieHalfPlaneProgram(lines, R, preferred);
    let best: number = Infinity;
    for (let i: number = 0; i < G; ++i)
      for (let j: number = 0; j < G; ++j) {
        const p: IPoint = {
          x: -R + (2 * R * i) / (G - 1),
          y: -R + (2 * R * j) / (G - 1),
        };
        if (Math.hypot(p.x, p.y) > R) continue;
        if (lines.some((l: ILine): boolean => inside(l, p) > 0)) continue;
        best = Math.min(best, Math.hypot(p.x - preferred.x, p.y - preferred.y));
      }
    if (result.feasible) {
      if (
        lines.some((l: ILine): boolean => inside(l, result.point) > 1e-9) ||
        Math.hypot(result.point.x, result.point.y) > R + 1e-9
      ) {
        findings.push(`trial ${trial}: a feasible result breaks a constraint`);
        continue;
      }
      const got: number = Math.hypot(
        result.point.x - preferred.x,
        result.point.y - preferred.y,
      );
      if (got > best + half)
        findings.push(
          `trial ${trial}: ${got.toFixed(6)} from the preferred point, the grid reaches ${best.toFixed(6)}`,
        );

      // 6. Order.
      const reversed: IPoint = solveAutoMovieHalfPlaneProgram(
        [...lines].reverse(),
        R,
        preferred,
      ).point;
      if (
        Math.hypot(reversed.x - result.point.x, reversed.y - result.point.y) >
        1e-9
      )
        findings.push(`trial ${trial}: the reversed order moves the optimum`);
    } else if (best !== Infinity)
      findings.push(
        `trial ${trial}: called infeasible with a feasible grid point`,
      );
  }
  // 7. Hard half-planes in the fallback: scenario 4's strip with its first side kept.
  const strip: ILine[] = [
    { point: { x: 0, y: 0.2 }, direction: { x: 1, y: 0 } },
    { point: { x: 0, y: -0.2 }, direction: { x: -1, y: 0 } },
  ];
  const kept: IAutoMovieSolveHalfPlaneProgram.IResult =
    solveAutoMovieHalfPlaneProgram(strip, 1, { x: 0.1, y: 0.5 }, 1);
  if (kept.feasible || Math.abs(kept.point.y - 0.2) > 1e-9)
    findings.push(
      `a hard y >= 0.2 against y <= -0.2 gives y = ${kept.point.y}, 0.2 expected`,
    );
  const clash: IPoint = solveAutoMovieHalfPlaneProgram(
    strip,
    1,
    { x: 0.1, y: 0.5 },
    2,
  ).point;
  if (Math.abs(clash.y) > 1e-9)
    findings.push(
      `two clashing hard half-planes give y = ${clash.y}, 0 expected`,
    );
  for (const hard of [-1, 0.5, 3])
    try {
      solveAutoMovieHalfPlaneProgram(strip, 1, { x: 0, y: 0 }, hard);
      findings.push(`hard ${hard} was admitted`);
    } catch {}
  TestValidator.equals("the half-plane program", findings, []);
}
