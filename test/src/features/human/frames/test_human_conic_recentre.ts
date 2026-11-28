import {
  AutoMovieEngineViewAxis,
  AutoMovieEngineViewChain,
  AutoMovieEngineViewJointedCourse,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicRecentre as Recentre,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanF1,
  AutoMovieHumanF1CourseLaw as Law,
  AutoMovieHumanF1NativeSites as Sites,
  AutoMovieHumanNativeScaleCentre as Centre,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicRecentre,
  IAutoMovieHumanConicSection,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewJointedCourse,
} from "@automovie/interface";

/**
 * A family re-expressed about another origin line is the same skin; a scale about a scaling centre leaves that centre still; a turn's
 * least half length is where its sections meet on the concave side.
 *
 * Scenarios:
 * 1. A made family of ellipses (semi-axes 20 and 10 mm) whose centre stands off its straight course by [3 + 0.1 s, -2 + 0.05 s] is
 *    re-expressed about its own centre line. At stations on and between knots and round the section, the skin point at a base phase and
 *    the re-centred family's point at the mapped phase are one world point; the re-centred section's radius is the centred ellipse's
 *    `a b / sqrt((b cos t)^2 + (a sin t)^2)`.
 * 2. The four corners of a made relief window and eight addresses of a made loop on the base chart map to the same world points.
 * 3. The moved course's jet on a straight base: its tangent is the base's plus the line's slopes [0.1, 0.05] along `u` and `v`, with no
 *    second derivative.
 * 4. The zero line returns every knot value and course point bit for bit.
 * 5. Refused: a `v` move of a bilateral family, and an origin past the section's own extreme.
 * 6. The scaling centre: with a = 1 + 0.05 s, f = s^2 and c = 3 s, `c + a (f - c)` is `0.85 s^2 + 0.05 s^3`, so its jet at s = 2 is
 *    [3.8, 4.0, 2.3]; with c = 0 it is the product rule [4.4, 4.6, 2.6]; a unit ratio returns the coordinate's jet itself; a coordinate
 *    at the centre stays at the centre.
 * 7. The turn rule: on a right-angle course with the least half length for a 20 mm reach, (15/16)(pi/2) 20, the offset curve's speed
 *    `1 - kappa r` at the turn's middle is zero; with 5/4 of it the speed is 1/5.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production re-expression, moved course, chart map, scaling-centre jet and turn rule, and reads sections through the production resolver and the engine's chain.
 * @evidence contracts/development/testing.md#independent-expectations World-point equality between two representations, the centred ellipse's polar equation, a hand-expanded polynomial and the offset curve's speed are closed forms.
 * @evidence contracts/development/common.md#meaningful-documentation Moving a chart origin preserves world points, windows and loop addresses. The synthetic cases also check its jet, zero offsets, domain refusal and turn speed under offset.
 */
export function test_human_conic_recentre(): void {
  const failures: string[] = [];
  const near = (what: string, got: readonly number[], want: readonly number[], tolerance: number): void => {
    const d: number = Math.hypot(...got.map((x: number, k: number): number => x - want[k]!));
    if (!(d <= tolerance)) failures.push(`${what}: [${got.join(", ")}] instead of [${want.join(", ")}]`);
  };

  // The made family.
  const [a, b]: [number, number] = [20, 10];
  const knots: number[] = [0, 10, 20, 30];
  const centre = (s: number): [number, number] => [3 + 0.1 * s, -2 + 0.05 * s];
  const rho: number = Math.SQRT2 - 1;
  const row = (f: (e: [number, number]) => number): number[] => knots.map((s: number): number => f(centre(s)));
  const layout: IAutoMovieHumanConicSection.ILayout = S.limb(0);
  const family: IAutoMovieHumanConicRecentre.IFields = {
    knots,
    layout,
    values: [
      row((e): number => e[0] + a),
      row((e): number => e[1]),
      row((e): number => e[0]),
      row((e): number => e[1] + b),
      row((e): number => e[0] - a),
      row((e): number => e[1]),
      row((e): number => e[0]),
      row((e): number => e[1] - b),
      ...[0, 1, 2, 3].map((): number[] => knots.map((): number => rho)),
    ],
  };
  const base: IAutoMovieViewAxis.IAxis = AutoMovieEngineViewAxis.straight([1, 2, 3], [1, 0, 0], [0, 0, 1]);
  const line: IAutoMovieHumanConicRecentre.ILine = { u: knots.map((s: number): number => centre(s)[0]), v: knots.map((s: number): number => centre(s)[1]) };
  const moved: number[][] = Recentre.shift(family, line);
  const axis: IAutoMovieViewAxis.IAxis = Recentre.axis(base, knots, line);
  const world = (course: IAutoMovieViewAxis.IAxis, values: readonly (readonly number[])[], s: number, t: number): number[] => {
    const frame = course.at(s);
    const r: number = AutoMovieEngineViewChain.radius(S.chain(H.reader({ knots, values: values as number[][] })(s), layout), t);
    return [0, 1, 2].map((k: number): number => frame.origin[k]! + r * (Math.cos(t) * frame.u[k]! + Math.sin(t) * frame.v[k]!));
  };
  const agree = (what: string, s: number, t: number): number => {
    const mapped: number = Recentre.phase(family, line, s, t);
    near(what, world(axis, moved, s, mapped), world(base, family.values, s, t), 1e-9);
    return mapped;
  };

  // 1. The same skin, and the centred ellipse.
  for (const s of [0, 5, 12.5, 20, 30])
    for (let j: number = 0; j < 16; ++j) {
      const mapped: number = agree(`skin point at station ${s}, phase ${j}/16`, s, (2 * Math.PI * j) / 16 + 0.05);
      const r: number = AutoMovieEngineViewChain.radius(S.chain(H.reader({ knots, values: moved })(s), layout), mapped);
      near(`centred ellipse radius at station ${s}, phase ${j}/16`, [r], [(a * b) / Math.hypot(b * Math.cos(mapped), a * Math.sin(mapped))], 1e-9);
    }

  // 2. A relief window's corners and a loop's addresses.
  for (const [s, t] of [[5, 0.4], [5, 1.2], [25, 0.4], [25, 1.2]] as const) agree(`window corner [${s}, ${t}]`, s, t);
  for (let j: number = 0; j < 8; ++j) agree(`loop address ${j}`, 15 + 6 * Math.cos((Math.PI * j) / 4), 0.8 + 0.3 * Math.sin((Math.PI * j) / 4));

  // 3. The moved course's jet.
  const jet: IAutoMovieViewAxisJet.IJet | null | undefined = axis.jet?.(12.5);
  if (jet === null || jet === undefined) failures.push("the moved course gives no jet on a base that has one");
  else {
    near("moved course tangent", jet.first.origin, [0.1, 1, 0.05], 1e-12);
    near("moved course second derivative", jet.second.origin, [0, 0, 0], 1e-12);
    near("moved course point", jet.value.origin, [1 + centre(12.5)[0], 2 + 12.5, 3 + centre(12.5)[1]], 1e-12);
  }

  // 4. The zero line.
  const zero: IAutoMovieHumanConicRecentre.ILine = { u: knots.map((): number => 0), v: knots.map((): number => 0) };
  Recentre.shift(family, zero).forEach((values: number[], f: number): void => {
    if (!values.every((x: number, k: number): boolean => Object.is(x, family.values[f]![k]))) failures.push(`the zero line changed field ${f}`);
  });
  if (!Recentre.axis(base, knots, zero).at(7).origin.every((x: number, k: number): boolean => Object.is(x, base.at(7).origin[k]))) failures.push("the zero line moved the course");

  // 5. Refusals.
  const refuses = (what: string, call: () => unknown): void => {
    try {
      call();
      failures.push(what + " was accepted");
    } catch {
      // refused as required
    }
  };
  const bilateral: IAutoMovieHumanConicSection.ILayout = S.bilateral(0);
  const half: IAutoMovieHumanConicRecentre.IFields = { knots, layout: bilateral, values: S.units(bilateral).map((unit: IAutoMovieHumanConicSection.Unit, f: number): number[] => knots.map((): number => (unit === "share" ? rho : f === 0 ? 20 : f === 1 ? 0 : f === 2 ? 10 : -20))) };
  refuses("a v move of a bilateral family", (): unknown => Recentre.shift(half, { u: zero.u, v: knots.map((): number => 1) }));
  refuses("an origin past the front extreme", (): unknown => Recentre.shift(family, { u: knots.map((): number => 40), v: zero.v }));

  // 6. The scaling centre.
  near("scaled about a centre", Centre.apply([1.1, 0.05, 0], [4, 4, 2], [6, 3, 0]), [3.8, 4.0, 2.3], 1e-12);
  near("scaled about the course", Centre.apply([1.1, 0.05, 0], [4, 4, 2], [0, 0, 0]), [4.4, 4.6, 2.6], 1e-12);
  const own: Centre.IJet = [4, 4, 2];
  if (Centre.apply([1, 0, 0], own, [6, 3, 0]) !== own) failures.push("a unit ratio did not return the coordinate's own jet");
  near("a coordinate at the centre", Centre.apply([1.1, 0.05, 0.01], [6, 3, 0], [6, 3, 0]), [6, 3, 0], 1e-12);

  // 7. The turn rule.
  const reach: number = 20;
  const least: number = Law.halfLeast(Math.PI / 2, reach);
  near("least half length", [least], [(15 / 16) * (Math.PI / 2) * reach], 1e-12);
  for (const [factor, speed] of [[1, 0], [1.25, 0.2]] as const) {
    const corner: [number, number, number][] = [[0, 0, 0], [100, 0, 0], [100, 100, 0]];
    const course: IAutoMovieViewAxis.IAxis | string = AutoMovieEngineViewAxis.jointed(corner, [least * factor], [0, 0, 1]);
    const prepared: IAutoMovieViewJointedCourse.ICourse | string = AutoMovieEngineViewJointedCourse.prepare(corner, [least * factor]);
    if (typeof course === "string" || typeof prepared === "string") {
      failures.push("the made right-angle course was refused");
      continue;
    }
    const bend: IAutoMovieViewAxisJet.IJet | null | undefined = course.jet?.(prepared.turns[0]!.start + prepared.turns[0]!.half);
    if (bend === null || bend === undefined) failures.push("the made course gives no jet");
    else near(`offset speed at ${factor} of the least half length`, [1 - Math.hypot(...bend.second.origin) * reach], [speed], 1e-9);
  }

  // Appended to a failure: f1's run ends and sites, every turn against the turn rule, and the trunk's, arm's, hand's and leg's guide
  // extremes, section centres, smoothed centre line and skeletal datum at every knot, with whether each re-centring is admitted.
  const report: string[] = [`RUNS ${JSON.stringify(Sites.REFERENCE.runs)}`, `WINDOWS ${JSON.stringify(Sites.REFERENCE.windows)}`];
  for (const [group, record] of Object.entries({ wall: Sites.REFERENCE.wall, arm: Sites.REFERENCE.arm, leg: Sites.REFERENCE.leg, extremities: Sites.REFERENCE.extremities }))
    for (const [name, site] of Object.entries(record)) report.push(`SITE ${group}.${name} ${site.station} tau ${site.run.tau.toFixed(4)}`);
  const families: IAutoMovieHumanConicLoft.IFamily[] = [...AutoMovieHumanF1.FAMILIES.map((m: { family: IAutoMovieHumanConicLoft.IFamily }): IAutoMovieHumanConicLoft.IFamily => m.family), ...AutoMovieHumanF1.CUTTERS.map((m: { family: IAutoMovieHumanConicLoft.IFamily }): IAutoMovieHumanConicLoft.IFamily => m.family)];
  for (const f of families)
    for (const fold of Law.folds(f))
      report.push(`FOLD ${f.name} | ${fold.centre} | half ${fold.half} | angle ${((fold.angle * 180) / Math.PI).toFixed(2)} | concave ${fold.concave.toFixed(2)} | least ${fold.least.toFixed(2)} | margin ${fold.margin.toFixed(2)}`);
  for (const f of families.filter((x: IAutoMovieHumanConicLoft.IFamily): boolean => ["trunk", "arm", "hand", "leg"].includes(x.name))) {
    const read = H.reader(f);
    const skeleton = Law.skeleton(f);
    const smooth: IAutoMovieHumanConicRecentre.ILine = Law.centreLine(f, "sections");
    const raw: IAutoMovieHumanConicRecentre.ILine = Law.centreLine(f, "sections", 0);
    f.knots.forEach((s: number, k: number): void => {
      const chain: IAutoMovieHumanConicSection.IChain = S.resolve(read(s), f.layout);
      const g: number[][] = chain.guides.map((i: number): number[] => chain.input.points[i]!);
      report.push(`ROW ${f.name} ${s} | +u ${g[0]![0]!.toFixed(1)} -u ${g[2]![0]!.toFixed(1)} +v ${g[1]![1]!.toFixed(1)} -v ${g[3]![1]!.toFixed(1)} | centre [${raw.u[k]!.toFixed(1)}, ${raw.v[k]!.toFixed(1)}] smooth [${smooth.u[k]!.toFixed(1)}, ${smooth.v[k]!.toFixed(1)}] | skeleton ${skeleton[k] === null ? "none" : `[${skeleton[k]![0].toFixed(1)}, ${skeleton[k]![1].toFixed(1)}]`}`);
    });
    for (const [label, candidate] of [["smooth", smooth], ["raw", raw]] as const)
      try {
        Recentre.shift(f, candidate);
        report.push(`RECENTRE ${f.name} ${label}: admitted`);
      } catch (error: unknown) {
        report.push(`RECENTRE ${f.name} ${label}: ${error instanceof Error ? error.message : String(error)}`);
      }
  }
  if (failures.length !== 0) throw new Error([...failures, "", ...report].join("\n"));
}
