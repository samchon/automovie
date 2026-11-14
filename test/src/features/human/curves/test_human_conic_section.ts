import { AutoMovieViewChain } from "@automovie/engine";
import { AutoMovieHumanConicSection } from "@automovie/human";

/**
 * The conic section model of the authored families, against closed forms.
 *
 * Scenarios:
 * 1. An ellipse: the plain limb layout on a centred box of half extents 40 and 25 with every shoulder `sqrt(2) - 1` is the ellipse `(u / 40)^2 + (v / 25)^2 = 1` at every phase.
 * 2. A median split with the values of rational subdivision leaves the curve unchanged: the split limb layout with every median fullness `rho` and every half shoulder `w' / (1 + w')`, `w' = sqrt((1 + w) / 2)`, `w = rho / (1 - rho)`, reads the same radius as the plain layout on an off-centre box with touch offsets and four different shoulders.
 * 3. A different median fullness moves the curve: raising one median's fullness by 0.1 changes the radius inside that quarter and leaves the opposite quarter's untouched.
 * 4. A mirror layout is symmetric in the median line: the radius at `phi` equals the radius at `-phi`, and its chain has the listed anchors and their reflections.
 * 5. A share outside (0, 1) is confined inside the model, and a shoulder past the fair bound is held at it: shoulders of 1.5 and 0.9 yield the chain with the shoulder at 0.85, and a shoulder of 0.8 is kept.
 * 6. A guide on its box corner is held back: with the forward extreme's touch offset equal to the side support, the chain is still admitted and the guide stands below the corner on its own support line.
 * 7. The bilateral helper reads the ellipse: `bilateral(0)` on the ellipse's half with the ellipse shoulder, and `bilateral(1)` with every median at that shoulder and every half shoulder from rational subdivision, are the ellipse at every phase; `bilateral(1)` has 10 fields where `limb(1)` has 20.
 * 8. `continuous` makes the curvature continuous at a median: on f1's trunk section over the hips the polar curve's one-sided curvatures at its first median differ more than twentyfold as stored and agree within 3 % after, with every anchor in place.
 * 9. A feature anchor (`f`) stands where its numbers put it with its own tangent: on the ellipse, at its point of parameter 45 degrees with the ellipse's tangent there, read on the chord of its frame (share, outward offset, turn from the chord), its fields are a share, mm and an angle, the chain is admitted and the resolved anchor is that point and direction.
 * 10. Feature anchors keep their order wherever their frame moves: two features after the forward extreme with fixed numbers stay admitted with rising phases while the side extreme stands at four places.
 * 11. The features of a run share one chord: moving the first off it, or turning it, leaves the second where it was.
 * 12. The lens layout reads an ellipse 6 by 40 mm, its length along `v`, from its faces' extremes on the median line and its ends' extremes, with its four guides in order.
 * 13. A least per arc holds only its own arc: on the ellipse's box with every stored shoulder 0.2, a layout listing least shoulders 0.3, 0, 0.25 and 0 reads its chain's shoulders as 0.3, 0.2, 0.25 and 0.2, and a layout with the one least 0.3 reads all four as 0.3; `continuous` at a side extreme keeps each of its two arcs at or above that arc's own least.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanConicSection.chain`, `resolve`, `limb`, `bilateral` and `units` and reads the resulting engine chain with `AutoMovieViewChain.radius`.
 * @evidence contracts/development/testing.md#independent-expectations The ellipse's polar radius `1 / sqrt((cos / a)^2 + (sin / b)^2)` is a closed form; the subdivision weights are Farin's rational de Casteljau step at `t = 1/2` with end weights renormalised, a property of conics independent of this code; mirror symmetry is a geometric identity.
 * @evidence contracts/development/testing.md#distinguishing-cases A centred symmetric box, an off-centre box with touch offsets and unequal shoulders, a perturbed median that must change one quarter only, a bilateral layout, and an out-of-range share.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit on made numbers, reached by `--include human_conic_section`, with no reference body, loft or figure.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario with the closed form or identity it is checked against.
 */
export function test_human_conic_section(): void {
  const failures: string[] = [];
  const S = AutoMovieHumanConicSection;
  const radius = (values: number[], layout: AutoMovieHumanConicSection.ILayout, phi: number): number => AutoMovieViewChain.radius(S.chain(values, layout), phi);
  const phases: number[] = Array.from({ length: 72 }, (_: unknown, k: number): number => (2 * Math.PI * (k + 0.37)) / 72);

  // 1. Ellipse: extremes (40, 0), (0, 25), (-40, 0), (0, -25) and the ellipse shoulder on every quarter.
  const ellipse: number[] = [40, 0, 0, 25, -40, 0, 0, -25, ...new Array<number>(4).fill(Math.SQRT2 - 1)];
  for (const phi of phases) {
    const expected: number = 1 / Math.hypot(Math.cos(phi) / 40, Math.sin(phi) / 25);
    const actual: number = radius(ellipse, S.limb(0), phi);
    if (!(Math.abs(actual - expected) <= 1e-9)) failures.push(`ellipse at ${phi.toFixed(3)}: radius ${actual}, expected ${expected}`);
  }

  // 2. Exact subdivision: an asymmetric section and its split form read the same radius.
  const rhos: number[] = [0.31, 0.47, 0.55, 0.4];
  const plain: number[] = [38, 6, -4, 27, -45, -3, 5, -22, ...rhos];
  const split: number[] = [];
  const halves: number[] = [];
  for (let q: number = 0; q < 4; ++q) {
    const w: number = Math.sqrt((1 + rhos[q]! / (1 - rhos[q]!)) / 2);
    split.push(plain[2 * q]!, plain[2 * q + 1]!, rhos[q]!);
    halves.push(w / (1 + w), w / (1 + w));
  }
  split.push(...halves);
  if (S.units(S.limb(1)).length !== split.length) failures.push(`split limb layout has ${S.units(S.limb(1)).length} fields, expected ${split.length}`);
  for (const phi of phases) {
    const a: number = radius(plain, S.limb(0), phi);
    const b: number = radius(split, S.limb(1), phi);
    if (!(Math.abs(a - b) <= 1e-9)) failures.push(`subdivision at ${phi.toFixed(3)}: split radius ${b}, plain radius ${a}`);
  }

  // 3. A fuller first median bulges its own quarter only.
  const fuller: number[] = [...split];
  fuller[2] = rhos[0]! + 0.1;
  const inside: number = radius(fuller, S.limb(1), 0.8) - radius(split, S.limb(1), 0.8);
  const opposite: number = radius(fuller, S.limb(1), 0.8 + Math.PI) - radius(split, S.limb(1), 0.8 + Math.PI);
  if (!(inside > 0.5)) failures.push(`fuller median: its quarter moved by ${inside} mm, expected more than 0.5`);
  if (opposite !== 0) failures.push(`fuller median: the opposite quarter moved by ${opposite} mm, expected 0`);

  // 4. Bilateral layout: front median, side extreme, back median, reflected.
  const bilateral: AutoMovieHumanConicSection.ILayout = { mirror: true, anchors: [{ kind: "u", mid: true, guide: true }, { kind: "v", guide: true }, { kind: "u", mid: true, guide: true }] };
  const body: number[] = [60, 5, 80, -50, 0.42, 0.38];
  const resolved: AutoMovieHumanConicSection.IChain = S.resolve(body, bilateral);
  if (resolved.input.points.length !== 4) failures.push(`bilateral chain has ${resolved.input.points.length} points, expected 4`);
  if (resolved.guides.join(",") !== "0,1,2,3") failures.push(`bilateral guides are ${resolved.guides.join(",")}, expected 0,1,2,3`);
  for (const phi of phases.filter((p: number): boolean => p < Math.PI)) {
    const left: number = radius(body, bilateral, phi);
    const right: number = radius(body, bilateral, -phi);
    if (!(Math.abs(left - right) <= 1e-9)) failures.push(`bilateral at ${phi.toFixed(3)}: ${left} against ${right} at the mirrored phase`);
  }

  // 5. An out-of-range shoulder, and one past the fair bound, are the bounded one; a shoulder under the bound is kept.
  const wild: number[] = [...ellipse];
  wild[8] = 1.5;
  const fair: number[] = [...ellipse];
  fair[8] = 0.9;
  const bounded: number[] = [...ellipse];
  bounded[8] = 0.85;
  const chain: AutoMovieViewChain.ISection = S.chain(wild, S.limb(0));
  if (chain.fault !== null) failures.push(`out-of-range shoulder: chain refused with ${chain.fault}`);
  else if (!(Math.abs(AutoMovieViewChain.radius(chain, 0.7) - radius(bounded, S.limb(0), 0.7)) <= 1e-12)) failures.push("out-of-range shoulder: not equal to the chain at the model's fair bound 0.85");
  if (!(Math.abs(radius(fair, S.limb(0), 0.7) - radius(bounded, S.limb(0), 0.7)) <= 1e-12)) failures.push("shoulder 0.9: not held at the fair bound 0.85");
  const under: number[] = [...ellipse];
  under[8] = 0.8;
  if (!(Math.abs(radius(under, S.limb(0), 0.7) - radius(bounded, S.limb(0), 0.7)) > 1e-3)) failures.push("shoulder 0.8: moved to the fair bound though it is under it");

  // 6. A guide on its box corner: the forward extreme's touch offset equals the side support, which leaves the first arc no leg unless the model holds the guide back.
  const diamond: number[] = [40, 25, 0, 25, -40, 0, 0, -25, ...new Array<number>(4).fill(0.4)];
  const cornered: AutoMovieViewChain.ISection = S.chain(diamond, S.limb(0));
  if (cornered.fault !== null) failures.push(`guide on the corner: chain refused with ${cornered.fault}`);
  else {
    const held: AutoMovieHumanConicSection.P = S.resolve(diamond, S.limb(0)).input.points[0]!;
    if (!(held[0] === 40 && held[1] < 25 && held[1] > 20)) failures.push(`guide on the corner: resolved at (${held[0]}, ${held[1]}), expected u 40 and v held below the corner's 25`);
  }

  // 7. The bilateral helper: the ellipse's half at depth 0, and at depth 1 the same curve split at every arc's median in half the fields of `limb(1)`.
  const rho: number = Math.SQRT2 - 1;
  const w: number = Math.sqrt((1 + rho / (1 - rho)) / 2);
  const half: number[] = [40, 0, 25, -40, rho, rho];
  const halved: number[] = [40, rho, 0, 25, rho, -40, ...new Array<number>(4).fill(w / (1 + w))];
  if (S.units(S.bilateral(1)).length !== 10 || S.units(S.limb(1)).length !== 20) failures.push(`bilateral(1) has ${S.units(S.bilateral(1)).length} fields and limb(1) ${S.units(S.limb(1)).length}, expected 10 and 20`);
  for (const phi of phases) {
    const expected: number = 1 / Math.hypot(Math.cos(phi) / 40, Math.sin(phi) / 25);
    for (const [depth, values] of [[0, half], [1, halved]] as const) {
      const actual: number = radius([...values], S.bilateral(depth), phi);
      if (!(Math.abs(actual - expected) <= 1e-9)) failures.push(`bilateral(${depth}) ellipse at ${phi.toFixed(3)}: radius ${actual}, expected ${expected}`);
    }
  }

  // 8. Curvature made continuous at a median: on f1's trunk section over the hips (bilateral(1), the front arc at 0.85 and the side arc at
  // 0.26), the polar curve's one-sided curvatures at the first median differ a hundredfold; after `continuous` they agree, and the median
  // point and both extremes stay where they were.
  const hip: number[] = [132.86, 0.6497, 41.98, 192.38, 0.5433, -86.77, 0.85, 0.261, 0.3327, 0.8603];
  const smooth: number[] = S.continuous(hip, S.bilateral(1), 1);
  const sided = (values: number[], at: number, sign: 1 | -1): number => {
    // The curvature of the polar curve r(phi) from points on one side only: r' and r'' by one-sided differences of second order.
    const h: number = 1e-4;
    const r = (k: number): number => radius(values, S.bilateral(1), at + sign * k * h);
    const [r0, r1, r2, r3]: number[] = [r(0), r(1), r(2), r(3)];
    const d1: number = (sign * (-3 * r0! + 4 * r1! - r2!)) / (2 * h);
    const d2: number = (2 * r0! - 5 * r1! + 4 * r2! - r3!) / (h * h);
    return (r0! * r0! + 2 * d1 * d1 - r0! * d2) / (r0! * r0! + d1 * d1) ** 1.5;
  };
  const median: AutoMovieHumanConicSection.P = S.resolve(hip, S.bilateral(1)).input.points[1]!;
  const at: number = Math.atan2(median[1], median[0]);
  const [before, after]: number[] = [sided(hip, at, -1), sided(hip, at, 1)];
  const [smoothBefore, smoothAfter]: number[] = [sided(smooth, at, -1), sided(smooth, at, 1)];
  if (!(Math.max(before!, after!) > 20 * Math.min(before!, after!))) failures.push(`hip median as stored: curvatures ${before} and ${after}, expected a jump`);
  if (!(Math.abs(smoothBefore! - smoothAfter!) <= 0.03 * Math.max(smoothBefore!, smoothAfter!))) failures.push(`hip median made continuous: curvatures ${smoothBefore} and ${smoothAfter}, expected equal`);
  const moved: AutoMovieHumanConicSection.P = S.resolve(smooth, S.bilateral(1)).input.points[1]!;
  if (!(moved[0] === median[0] && moved[1] === median[1]) || smooth.slice(0, 6).some((x: number, k: number): boolean => x !== hip[k])) failures.push("hip median made continuous: an anchor moved");

  // 9. A feature anchor stands where its numbers put it, with its own tangent: on the ellipse of scenario 1, a feature between the forward
  // and the side extreme at the ellipse's point of parameter 45 degrees, its tangent the ellipse's there. Its numbers are read on the chord
  // from (40, 0) to (0, 25) by plane geometry: the share of the point's projection on it, the distance square to it on its right (outward),
  // and the tangent's angle from the chord's direction. Its fields are a share, mm and an angle, the chain is admitted, and the resolved
  // anchor is that point and that direction.
  const featured: AutoMovieHumanConicSection.ILayout = { mirror: false, anchors: [S.limb(0).anchors[0]!, { kind: "f", feature: "convex" }, ...S.limb(0).anchors.slice(1)] };
  const at45: [number, number] = [40 * Math.SQRT1_2, 25 * Math.SQRT1_2];
  const heading: number = Math.atan2(25 * Math.SQRT1_2, -40 * Math.SQRT1_2);
  const chordLength: number = Math.hypot(40, 25);
  const share: number = ((at45[0] - 40) * -40 + at45[1] * 25) / (chordLength * chordLength);
  const offset: number = ((at45[0] - 40) * 25 - at45[1] * -40) / chordLength;
  const withFeature: number[] = [40, 0, share, offset, heading - Math.atan2(25, -40), 0, 25, -40, 0, 0, -25, ...new Array<number>(5).fill(0.4)];
  const featureUnits: string = S.units(featured).slice(2, 5).join(",");
  if (featureUnits !== "share,mm,angle") failures.push(`feature anchor fields: ${featureUnits}, expected share,mm,angle`);
  const resolvedFeature: AutoMovieHumanConicSection.IChain = S.resolve(withFeature, featured);
  const point: number[] = resolvedFeature.input.points[1]! as number[];
  const tangent: number[] = resolvedFeature.input.tangents[1]! as number[];
  if (!(Math.hypot(point[0]! - at45[0], point[1]! - at45[1]) <= 1e-12)) failures.push(`feature anchor at ${point.join(",")}, expected ${at45.join(",")}`);
  if (!(Math.abs(Math.atan2(tangent[1]!, tangent[0]!) - heading) <= 1e-12)) failures.push(`feature anchor heading ${Math.atan2(tangent[1]!, tangent[0]!)}, expected ${heading}`);
  if (S.chain(withFeature, featured).fault !== null) failures.push(`feature chain refused: ${S.chain(withFeature, featured).fault}`);

  // 10. Features keep their order wherever their frame moves: two features in a row after the forward extreme, read on the ellipse of
  // scenario 1 at its parameters 30 and 60 degrees with its tangents there (each on its own frame's chord as in 9, rounded), keep the same
  // numbers while the side extreme stands at (0, 25), (0, 18), (-6, 40) and (12, 30). Each chain is admitted and its anchors' phases rise round the course, as a fading feature's lines need where a section's
  // stretch between two extremes shrinks or swings (free chart coordinates held fixed would stand outside that stretch).
  const run: AutoMovieHumanConicSection.ILayout = { mirror: false, anchors: [S.limb(0).anchors[0]!, { kind: "f", feature: "inflection" }, { kind: "f", feature: "concave" }, ...S.limb(0).anchors.slice(1)] };
  for (const side of [[0, 25], [0, 18], [-6, 40], [12, 30]] as const) {
    const values: number[] = [40, 0, 0.2375, 7.74, -0.267, 0.4791, 7.76, 0.213, side[0], side[1], -40, 0, 0, -25, ...new Array<number>(6).fill(0.4)];
    const fault: string | null = S.chain(values, run).fault;
    if (fault !== null) failures.push(`features with the side extreme at (${side.join(", ")}): chain refused: ${fault}`);
    const phases: number[] = S.resolve(values, run).input.points.slice(0, 4).map((p: AutoMovieHumanConicSection.P): number => Math.atan2(p[1], p[0]));
    if (!phases.every((phi: number, k: number): boolean => k === 0 || phi > phases[k - 1]!)) failures.push(`features with the side extreme at (${side.join(", ")}): phases ${phases.map((x: number): string => x.toFixed(3)).join(", ")} do not rise`);
  }
  // 11. Both features of a run stand on one chord, the extremes either side of the run: moving the first one off the chord (its offset by
  // 0.1 mm) or turning its tangent (by 0.01 rad) leaves the second exactly where it was.
  {
    const values: number[] = [40, 0, 0.2375, 7.74, -0.267, 0.4791, 7.76, 0.213, 0, 25, -40, 0, 0, -25, ...new Array<number>(6).fill(0.4)];
    const second = (v: number[]): AutoMovieHumanConicSection.P => S.resolve(v, run).input.points[2]!;
    const kept: AutoMovieHumanConicSection.P = second(values);
    for (const [field, by] of [[3, 0.1], [4, 0.01]] as const) {
      const moved: number[] = [...values];
      moved[field] = moved[field]! + by;
      const p: AutoMovieHumanConicSection.P = second(moved);
      if (!(p[0] === kept[0] && p[1] === kept[1])) failures.push(`moving the first feature's field ${field} moved the second from (${kept.join(", ")}) to (${p.join(", ")})`);
    }
  }

  // 12. The lens layout: its faces' extremes on the median line, one number each, and its ends' extremes free. An ellipse 6 by 40 mm
  // (half extents 3 and 20, its length along v) with the ellipse shoulder reads `(u / 3)^2 + (v / 20)^2 = 1` at every phase from its
  // six numbers and four shoulders, and its four guides are its anchors in order.
  const lens: AutoMovieHumanConicSection.ILayout = S.lens(0);
  const thin: number[] = [3, 0, 20, -3, 0, -20, ...new Array<number>(4).fill(Math.SQRT2 - 1)];
  if (S.units(lens).length !== thin.length) failures.push(`lens(0) has ${S.units(lens).length} fields, expected ${thin.length}`);
  else {
    if (S.resolve(thin, lens).guides.join(",") !== "0,1,2,3") failures.push(`lens(0) guides are ${S.resolve(thin, lens).guides.join(",")}, expected 0,1,2,3`);
    for (const phi of phases) {
      const expected: number = 1 / Math.hypot(Math.cos(phi) / 3, Math.sin(phi) / 20);
      const actual: number = radius(thin, lens, phi);
      if (!(Math.abs(actual - expected) <= 1e-9)) failures.push(`lens ellipse at ${phi.toFixed(3)}: radius ${actual}, expected ${expected}`);
    }
  }

  // 13. A least per arc: the bound is the larger of the stored shoulder and that arc's own least (`ILayout.least`), so with every stored
  // shoulder at 0.2 the arcs read the listed least where it is larger and 0.2 elsewhere; one number holds every arc.
  {
    const flat: number[] = [40, 0, 0, 25, -40, 0, 0, -25, ...new Array<number>(4).fill(0.2)];
    const perArc: AutoMovieHumanConicSection.ILayout = { ...S.limb(0), least: [0.3, 0, 0.25, 0] };
    const read: number[] = S.resolve(flat, perArc).input.shoulders.map((x: number): number => Math.round(x * 1e9) / 1e9);
    if (read.join(",") !== "0.3,0.2,0.25,0.2") failures.push(`a least per arc read shoulders ${read.join(",")}, expected 0.3,0.2,0.25,0.2`);
    const whole: number[] = S.resolve(flat, { ...S.limb(0), least: 0.3 }).input.shoulders.map((x: number): number => Math.round(x * 1e9) / 1e9);
    if (whole.join(",") !== "0.3,0.3,0.3,0.3") failures.push(`one least read shoulders ${whole.join(",")}, expected 0.3,0.3,0.3,0.3`);
    // At the side extreme (anchor 1) the arcs before and after it are arcs 0 and 1, held at 0.3 and 0.
    const matched: number[] = S.continuous(flat, perArc, 1);
    if (!(matched[8]! >= 0.3 - 1e-12)) failures.push(`continuous at anchor 1 set arc 0 to ${matched[8]}, under its least 0.3`);
    if (!(matched[9]! >= 0.03 - 1e-12 && matched[9]! < 0.3)) failures.push(`continuous at anchor 1 set arc 1 to ${matched[9]}, expected its own bound, not arc 0's 0.3`);
  }

  if (failures.length > 0) throw new Error("human conic section:\n" + failures.join("\n"));
}
