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
 * 5. A share outside (0, 1) is confined inside the model: a shoulder of 1.5 yields an admitted chain equal to the one with the shoulder at the model's bound.
 * 6. A guide on its box corner is held back: with the forward extreme's touch offset equal to the side support, the chain is still admitted and the guide stands below the corner on its own support line.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanConicSection.chain`, `resolve`, `limb` and `units` and reads the resulting engine chain with `AutoMovieViewChain.radius`.
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

  // 5. An out-of-range shoulder is the bounded one.
  const wild: number[] = [...ellipse];
  wild[8] = 1.5;
  const bounded: number[] = [...ellipse];
  bounded[8] = 0.97;
  const chain: AutoMovieViewChain.ISection = S.chain(wild, S.limb(0));
  if (chain.fault !== null) failures.push(`out-of-range shoulder: chain refused with ${chain.fault}`);
  else if (!(Math.abs(AutoMovieViewChain.radius(chain, 0.7) - radius(bounded, S.limb(0), 0.7)) <= 1e-12)) failures.push("out-of-range shoulder: not equal to the chain at the model's bound 0.97");

  // 6. A guide on its box corner: the forward extreme's touch offset equals the side support, which leaves the first arc no leg unless the model holds the guide back.
  const diamond: number[] = [40, 25, 0, 25, -40, 0, 0, -25, ...new Array<number>(4).fill(0.4)];
  const cornered: AutoMovieViewChain.ISection = S.chain(diamond, S.limb(0));
  if (cornered.fault !== null) failures.push(`guide on the corner: chain refused with ${cornered.fault}`);
  else {
    const held: AutoMovieHumanConicSection.P = S.resolve(diamond, S.limb(0)).input.points[0]!;
    if (!(held[0] === 40 && held[1] < 25 && held[1] > 20)) failures.push(`guide on the corner: resolved at (${held[0]}, ${held[1]}), expected u 40 and v held below the corner's 25`);
  }

  if (failures.length > 0) throw new Error("human conic section:\n" + failures.join("\n"));
}
