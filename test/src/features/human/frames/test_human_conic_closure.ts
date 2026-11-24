import { FamilyConicClosure as K } from "../../../reference-conics/FamilyConicClosure";
import { FamilyConicFit as F } from "../../../reference-conics/FamilyConicFit";
import { FamilyConicLoft as L } from "../../../reference-conics/FamilyConicLoft";
import { FamilyConicRelief as H } from "../../../reference-conics/FamilyConicRelief";
import { FamilyConicSection as S } from "../../../reference-conics/FamilyConicSection";
import { AutoMovieHumanConicLoft } from "@automovie/human";
import { AutoMovieLoftViewFullSource, AutoMovieNaturalSpline as Natural, AutoMovieViewChain } from "@automovie/engine";

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
 * 4. A 10 mm square tube in a 12 mm square pocket. The kept exit leaves almost radially, and its supported collar must stay within the pocket. The same direction from the outer boundary cannot launch.
 * 5. Refusals: kept skin whose end runs back in phase (leaving clockwise) is refused, naming the exit; a tube with no radius at an
 *    end is refused.
 * 6. A square cut's synthetic right edge is the nearest cast and the outer positive radius. Omitting that edge leaves the real left cast at its analytic distance and leaves the positive radius unobserved.
 * 7. Directed open circle arcs are independently measured at two stations. An outside, synthetic sample can differ arbitrarily without changing their fitted error. One held-out station and duplicate knots cannot establish station support.
 * 8. A three-knot spline has curvature -3 at its interior knot by its tridiagonal equation. With the prefix shortened to half its length, that curvature demands the dependent exposed root value 0.75. With no prefix knot, the same nonzero curvature is incompatible with a natural boundary.
 * 9. A changed interior prefix needs its own measured interval, even when the first value was held. Exact suffix values cannot replace an authored shoulder policy or an optional cap field.
 * 10. Adding a held section out of order prevents a straight circle from lofting. Sorted replay measures it, while moving the held skin 0.6 mm remains outside the same 0.5 mm fit target.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `FamilyConicClosure.continued`, the function the fit tool closes every opening round a course with, and reads its points and refusals. It catches a closure that leaves the tube, one that comes out through the neighbour, a corner at either end, and a missing refusal.
 * @evidence contracts/development/testing.md#independent-expectations A circle's radius, the distance to a second centre, and the distance of a point from a line through the skin's end are written here without the module's cubic.
 * @evidence contracts/development/testing.md#distinguishing-cases Skin on the tube, a pair of neighbours, skin off the tube with unequal ends and unequal directions, and two refusals with distinct causes.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_conic_closure`; made numbers only.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios with their inputs and bounds.
 */
export function test_human_conic_closure(): void {
  const failures: string[] = [];
  // The old hidden-ring guard admitted this chart even though the independently registered fork was proximal to it.
  if (L.enclosesForks(3, 8, [2, 5]) === null || L.enclosesForks(2, 8, [2, 5]) === null ||
      L.enclosesForks(1, 8, [2, 5]) !== null || L.enclosesForks(1, 8, [2, 8]) === null)
    failures.push("full ring support cannot admit a material interval that excludes an independent fork");
  const parentBase: L.IStored = { name: "made.parent", centres: [[0, 0, 0], [0, 10, 0]], halves: [], up: [1, 0, 0],
    layout: S.limb(0), knots: [0, 2, 6, 10], values: [2, 0, 0, 2, -2, 0, 0, -2, ...new Array<number>(4).fill(Math.SQRT2 - 1)].map((v): number[] => [v, v, v, v]) };
  const parentLaw = L.endMaterial(parentBase, 4);
  const endTrial = parentLaw.expand(parentBase.values.map((_, i): number => i === 0 ? 2 : 0));
  const prior = L.reader(parentBase), changed = L.reader(endTrial);
  if (parentLaw.check(endTrial) !== null || Math.abs(changed(4)[0]! - prior(4)[0]! - 2) > 1e-12 ||
      [0, 1, 2, 6, 8, 10].some((s): boolean => Math.abs(changed(s)[0]! - prior(s)[0]!) > 1e-12))
    failures.push("the local parent correction did not retain the unchanged material on both sides of its actual interval");
  const originalWall = AutoMovieLoftViewFullSource.create(AutoMovieHumanConicLoft.part(parentBase, parentBase.knots));
  const movedWall = AutoMovieLoftViewFullSource.create(AutoMovieHumanConicLoft.part(endTrial, endTrial.knots));
  const delta = (a: readonly number[], b: readonly number[]): number => Math.hypot(...a.map((v, i): number => v - b[i]!));
  if (Math.abs(delta(movedWall.point(4, 0), originalWall.point(4, 0)) - 2) > 1e-10)
    failures.push("the normalized terminal column did not move the actual fixed-end ring");
  for (const s of [1, 8]) {
    const originalJet = originalWall.jet(s, 0), movedJet = movedWall.jet(s, 0);
    if ([delta(originalJet.p, movedJet.p), delta(originalJet.u, movedJet.u), delta(originalJet.uu, movedJet.uu)].some((error): boolean => error > 1e-10))
      failures.push("the actual retained parent wall changed a physical station jet at " + s);
  }
  const leakedParent = { ...endTrial, values: endTrial.values.map((v) => v.map((x, i): number => i === 0 ? x + 1 : x)) };
  if (parentLaw.check(leakedParent) === null) failures.push("a parent correction leaked beyond its material span");

  const contour: K.P[] = Array.from({ length: 31 }, (_, k: number): K.P => {
    const a: number = 2 * Math.PI * (k + 1) / 32;
    return [2 * Math.cos(a), 2 * Math.sin(a)];
  });
  const notch: [number, number][] = [[2, -0.10], [1.92, 0.025], [2.05, -0.025], [2.08, 0.07]];
  for (const [r, angle] of notch) contour.push([r * Math.cos(angle), r * Math.sin(angle)]);
  const hits: number = contour.reduce((total, p, i): number => {
    const q = contour[(i + 1) % contour.length]!;
    if ((p[1] > 0) === (q[1] > 0)) return total;
    const x: number = p[0] - p[1] * (q[0] - p[0]) / (q[1] - p[1]);
    return total + Number(x > 0);
  }, 0);
  if (hits !== 3) failures.push("the made nonstar outline does not cross the positive ray three times");
  const pulse = Array.from({ length: 49 }, (_, i): number => i === 24 ? 0.25 : 0);
  const relieved: L.IStored = { ...parentBase, reliefs: [{ name: "made.turned", stations: [0, 8], phases: [-Math.PI, Math.PI],
    rows: 7, columns: 7, heights: pulse, shift: pulse, axis: [1, 0, 0], turn: [0, 0, 1] }] };
  const parentView = AutoMovieHumanConicLoft.part(relieved, relieved.knots);
  const displacedParent = AutoMovieLoftViewFullSource.create(parentView);
  if (!(delta(displacedParent.point(4, 0), originalWall.point(4, 0)) > 0))
    failures.push("the made ordered-section control has no physical relief displacement");
  for (const run of [contour, [...contour].reverse()]) {
    const measured = L.measuredRing(run, true);
    if (typeof measured === "string") failures.push("the complete oriented measured section was refused: " + measured);
    else {
      const retained = L.parentCorrespondence(parentView, 4, measured, 64, true, 0.5);
      if (!(retained.pieces > 0 && retained.upper <= 0.5)) failures.push("the directed relieved-parent cover lost a real interval");
    }
  }
  const reordered = [...contour];
  [reordered[4], reordered[19]] = [reordered[19]!, reordered[4]!];
  if (typeof L.measuredRing(contour, false) !== "string" || typeof L.measuredRing(reordered, true) !== "string")
    failures.push("an unclosed or crossing reordered section was accepted as original material");

  const quadratic = AutoMovieViewChain.of({
    points: [[1, 0], [0, 1], [-1, 0], [0, -1]],
    tangents: [[0, 1], [-1, 0], [0, -1], [1, 0]],
    shoulders: [0.5, 0.5, 0.5, 0.5],
  });
  if (quadratic.fault !== null ||
      L.beforePlane(quadratic, -3, 1, 1) !== null || L.beforePlane(quadratic, -1.75, 1, 1) !== null ||
      L.beforePlane(quadratic, -1.25, 1, 1) === null || L.beforePlane(quadratic, -1.5, 1, 1) === null)
    failures.push("full conic half-space missed an interior crossing, exact tangency or wholly negative control");
  const legal = F.fitGroup([0, 0], (v) => {
    const one = { value: v[0]! - 1, gradient: new Map([[0, 1]]) };
    const two = { value: v[1]!, gradient: new Map([[1, 1]]) };
    const shared = { value: v[0]! + v[1]! - 1, gradient: new Map([[0, 1], [1, 1]]) };
    return F.readGroup(v, true, [{ rows: () => ({ measured: [one, two], incidence: [shared], inside: [] }) }]);
  }, 1e-10, 60);
  if (typeof legal === "string" || legal.incidence > 1e-10 || Math.hypot(legal.values[0]! - 1, legal.values[1]!) > 1e-6)
    failures.push("the grouped material solve did not satisfy its common incident point and measured coordinates");
  const impossible = F.fitGroup([0], (v) => {
    const gradient = new Map([[0, 1]]);
    return F.readGroup(v, true, [{ rows: () => ({ measured: [], incidence: [
      { value: v[0]!, gradient }, { value: v[0]! - 1, gradient },
    ], inside: [] }) }]);
  }, 1e-10, 60);
  if (typeof impossible !== "string" && !(impossible.incidence > 1e-10))
    failures.push("inconsistent common material contacts were reported as an admitted coupled solution");
  const expected = AutoMovieViewChain.evaluate(quadratic.arcs[0]!, 0.5);
  const measuredFoot = F.closestOnArc(quadratic.arcs[0]!, 0, 1, expected);
  const other = F.closestOnArc(quadratic.arcs[2]!, 0, 1, expected);
  if (measuredFoot.distance > 1e-10 || other.distance <= 0.5)
    failures.push("the source arc and its hidden opposite arc were not distinguishable at the same observed point");
  const leaked = F.reverseCoverage(quadratic.arcs[0]!, 0, 1, [[1, 0], [0.99, 0.01]], false, 0.5);
  if (leaked === null) failures.push("finite measured edge coverage accepted a lobe beyond the end of the edge");
  const cut: K.P[] = [[-2, -2], [2, -2], [2, 2], [-2, 2]];
  const observed = (a: K.P, b: K.P): boolean => a !== cut[1] || b !== cut[2];
  const from: K.P = [4, 0];
  const toward: K.P = [-1, 0];
  if (
    H.crossing(cut, from, toward)?.along !== 2 ||
    H.crossing(cut, from, toward, observed)?.along !== 6 ||
    H.crossing(cut.slice(1, 3), from, toward, undefined, false)?.along !== 2 ||
    !Number.isNaN(S.radius(cut, 0, undefined, observed)) ||
    S.radius(cut, Math.PI, undefined, observed) !== 2
  )
    failures.push("a fabricated closing edge contributes a cast or hollow reading");
  const circle = (): number => 10;
  const along = (p: K.P): K.P => {
    const r: number = Math.hypot(p[0], p[1]);
    return [-p[1] / r, p[0] / r];
  };
  const polar = (radius: number, degrees: number): K.P => [radius * Math.cos((degrees * Math.PI) / 180), radius * Math.sin((degrees * Math.PI) / 180)];

  const layout: S.ILayout = S.limb(0);
  const shoulder: number = Math.SQRT2 - 1;
  const seed: number[] = [10, 0, 0, 10, -10, 0, 0, -10, shoulder, shoulder, shoulder, shoulder];
  const runs: K.P[][] = [[0, 20, 40].map((phase: number): K.P => polar(10, phase)), [150, 170, 190].map((phase: number): K.P => polar(10, phase))];
  const observedRows: F.IRow[] = [0, 1, 2].map((s: number): F.IRow => ({ s, points: [...runs.flat(), [600, 600]], runs, seed, heldout: s === 1 }));
  const initial: number[][] = seed.map((value: number): number[] => [value, value]);
  const measured: F.IResult = F.fit(observedRows, [0, 2], layout, 2, initial, F.ADMISSIBLE_MARGIN, false);
  if (measured.fault !== null || measured.training.maximumMm > 1e-6 || measured.heldout.maximumMm > 1e-6)
    failures.push("the open skin run was replaced by a fabricated observation");
  if (
    F.fit(observedRows.filter((row: F.IRow): boolean => row.s < 2), [0, 1], layout).fault === null ||
    F.fit(observedRows, [0, 0], layout).fault === null
  ) failures.push("withheld rows or repeated stations supplied an independent knot");


  // The cubic with radius 11.2 at -1 and 10.2 at 0 has curvature 1.2 at 0 and meets a constant radius 10 at 1.
  // The natural equations give radius 10.625 and 10.025 at the withheld half stations.
  const constantTail = { knots: [0, 1, 2, 3], values: seed.map((value: number): number[] => [value, value, value, value]) };
  const constrained = L.constrainTail(constantTail, 1, [-1]);
  if (typeof constrained === "string") failures.push("the exact continued root could not be initialized: " + constrained);
  else {
    const actual: F.IRow[] = [[-1, 11.2], [-0.5, 10.625], [0, 10.2], [0.5, 10.025]].map(([s, radius]): F.IRow => {
      const open: K.P[][] = [[0, 30, 60, 90, 120, 150, 180], [200, 225, 250, 275, 300, 330]]
        .map((arc: number[]): K.P[] => arc.map((phase: number): K.P => polar(radius!, phase)));
      return { s: s!, runs: open, points: open.flat(), heldout: s === -0.5 || s === 0.5 };
    });
    const admittedStock: L.IStored = { name: "made.refinement", centres: [[0, 0, 0], [0, 4, 0]], halves: [], up: [1, 0, 0],
      layout, ...constantTail };
    const badGuide = actual.map((row) => ({ ...row, seed: seed.map((): number => NaN) }));
    const originalStart = F.prepareGroupMember(badGuide, constrained, admittedStock);
    if (!originalStart.check(originalStart.tail.initial) || originalStart.tail.initial.some((field, i) =>
        field.some((v): boolean => Math.abs(v - seed[i]!) > 1e-12)))
      failures.push("the grouped start depended on a projected opening instead of its admitted canonical source");
    const n = constrained.free.length;
    const reduced = constrained.initial.flatMap((field) => constrained.free.map((i): number => field[i]!));
    const invalid = [...reduced];
    invalid[(seed.length - 1) * n] = -0.02;
    const expanded = (v: readonly number[]): number[][] => constrained.initial.map((_, f) => constrained.expand(f, v.slice(f * n, (f + 1) * n)));
    const repair = F.restoreGroup(invalid, (v, derivatives) => originalStart.raw(expanded(v), 0, derivatives), 60);
    if (repair.stopped !== null || repair.iteration === 0 || !originalStart.check(expanded(repair.values)) ||
        constrained.check({ knots: constrained.knots, values: expanded(repair.values) }) !== null)
      failures.push("the common feasible start did not repair the actual raw material share on its fixed C2 suffix");
    const immobilized: L.ITailFit = { ...constrained, basis: () => [], free: [] };
    const fixed = F.prepareGroupMember(actual, immobilized, admittedStock);
    const noDirection = F.restoreGroup([], (_v, derivatives) => fixed.raw(expanded(invalid), 0, derivatives), 60);
    if (noDirection.stopped === null || !noDirection.stopped.includes("no first-order free direction") || noDirection.iteration !== 0)
      failures.push("a strictly invalid immutable share was admitted without a reduced material direction");
    const corridor = F.restoreGroup([-0.01], (v, derivatives) => ({ margins: [
      { value: v[0]!, gradient: new Map(derivatives ? [[0, 1]] : []), label: "first", closed: false, scale: 1 },
      { value: 0.02 - v[0]!, gradient: new Map(derivatives ? [[0, -1]] : []), label: "opposite", closed: false, scale: 1 },
    ], fault: null }), 1);
    if (corridor.stopped !== null || corridor.iteration !== 1 || Math.abs(corridor.values[0]! - 0.01) > 1e-6 ||
        corridor.receipts[0]?.rows !== 2 || corridor.receipts[0]?.status !== 1)
      failures.push("the bounded phase-I step lost the already feasible opposite side of a material interval");
    const buried = F.similarStart(constrained, admittedStock, [-5, 1, 0]);
    const touches = F.similarStart(constrained, admittedStock, [0, 1, 0]);
    if (typeof buried === "string" || typeof touches !== "string" || !(buried.scale > 0 && buried.scale < 0.5) ||
        Math.abs(buried.support - 10) > 1e-7 || !originalStart.check(buried.values) ||
        constrained.check({ knots: constrained.knots, values: buried.values }) !== null)
      failures.push("a positive similarity did not preserve the round section and suffix below the independent signed plane");
    const brokenSource = { ...admittedStock, values: admittedStock.values.map((field, i) => i === 0 ? field.map((): number => -10) : field) };
    try {
      F.prepareGroupMember(badGuide, constrained, brokenSource);
      failures.push("a rejected original source supplied a grouped start");
    } catch (error: unknown) {
      if (!String(error).includes("stored material before refinement")) failures.push("wrong canonical source refusal: " + String(error));
    }
    const fitted = F.fit(actual, constrained.knots, layout, 2, undefined, F.ADMISSIBLE_MARGIN, true, constrained);
    const saved: Pick<L.IStored, "knots" | "values"> = JSON.parse(JSON.stringify({ knots: fitted.knots, values: fitted.values })) as Pick<L.IStored, "knots" | "values">;
    if (fitted.fault !== null || fitted.iterations === 0 || fitted.heldout.maximumMm > 0.01 ||
        constrained.check(saved) !== null || Math.abs(saved.values[0]![0]! - 11.2) > 0.01 ||
        Math.abs(saved.values[0]![1]! - 10.2) > 0.01)
      failures.push("the held-tail fit left its exact affine prefix or ignored the observed root");
    const badShare: number = seed.length - 1;
    const distorted: number[][] = constrained.initial.map((field: number[], f: number): number[] => f !== badShare ? [...field] :
      constrained.expand(f, constrained.free.map((): number => 1.1)));
    const ill = { ...constrained, initial: distorted };
    const firstShare: number = F.at(constrained.knots, distorted, constrained.knots[constrained.free[0]!]!)[badShare]!;
    const restored: F.IResult = F.fit(actual, constrained.knots, layout, 2, undefined, F.ADMISSIBLE_MARGIN, true, ill);
    if ((firstShare > 0 && firstShare < 1) || restored.fault !== null || constrained.check(restored) !== null ||
        restored.heldout.maximumMm > 0.01)
      failures.push("an initially inadmissible shoulder on the exact curvature subspace did not recover the measured root");
    const noTraining = F.fit(actual.map((row: F.IRow): F.IRow => ({ ...row, heldout: true })), constrained.knots,
      layout, 2, undefined, F.ADMISSIBLE_MARGIN, true, constrained);
    if (!noTraining.fault?.includes("training rows"))
      failures.push("a held-only prefix supplied an independent ordinate");
    if (fitted.fault === null) {
      const displaced = { ...saved, values: saved.values.map((field: number[]): number[] => [...field]) };
      displaced.values[0]![0]! += 0.1;
      if (constrained.check(displaced) === null)
        failures.push("a proximal change on the wrong curvature subspace moved the supposedly fixed tail");
    }
  }

  const tail = { knots: [0, 1, 2], values: [[0, 1, 0]] };
  const shortened = { knots: [0.5, 1, 2], values: [[0.6, 1, 0]] };
  const held = L.holdTail(shortened, tail, 1);
  if (typeof held === "string") failures.push("dependent exposed root: " + held);
  else {
    const saved: typeof shortened = JSON.parse(JSON.stringify({ knots: shortened.knots, values: held.values })) as typeof shortened;
    const jet: [number, number, number] = Natural.read(Natural.create(saved.knots, saved.values[0]!), 1.5);
    if (held.changed.length !== 1 || held.changed[0] !== 0.5 || Math.abs(saved.values[0]![0]! - 0.75) > 1e-12 ||
      held.check(saved) !== null || jet.some((value: number, k: number): boolean => Math.abs(value - [0.6875, -1.125, -1.5][k]!) > 1e-12))
      failures.push("the serialized tail changed its known position or derivatives");
  }
  const unsupported = L.holdTail({ knots: [1, 2], values: [[1, 0]] }, tail, 1);
  if (typeof unsupported !== "string" || !unsupported.includes("no free prefix"))
    failures.push("a natural boundary without a prefix took nonzero curvature");

  const canonical = { knots: [0, 1, 2, 3], values: [[0, 0, 1, 0]] };
  const two = { knots: [0, 0.5, 1, 2, 3], values: [[0, 6, 0, 1, 0]] };
  const interior = L.holdTail(two, canonical, 1);
  if (typeof interior === "string" || interior.values[0]![0] !== 0 ||
      interior.changed.length !== 1 || interior.changed[0] !== 0.5)
    failures.push("an altered interior ordinate escaped the held-first-value splice control");
  const roles = [{ s: 0, heldout: false }, { s: 1, heldout: true }, { s: 2, heldout: false }];
  const added: number[] = L.heldPrefixStations([0, 1.5], 2, roles);
  if (added.length !== 1 || added[0] !== 1.75 || roles[1]!.heldout !== true)
    failures.push("an unobserved narrow prefix span lost its own independent held cut or reassigned a scan role");
  const atStart: L.IPrefixObservation = { s: 0, heldout: false, points: 2, maximumMm: 0.1 };
  const atInterior: L.IPrefixObservation = { s: 0.5, heldout: true, points: 2, maximumMm: 0.6 };
  const good = L.prefixEvidence([0, 0.5], 1, [atStart, { ...atInterior, maximumMm: 0.4 }], 0.5);
  const missing = L.prefixEvidence([0, 0.5], 1, [atStart], 0.5);
  const red = L.prefixEvidence([0, 0.5], 1, [atStart, atInterior], 0.5);
  if (!good.supported || missing.supported || missing.missing[0]?.[0] !== 0.5 ||
      red.supported || red.heldMaximumMm !== 0.6)
    failures.push("a first-knot observation admitted an unsupported or displaced interior prefix");

  const straight: L.IStored = {
    name: "prefix.fixture",
    centres: [[0, 0, 0], [0, 0, 3]],
    halves: [],
    up: [1, 0, 0],
    layout,
    knots: [0, 0.5, 1, 2],
    values: seed.map((value: number): number[] => [value, value, value, value]),
  };
  const heldCut: L.IPrefixCut = { s: 0.75, heldout: true, world: [[10, 0, 0.75]] };
  const direct: L.IPrefixCut[] = [{ s: 0, heldout: false, world: [[10, 0, 0]] }, heldCut];
  const before = L.create(straight, [0, 0.5, 1, 2, 0.75]);
  const sorted = L.verifyPrefix(straight, straight.knots, 1, direct, 0.5);
  const displaced = L.verifyPrefix(straight, straight.knots, 1, [
    direct[0]!,
    { ...heldCut, world: [[10.6, 0, 0.75]] },
  ], 0.5);
  if (before.chain !== null || before.diagnostics.length === 0 ||
      sorted.evidence?.supported !== true || sorted.observations[1]?.s !== 0.75 ||
      sorted.evidence.held !== 1 || sorted.viewRefusals.length !== 0 ||
      displaced.evidence?.supported !== false || displaced.evidence.missing.length !== 0 ||
      Math.abs((displaced.evidence.heldMaximumMm ?? Infinity) - 0.6) > 1e-6 ||
      displaced.viewRefusals.length !== 0)
    failures.push("splice replay failed ordering, held skin, or the independent displaced-skin control");

  const course: Pick<L.IStored, "name" | "centres" | "halves" | "up"> = { name: "registration", centres: [[0.003, 1.002, 2.004], [0.003, 1.002, 5.004]], halves: [], up: [0, 1, 0] };
  const archive: L.IStored = { ...course, centres: [[0, 1, 2], [0, 1, 5]], layout, knots: [0, 2], values: seed.map((field: number): number[] => [field, field]) };
  const coordinate = (n: number): number => Math.round(n * 100) / 100;
  const own = L.registeredInitializer(archive, course, layout, coordinate);
  const turned = L.registeredInitializer({ ...archive, up: [1e-9, 1, 0] }, course, layout, coordinate);
  const foreign = L.registeredInitializer({ ...archive, layout: { ...layout, anchors: layout.anchors.map((anchor, i) =>
    i === 0 ? { ...anchor, guide: anchor.guide !== true } : anchor) } }, course, layout, coordinate);
  if (typeof own === "string" || own(-1) !== null || own(3) !== null || own(1)?.some((field: number, i: number): boolean => field !== seed[i]) !== false ||
      typeof turned !== "string" || typeof foreign !== "string")
    failures.push("the registered initializer changed its finite domain or admitted a changed rotation/anchor");

  const policy = { layout: { ...layout, least: 0.3 }, turn: 0.1, tips: [null, { from: 3, tip: 4, own: true }] } satisfies Parameters<typeof L.tailPolicyFault>[0];
  const decoded = JSON.parse(JSON.stringify(policy)) as typeof policy;
  if (L.tailPolicyFault(decoded, policy) !== null ||
      L.tailPolicyFault({ ...decoded, layout }, policy)?.includes("layout") !== true ||
      L.tailPolicyFault({ ...decoded, tips: [null, { from: 3, tip: 4 }] }, policy)?.includes("tips") !== true)
    failures.push("exact suffix values admitted a changed shoulder policy or cap");

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

  // 4. Bounded launch with an endpoint tangent that formerly overshot the section.
  const box = (r: number): K.P[] => [[-r, -r], [r, -r], [r, r], [-r, r]];
  const square = (phase: number): number =>
    10 / Math.max(Math.abs(Math.cos(phase)), Math.abs(Math.sin(phase)));
  const turn: number = Math.PI / 9;
  const finish: K.P = [10, 10 * Math.tan(turn)];
  const cover: K.ISupport = { section: box(12), tube: box(10) };
  const bounded: K.P[] | string = K.continued([10, 0], [50, 1], finish, [0, 1], square, cover);
  if (typeof bounded === "string")
    failures.push("bounded collar: " + bounded);
  else {
    if (!bounded.every(([x, y]): boolean => Math.abs(x) <= 12 && Math.abs(y) <= 12))
      failures.push("a bounded collar runs through its pocket");
    const first: K.P = bounded[0]!;
    if (!(first[0] > 10 && Math.abs(first[0] - 10 - 50 * first[1]) < 0.4))
      failures.push("the bounded collar has lost the kept exit direction");
  }
  const outwardAtBoundary: K.P[] | string = K.continued([12, 0], [50, 1], finish, [0, 1], square, cover);
  if (typeof outwardAtBoundary !== "string" || !outwardAtBoundary.includes("exit"))
    failures.push("an outward jet at the pocket boundary was admitted");

  // 5. Refusals.
  const back: K.P[] | string = K.continued([-half, -9.5], [-along([-half, -9.5])[0], -along([-half, -9.5])[1]], [half, -9.5], along([half, -9.5]), circle);
  if (!(typeof back === "string" && back.includes("exit"))) failures.push(`skin running back at the exit: ${typeof back === "string" ? back : "not refused"}`);
  const empty: K.P[] | string = K.continued([-half, -9.5], along([-half, -9.5]), [half, -9.5], along([half, -9.5]), (): number => 0);
  if (!(typeof empty === "string" && empty.includes("no radius"))) failures.push(`a tube with no radius: ${typeof empty === "string" ? empty : "not refused"}`);

  if (failures.length > 0) throw new Error(`section closure: ${failures.length} finding(s):\n${failures.join("\n")}`);
}
