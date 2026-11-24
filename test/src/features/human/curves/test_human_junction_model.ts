import { AutoMovieConstructionSplitCompose, AutoMovieLoftFrame, AutoMovieLoftViewFullSource, AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection } from "@automovie/human";
import type { AutoMovieVector3Tuple, IAutoMovieHumanConicLoft, IAutoMovieViewChain } from "@automovie/interface";

import { FamilyConicJunction } from "../../../reference-conics/FamilyConicJunction";

/**
 * The junction model the fairing fit reads instead of declaring and lofting (joints-one-shot.md, "2026-11-23: the fairing fit's cost,
 * measured, and its redesign").
 *
 * The made junction: four round tubes along `+X`, radii 4, 4.5, 5 and 4.5 mm, their courses at `y = 0` and `z` -12, -4, 4 and 12 mm,
 * from `x = -10` to `x = 30`; the end plane `x = 0`. A tube's section is four conics on a `limb(1)` box with the circle's shoulder and
 * rho, so its rings are circles.
 *
 * Scenarios:
 * 1. Every ring and guide line point equals the full loft's (`AutoMovieHumanConicLoft.part`, `AutoMovieLoftViewFullSource`) at the
 *    same station and phase within 1e-9 mm.
 * 2. Each cut by the end plane is its tube's circle there: every point at its radius from the course within 1e-9 mm.
 * 3. A reading reads one section per distinct station of each member and nothing else: the provider's count equals the stations'.
 * 4. Neighbouring cuts 8 mm apart with radii 4 and 4.5 overlap and cross twice; cuts 16 mm apart do not cross.
 * 5. The composed outline of two overlapping circles: a host point's distance to it, on a kept arc and on a segment its fork clips.
 * 6. Seam nesting (`FamilyConicJunction.seams`) against `AutoMovieConstructionSplitCompose.derive` on three made tubes and a host tube:
 *    centres (0, -8), (0, 0), (0, 8) in the end plane, the outer two leaning 0.2 rad outward, on a host of radius 14, give parallel
 *    chords that nest; centres (-7, -6), (0, 0), (-7, 6), the outer two leaning 0.15 rad away from the middle one, on a host of radius
 *    13 about (-3, 0), give chords that cross at about (-6, 0), inside the ring, and do not nest. Both verdicts agree with derive's, and
 *    where derive forms seams their phases agree within 0.01 rad.
 * 7. Cross, not nest (`FamilyConicJunction.depths`): a circle inside another and two crossing circles; the overlap and non-containment
 *    rows hold exactly when the circles cross twice, and the least depths equal their closed forms within 1e-3 mm.
 * 8. The rail wedge (`FamilyConicJunction.wedge`): lines along +X under an end plane and a seam plane moved by a 2 mm rail give the
 *    closed-form depth `min(max x - 2, 1 - y)`, positive where the skin enters and negative where it never does.
 * 9. One overlap interval (`FamilyConicJunction.secondRun`): an ellipse crossing a circle four times gives a positive row, two circles
 *    crossing twice a row at most zero, as the crossing counts say.
 * 10. Transversality (`IRead.crossing`): a tube leaning 0.2 rad crosses the end plane at the rate cos 0.2 at every phase, within 1e-6.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `FamilyConicJunction.read`, `crossings`, `inside` and `nearest` on made tubes.
 * @evidence contracts/development/testing.md#independent-expectations The loft at a station is the expectation for the rings; a straight round tube's cut by a plane square to it is its circle; two circles closer than their radii' sum cross twice.
 * @evidence contracts/development/testing.md#distinguishing-cases A ring read off its station's frame, a cut read at the wrong station, or a reading that builds any section twice or reads another source fails a scenario.
 * @evidence contracts/development/testing.md#execution-ownership Made tubes only.
 * @evidence contracts/development/common.md#meaningful-documentation Names the made junction and each expectation.
 */
export function test_human_junction_model(): void {
  const failures: string[] = [];
  type V = AutoMovieVector3Tuple;
  const ring = (r: number): number[] => [r, 0, Math.SQRT2 - 1, 0, r, Math.SQRT2 - 1, -r, 0, Math.SQRT2 - 1, 0, -r, Math.SQRT2 - 1];
  const rho: number = 1 / (1 + 1 / Math.cos(Math.PI / 8));
  const tube = (name: string, z: number, r: number): IAutoMovieHumanConicLoft.IFamily => {
    const field: number[] = [...ring(r), ...Array.from({ length: 8 }, (): number => rho)];
    return { name, centres: [[-10, 0, z], [30, 0, z]], halves: [], up: [0, 1, 0], layout: AutoMovieHumanConicSection.limb(1),
      knots: [0, 20, 40], values: field.map((x: number): number[] => [x, x, x]) };
  };
  const tubes = [tube("a", -12, 4), tube("b", -4, 4.5), tube("c", 4, 5), tube("d", 12, 4.5)];
  const plane: FamilyConicJunction.IPlane = { origin: [0, 0, 0], x: [0, 1, 0], y: [0, 0, 1], z: [1, 0, 0] };
  const phases: number[] = Array.from({ length: 48 }, (_, k: number): number => (2 * Math.PI * k) / 48);
  const rings: number[] = [10, 12, 14, 16], lines: number[] = [10, 12, 14, 16, 18, 20], bracket: number[] = [6, 8, 12, 14];
  const provider = FamilyConicJunction.sections();
  const counted: FamilyConicJunction.ISections & { count: number } = {
    count: 0,
    prepare: (family: IAutoMovieHumanConicLoft.IFamily): ((station: number) => IAutoMovieViewChain.ISection) => {
      const sectionAt = provider.prepare(family);
      return (station: number): IAutoMovieViewChain.ISection => { ++counted.count; return sectionAt(station); };
    },
  };
  const reads = tubes.map((family) => FamilyConicJunction.read({ face: family.name, family, rings, lines, phases,
    guides: [0, Math.PI / 2, Math.PI, 1.5 * Math.PI], bracket, cut: phases }, plane, counted));

  const all: number[] = [...new Set([...rings, ...lines, ...bracket])].sort((x, y) => x - y);
  tubes.forEach((family, i: number): void => {
    const view = AutoMovieHumanConicLoft.part(family, all, false);
    const loft = AutoMovieLoftViewFullSource.create(view);
    const close = (p: V, q: readonly number[], what: string): void => {
      const gap: number = Math.hypot(p[0] - q[0]!, p[1] - q[1]!, p[2] - q[2]!);
      if (!(gap <= 1e-9)) failures.push(`${family.name} ${what} stands ${gap} mm off the loft`);
    };
    rings.forEach((s, j) => phases.forEach((phi, k) => close(reads[i]!.rings[j]![k]!, loft.point(s, phi), `ring ${s} phase ${k}`)));
    [0, Math.PI / 2, Math.PI, 1.5 * Math.PI].forEach((phi, g) => lines.forEach((s, j) => close(reads[i]!.lines[g]![j]!, loft.point(s, phi), `line ${g} station ${s}`)));
    const z: number = family.centres[0]![2], r: number = family.values[0]![0]!;
    reads[i]!.cut.forEach((p, k): void => {
      if (p === null) { failures.push(`${family.name} cut phase ${k} misses the plane`); return; }
      const radius: number = Math.hypot(p[0], p[1] - z);
      if (!(Math.abs(radius - r) <= 1e-9)) failures.push(`${family.name} cut phase ${k} stands at ${radius}, not ${r}`);
    });
  });
  if (counted.count !== tubes.length * all.length)
    failures.push(`the reading made ${counted.count} sections, not ${tubes.length * all.length} (one per member and distinct station)`);

  const cut = (i: number): [number, number][] => reads[i]!.cut.filter((p): p is [number, number] => p !== null);
  if (FamilyConicJunction.crossings(cut(0), cut(1)) !== 2) failures.push("neighbouring cuts 8 mm apart do not cross twice");
  if (FamilyConicJunction.crossings(cut(0), cut(2)) !== 0) failures.push("cuts 16 mm apart cross");
  // The origin stands 4 mm from the third cut's centre, inside its 5 mm circle, 1 mm from its boundary (less the 48-gon's chord
  // sagitta, 5 (1 - cos(pi / 48)) = 0.011 mm, at most).
  if (!FamilyConicJunction.inside([0, 0], cut(2))) failures.push("the origin is not inside the third cut");
  const gap = FamilyConicJunction.nearest([0, 0], cut(2));
  if (!(Math.abs(gap.distance - 1) <= 0.011)) failures.push(`the third cut's boundary stands ${gap.distance} mm from the origin, not 1`);
  // 5. The composed outline of two overlapping circles, radius 5 about (0, 0) and (6, 0), forks at (3, +-4), each sampled at 720 points
  // (chord sagitta 5 (1 - cos(pi / 720)) = 4.8e-5 mm): a host point's distance is to the union's boundary. (-8, 0): 3, on the first
  // circle; (3, 9): sqrt(90) - 5, on the first circle's kept arc; (3, 4.02), 0.02 mm above the fork on the bisector:
  // sqrt(9 + 4.02^2) - 5, its foot 0.01 mm from the fork, on a segment the fork clips.
  const circle = (cx: number): ([number, number] | null)[] => Array.from({ length: 720 }, (_, k: number): [number, number] =>
    [cx + 5 * Math.cos((2 * Math.PI * k) / 720), 5 * Math.sin((2 * Math.PI * k) / 720)]);
  const segments = FamilyConicJunction.outline([circle(0), circle(6)]);
  for (const [h, expected] of [[[-8, 0], 3], [[3, 9], Math.sqrt(90) - 5], [[3, 4.02], Math.sqrt(9 + 4.02 * 4.02) - 5]] as [[number, number], number][]) {
    const near = FamilyConicJunction.onOutline(h, segments);
    if (!(Math.abs(near.distance - expected) <= 1e-4)) failures.push(`the host point (${h.join(", ")}) stands ${near.distance} mm from the composed outline, not ${expected}`);
  }
  const fork = FamilyConicJunction.onOutline([3, 4.02], segments).segment;
  if (fork === null || !(fork.from > 0 || fork.to < 1)) failures.push("the point nearest the fork is not on a segment clipped at the fork");

  // 6. Seam nesting against the split's own derivation: three tubes cut by the end plane, each through its point of the plane and leaning
  // from the plane's normal by its angle toward its in-plane direction, the host a straight tube ending in the plane. The seams' chords
  // are where the seam planes meet the end plane, and the host's ring lies in it, so the verdict is the chords': parallel chords nest,
  // chords that cross inside the ring interleave their arcs and do not.
  const leaning = (name: string, at: [number, number], lean: number, toward: [number, number], r: number): IAutoMovieHumanConicLoft.IFamily => {
    const e: V = [Math.cos(lean), Math.sin(lean) * toward[0], Math.sin(lean) * toward[1]];
    return { ...tube(name, 0, r), centres: [[-10 * e[0], at[0] - 10 * e[1], at[1] - 10 * e[2]], [30 * e[0], at[0] + 30 * e[1], at[1] + 30 * e[2]]] };
  };
  const physical = (family: IAutoMovieHumanConicLoft.IFamily, stations: number[], top: boolean) => {
    const { chain, surface, diagnostics } = AutoMovieViewLoft.create(AutoMovieHumanConicLoft.part(family, stations, false));
    if (chain === null || surface?.domain === undefined) throw new Error(family.name + ": " + diagnostics.map((row) => row.detail).join(", "));
    const layer = chain.layers[top ? chain.layers.length - 1 : 0]!;
    const basis = AutoMovieConstructionSplitCompose.basis(layer.frame ?? AutoMovieLoftFrame.horizontal(layer.y), 1);
    if (basis === null) throw new Error(family.name + " has no end frame");
    return { surface, station: layer.y, basis, stations: chain.layers.map((row) => row.y) };
  };
  const nesting = (label: string, specs: [[number, number], number, [number, number], number][], hostAt: [number, number], hostR: number, expected: boolean): void => {
    const count: number = 48;
    const kids = specs.map(([at, lean, toward, r], i: number) => leaning("c" + i, at, lean, toward, r));
    const host: IAutoMovieHumanConicLoft.IFamily = { ...tube("host", 0, hostR), centres: [[-20, hostAt[0], hostAt[1]], [0, hostAt[0], hostAt[1]]], knots: [0, 10, 20] };
    const own = FamilyConicJunction.sections();
    const cutPhases: number[] = Array.from({ length: count }, (_, k: number): number => (2 * Math.PI * k) / count);
    const read = kids.map((family) => FamilyConicJunction.read({ face: family.name, family, rings: [], lines: [], phases: [], guides: [],
      bracket: [6, 8, 12, 14], cut: cutPhases }, plane, own));
    const hostRing = FamilyConicJunction.read({ face: "host", family: host, rings: [20], lines: [], guides: [], bracket: [], cut: [],
      phases: Array.from({ length: 8 * count }, (_, k: number): number => (2 * Math.PI * k) / (8 * count)) }, plane, own).rings[0]!;
    const mine = FamilyConicJunction.seams({ plane, cuts: read.map((r) => r.cut), axes: read.map((r) => r.axis), host: hostRing });
    const children = kids.map((family) => ({ ...physical(family, [6, 8, 10, 12, 14, 20, 30, 40], false), name: family.name, into: 1 as const, rail: 10 }));
    const theirs = AutoMovieConstructionSplitCompose.derive({ compose: { frame: "tree", plane: { point: [0, 0, 0], normal: [1, 0, 0] } },
      host: physical(host, [0, 5, 10, 15, 20], true), children, count });
    if (mine.refusal !== null) { failures.push(`${label}: the junction refused its seams: ${mine.refusal}`); return; }
    if (mine.nested !== expected) failures.push(`${label}: the junction's seams ${expected ? "do not nest" : "nest"}, margins ${JSON.stringify(mine.margins)}`);
    const enclosed: boolean = typeof theirs !== "string" || !theirs.includes("do not enclose");
    // A refusal after the seams (the host ring's distance, a boundary, a valley or a rail) leaves the nesting verdict standing.
    if (typeof theirs === "string" && enclosed && !/composed outline|in the composition|cut by seam|'s rail:|coincide|along its chord/.test(theirs))
      failures.push(`${label}: derive refused before its seams: ${theirs}`);
    if (enclosed !== mine.nested) failures.push(`${label}: derive ${enclosed ? "nests" : "does not nest"} the seams, the junction ${mine.nested ? "does" : "does not"}`);
    // The phases agree within 0.01 rad: the junction's forks are its 48-gons' crossings, off the curves' by their sagitta,
    // 5 (1 - cos(pi / 48)) = 0.011 mm, which on a ring of radius 13 or 14 mm moves a phase by under 1e-3 rad.
    if (typeof theirs !== "string") theirs.seams.forEach(([a, b], j: number): void => {
      const [x, y] = mine.seams[j]!;
      if (!(Math.abs(a - x) <= 0.01 && Math.abs(b - y) <= 0.01)) failures.push(`${label}: seam ${j} at [${x}, ${y}] against derive's [${a}, ${b}]`);
    });
  };
  // 7. Cross, not nest: circles of 720 points. Radius 2 about (1, 0) inside radius 5 about the origin: no crossing, the inner circle's
  // least depth in the outer 5 - (1 + 2) = 2 > 0 (the non-containment row violated), the outer's in the inner -(5 - (2 - 1)) = -4
  // (the outer's farthest point (-5, 0) from the inner circle's boundary). Radius 5 about (0, 0) and (6, 0): two crossings, each's
  // least depth in the other -(11 - 5) = -6, at its far point, and the deepest 5 - 1 = 4, at the other's near point. The rows hold
  // (deepest > 0 and least <= 0 both ways) exactly when the cuts cross twice; within 1e-3 mm, the 720-gons' sagitta.
  const ring720 = (cx: number, r: number): [number, number][] => Array.from({ length: 720 }, (_, k: number): [number, number] =>
    [cx + r * Math.cos((2 * Math.PI * k) / 720), r * Math.sin((2 * Math.PI * k) / 720)]);
  for (const [label, A, B, crossings, expected] of [
    ["contained", ring720(1, 2), ring720(0, 5), 0, { inner: [2, -4] }],
    ["crossing", ring720(0, 5), ring720(6, 5), 2, { inner: [-6, -6] }],
  ] as const) {
    const n = FamilyConicJunction.crossings(A, B);
    if (n !== crossings) failures.push(`${label}: the circles cross ${n} times, not ${crossings}`);
    const ab = FamilyConicJunction.depths(A, B), ba = FamilyConicJunction.depths(B, A);
    const close = (x: number, y: number): boolean => Math.abs(x - y) <= 1e-3;
    if (!close(ab.least.depth, expected.inner[0]) || !close(ba.least.depth, expected.inner[1]))
      failures.push(`${label}: least depths ${ab.least.depth} and ${ba.least.depth}, not ${expected.inner.join(" and ")}`);
    const holds: boolean = ab.deepest.depth > 0 && ba.deepest.depth > 0 && ab.least.depth <= 0 && ba.least.depth <= 0;
    if (holds !== (n === 2)) failures.push(`${label}: the overlap and non-containment rows ${holds ? "hold" : "fail"} with ${n} crossings`);
  }
  // 8. The rail wedge (`FamilyConicJunction.wedge`): lines along +X at heights y = 0 and y = 2, points at x = 0 to 10; the end plane
  // x = 0 (normal +X) and a seam plane y = 1 (normal -Y, toward the child below it), both moved by a 2 mm rail along +X. The depth is
  // min(10 - 2, 1 - y): 1 at y = 0, and -1 at y = 2, a phase the skin never enters.
  const along = (y: number): V[] => Array.from({ length: 11 }, (_, k: number): V => [k, y, 0]);
  const depths = FamilyConicJunction.wedge([along(0), along(2)], [{ point: [0, 0, 0], normal: [1, 0, 0] }, { point: [0, 1, 0], normal: [0, -1, 0] }], [2, 0, 0]);
  if (!(Math.abs(depths[0]! - 1) <= 1e-12 && Math.abs(depths[1]! + 1) <= 1e-12)) failures.push(`the wedge depths are ${depths.join(", ")}, not 1 and -1`);
  // 9. One overlap interval: an ellipse of half axes 9 and 2 about the origin and a circle of radius 4 about the origin cross four
  // times, and the ellipse's points lie inside the circle in two runs (about phases pi/2 and 3 pi/2): the row is positive. Two circles of
  // radius 5 about (0, 0) and (6, 0) cross twice: the row is at most zero. Both agree with the crossing count.
  const ellipse: [number, number][] = Array.from({ length: 720 }, (_, k: number): [number, number] =>
    [9 * Math.cos((2 * Math.PI * k) / 720), 2 * Math.sin((2 * Math.PI * k) / 720)]);
  for (const [label, A, B] of [["four crossings", ellipse, ring720(0, 4)], ["two crossings", ring720(0, 5), ring720(6, 5)]] as const) {
    const n = FamilyConicJunction.crossings(A, B), run = FamilyConicJunction.secondRun(A, B);
    if ((run.value > 0) !== (n === 4)) failures.push(`${label}: the second-run row is ${run.value} with ${n} crossings`);
  }
  // 10. Transversality: a tube leaning 0.2 rad from the end plane's normal crosses it at the unit tangent's rate cos 0.2 at every phase.
  {
    const lean = leaning("t", [0, 0], 0.2, [0, 1], 5);
    const read = FamilyConicJunction.read({ face: "t", family: lean, rings: [], lines: [], phases: [], guides: [], bracket: [6, 8, 12, 14],
      cut: Array.from({ length: 48 }, (_, k: number): number => (2 * Math.PI * k) / 48) }, plane, FamilyConicJunction.sections());
    if (!read.crossing.every((x) => x !== null && Math.abs(x - Math.cos(0.2)) <= 1e-6))
      failures.push(`the leaning tube's crossings are not cos 0.2: ${read.crossing.slice(0, 4).join(", ")}`);
  }
  const half: number = Math.SQRT1_2;
  nesting("parallel chords", [[[0, -8], 0.2, [0, -1], 5], [[0, 0], 0, [0, 1], 5], [[0, 8], 0.2, [0, 1], 5]], [0, 0], 14, true);
  nesting("crossing chords", [[[-7, -6], 0.15, [-half, -half], 5], [[0, 0], 0, [0, 1], 5.5], [[-7, 6], 0.15, [-half, half], 5]], [-3, 0], 13, false);
  if (failures.length > 0) throw new Error("junction model:\n" + failures.join("\n"));
}
