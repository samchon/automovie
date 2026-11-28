import { FamilyConicClosure as K } from "../../../reference-conics/FamilyConicClosure";

/**
 * The buried arc of a section is the part's own tube continued: the tube itself where the kept skin lies on it, and otherwise the
 * tube brought to the kept skin's radius and direction at both ends of the opening.
 *
 * Scenarios, millimetres in a section's chart about the course point at the origin:
 * 1. A round tube cut by a chord. The tube is the circle of radius 10; the kept skin is that circle, leaving at 9.5 mm below the
 *    centre on the left and coming back on the right, along the circle. Every point of the closure lies on the circle within 1e-12,
 *    one a degree of the opening, in the opening's order.
 * 2. Two neighbouring rays. Circles of radius 10 about (0, 0) and (16, 0), parted by the plane x = 8: each one's kept skin ends at
 *    (8, 6) and (8, -6). The first ray's closure, continued from its own tube, lies inside the second circle at every point (its
 *    distance from (16, 0) is under 10) and beyond the plane (x over 8): the two closed sections overlap by a lens and cross only at
 *    the kept skins' two ends, which is what a composed end reads of its children.
 * 3. Kept skin off the tube. The tube is the circle of radius 10; the kept skin leaves at radius 12 at 200 degrees heading along
 *    its own circle (no radial part) and comes back at radius 9 at 340 degrees heading outward at 0.2 of radius a radian. The
 *    closure's first point lies on the leaving tangent line within 0.005 mm and its last on the arriving one within 0.005 mm (a
 *    degree's step on a curve of bounded curvature), and half way round the opening its radius lies between 9 and 12.
 * 4. Refusals: kept skin whose end runs back in phase (leaving clockwise) is refused, naming the exit; a tube with no radius at an
 *    end is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `FamilyConicClosure.continued`, the function the fit tool closes every opening round a course with, and reads its points and refusals. It catches a closure that leaves the tube, one that comes out through the neighbour, a corner at either end, and a missing refusal.
 * @evidence contracts/development/testing.md#independent-expectations A circle's radius, the distance to a second centre, and the distance of a point from a line through the skin's end are written here without the module's cubic.
 * @evidence contracts/development/common.md#meaningful-documentation The round and neighbouring tubes give exact geometry for skin closure. A displaced skin tests both endpoint tangents, and reversed travel and zero radius exercise refusal.
 */
export function test_human_conic_closure(): void {
  const failures: string[] = [];
  const circle = (): number => 10;
  const along = (p: K.P): K.P => {
    const r: number = Math.hypot(p[0], p[1]);
    return [-p[1] / r, p[0] / r];
  };
  const polar = (radius: number, degrees: number): K.P => [radius * Math.cos((degrees * Math.PI) / 180), radius * Math.sin((degrees * Math.PI) / 180)];

  // 1. Skin on the tube: the closure is the tube.
  const half: number = Math.sqrt(100 - 9.5 * 9.5);
  const round: K.P[] | string = K.continued([-half, -9.5], along([-half, -9.5]), [half, -9.5], along([half, -9.5]), circle);
  if (typeof round === "string") failures.push(`round cut: refused (${round})`);
  else {
    const off: number = Math.max(...round.map((p: K.P): number => Math.abs(Math.hypot(p[0], p[1]) - 10)));
    if (!(off <= 1e-12)) failures.push(`round cut: the closure leaves the tube by ${off} mm`);
    const gap: number = 2 * Math.asin(half / 10);
    if (round.length !== Math.max(2, Math.ceil(gap / K.CONTINUED_STEP)) - 1) failures.push(`round cut: ${round.length} points over an opening of ${(gap * 180) / Math.PI} degrees`);
    if (!round.every((p: K.P, k: number): boolean => k === 0 || p[0] > round[k - 1]![0])) failures.push("round cut: the points do not run from the exit to the entry");
  }

  // 2. Two neighbours parted by x = 8: the first one's closure lies inside the second and past the plane.
  const lens: K.P[] | string = K.continued([8, -6], along([8, -6]), [8, 6], along([8, 6]), circle);
  if (typeof lens === "string") failures.push(`neighbours: refused (${lens})`);
  else {
    const outside: K.P[] = lens.filter((p: K.P): boolean => !(Math.hypot(p[0] - 16, p[1]) < 10));
    const short: K.P[] = lens.filter((p: K.P): boolean => !(p[0] > 8));
    if (outside.length > 0) failures.push(`neighbours: ${outside.length} of ${lens.length} closure points stand outside the neighbour's section`);
    if (short.length > 0) failures.push(`neighbours: ${short.length} of ${lens.length} closure points stand on the ray's own side of the plane`);
  }

  // 3. Skin off the tube, unequal at the two ends: C1 at both.
  const [exit, entry]: K.P[] = [polar(12, 200), polar(9, 340)];
  const leaving: K.P = along(exit!);
  const radial: K.P = [entry![0] / 9, entry![1] / 9];
  const outward: K.P = [along(entry!)[0] + 0.2 * radial[0], along(entry!)[1] + 0.2 * radial[1]];
  const arriving: K.P = [outward[0] / Math.hypot(outward[0], outward[1]), outward[1] / Math.hypot(outward[0], outward[1])];
  const bent: K.P[] | string = K.continued(exit!, leaving, entry!, arriving, circle);
  if (typeof bent === "string") failures.push(`skin off the tube: refused (${bent})`);
  else {
    const from = (p: K.P, at: K.P, direction: K.P): number => Math.abs((p[0] - at[0]) * direction[1] - (p[1] - at[1]) * direction[0]);
    if (!(from(bent[0]!, exit!, leaving) <= 0.005)) failures.push(`skin off the tube: the first point stands ${from(bent[0]!, exit!, leaving)} mm off the leaving tangent`);
    if (!(from(bent.at(-1)!, entry!, arriving) <= 0.005)) failures.push(`skin off the tube: the last point stands ${from(bent.at(-1)!, entry!, arriving)} mm off the arriving tangent`);
    const middle: K.P = bent[Math.floor(bent.length / 2)]!;
    const r: number = Math.hypot(middle[0], middle[1]);
    if (!(r > 9 && r < 12)) failures.push(`skin off the tube: radius ${r} half way round`);
  }

  // 4. Refusals.
  const back: K.P[] | string = K.continued([-half, -9.5], [-along([-half, -9.5])[0], -along([-half, -9.5])[1]], [half, -9.5], along([half, -9.5]), circle);
  if (!(typeof back === "string" && back.includes("exit"))) failures.push(`skin running back at the exit: ${typeof back === "string" ? back : "not refused"}`);
  const empty: K.P[] | string = K.continued([-half, -9.5], along([-half, -9.5]), [half, -9.5], along([half, -9.5]), (): number => 0);
  if (!(typeof empty === "string" && empty.includes("no radius"))) failures.push(`a tube with no radius: ${typeof empty === "string" ? empty : "not refused"}`);

  if (failures.length > 0) throw new Error(`section closure: ${failures.length} finding(s):\n${failures.join("\n")}`);
}
