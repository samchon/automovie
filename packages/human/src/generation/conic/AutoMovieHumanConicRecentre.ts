import { AutoMovieHumanConicSection as S } from "./AutoMovieHumanConicSection";
import {
  AutoMovieNaturalSpline,
  AutoMovieViewAxisJet,
  AutoMovieViewChain,
} from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicRecentre,
  IAutoMovieHumanConicSection,
  IAutoMovieNaturalCubicSpline,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewChain,
} from "@automovie/interface";

/**
 * A conic family re-expressed about another origin line in its own section planes: the same skin, read from a course point moved within
 * each plane.
 *
 * What the origin is to a section (`AutoMovieHumanConicSection.resolve`, `AutoMovieViewChain.of` and `read`):
 * - an extreme anchor's two numbers are its chart coordinates about the course point, so they shift with it; a median share, an
 *   inflection's share and turn, a feature's chord numbers and every shoulder are read on the anchors' own triangle or chord and do not
 *   change;
 * - an extreme's tangent takes its sense from the sign of its own coordinate, so the origin must stay between the two `u` extremes and
 *   between the two `v` extremes;
 * - a `mid` anchor stands on the chart's line `v = 0`, and a mirror layout reflects in it, so such a family's origin moves along `u` only;
 * - each guide's touch offset is held within 0.92 of the way to its neighbours' coordinates, measured from the origin, so a section whose
 *   guide stands at that bound before or after the move is not the same point set and is refused;
 * - the chart's phase is the polar angle about the course point, so every address given in the chart (a relief's window, a port loop, a
 *   seed, a rail's phases) moves by `phase`, and the section must stay star-shaped about the new point.
 *
 * Between knots a field is the natural cubic through its knot values, and the natural cubic is linear in its values, so the re-expressed
 * family is the same surface at every station exactly when the origin line is itself the natural cubic through its own knot shifts on the
 * family's knots: `axis` builds that line on the base course, with the section planes and their chart directions unchanged.
 *
 * Not exact, and so not done here: a relief's height net is a tensor spline over station and phase, and the phase map depends on the
 * station and the radius, so a mapped window is no longer a rectangle and its net must be fitted again; a closed tip shrinks its section
 * about the course point, so a re-centred tip is another cap.
 */
export namespace AutoMovieHumanConicRecentre {

  const spline = (knots: readonly number[], values: readonly number[]): IAutoMovieNaturalCubicSpline => AutoMovieNaturalSpline.create(knots, values);

  /**
   * The section's area centroid in its own chart, in millimetres. The polar
   * area uses `r²/2`. Its first moments use `r³/3` projected along each axis.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the centroid's units, chart and area equations.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the polar area and first-moment integrals of the native section. Uniform phase integration is exact for constant circles and verified independently on displaced ellipses and paired half ellipses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass accumulates the area and both first moments.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Section admission remains owned by the native chain. Guide averages do not substitute for area integration.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work is linear in a fixed phase count.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This direct measurement owns one section.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains three sums and returns one pair.
   */
  export function centroid(section: IAutoMovieViewChain.ISection): AutoMovieVector2Tuple {
    if (section.fault !== null) throw new Error("recentre: " + section.fault);
    // ESTIMATE: quarter-degree integration resolves both independent ellipse
    // centroids to 1e-6 mm. This sampling does not prescribe skin geometry.
    const phases: number = 1440;
    let area: number = 0;
    let u: number = 0;
    let v: number = 0;
    for (let index = 0; index < phases; ++index) {
      const angle: number = (2 * Math.PI * index) / phases;
      const r: number = AutoMovieViewChain.radius(section, angle);
      area += r * r;
      u += r * r * r * Math.cos(angle);
      v += r * r * r * Math.sin(angle);
    }
    return [(2 * u) / (3 * area), (2 * v) / (3 * area)];
  }

  /**
   * Measure each knot's area centroid and average it over a Gaussian width of
   * `share` times the family's mean guide reach. A zero share uses the measured
   * centres directly. A symmetric section layout keeps the median plane.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the caller's unitless smoothing share and the returned chart offsets.
   * @evidence contracts/development/implementation.md#principled-implementation Measures the given sections and normalizes a Gaussian weighted by each knot's span.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One section read per knot gives its centroid and mean guide reach, followed by weighted averages.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The caller supplies the smoothing share. Centroids retain their measured precision and symmetry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Quadratic in knot count for positive smoothing and linear for zero smoothing.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each native knot section supplies both measurements.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the finite knot-centroid and weight inputs for this call.
   */
  export function centreLine(family: IAutoMovieHumanConicRecentre.IFields, share: number): IAutoMovieHumanConicRecentre.ILine {
    if (!(Number.isFinite(share) && share >= 0) || family.knots.length < 2)
      throw new Error("recentre: the centre line needs at least two knots and a finite nonnegative smoothing share");
    const { knots, layout } = family;
    const median: boolean = layout.mirror || layout.anchors.some((anchor): boolean => anchor.mid === true);
    let reach: number = 0;
    const centres: AutoMovieVector2Tuple[] = knots.map((_, index): AutoMovieVector2Tuple => {
      const section: IAutoMovieHumanConicSection.IChain = S.resolve(family.values.map((row): number => row[index]!), layout);
      reach += section.guides.reduce((sum, i): number => sum + Math.hypot(...section.input.points[i]!), 0) / section.guides.length;
      return centroid(AutoMovieViewChain.of(section.input));
    });
    const width: number = (share * reach) / knots.length;
    const spans: number[] = knots.map((s, k): number => ((knots[k + 1] ?? s) - (knots[k - 1] ?? s)) / 2);
    const averaged = (component: 0 | 1): number[] => {
      if (width === 0) return centres.map((centre): number => centre[component]);
      return knots.map((station): number => {
        let sum: number = 0;
        let total: number = 0;
        knots.forEach((other, index): void => {
          const relative: number = (other - station) / width;
          const weight: number = spans[index]! * Math.exp(-(relative * relative) / 2);
          sum += weight * centres[index]![component];
          total += weight;
        });
        return sum / total;
      });
    };
    return { u: averaged(0), v: median ? knots.map((): number => 0) : averaged(1) };
  }

  /**
   * The family's knot values about the new origin line: every extreme's `u` less the line's `u` and its `v` less the line's `v`; shares,
   * turns and shoulders as given.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A point's coordinates about a moved origin are its coordinates less the move; every dependent anchor and shoulder is defined on the extremes' own triangle and is unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the extremes, then the admission of both sections at every knot and at every middle between two knots.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a `v` move of a family that stands on its median line, an origin that leaves the extremes' span, a guide at its box bound before or after, and a section no longer star-shaped; nothing is clamped to pass.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in fields times knots.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure re-expression coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh rows.
   */
  export function shift(family: IAutoMovieHumanConicRecentre.IFields, line: IAutoMovieHumanConicRecentre.ILine): number[][] {
    const { knots, layout } = family;
    if (line.u.length !== knots.length || line.v.length !== knots.length) throw new Error("recentre: the origin line needs one shift per knot");
    const median: boolean = layout.mirror || layout.anchors.some((anchor: IAutoMovieHumanConicSection.IAnchor): boolean => anchor.mid === true);
    if (median && line.v.some((x: number): boolean => x !== 0)) throw new Error("recentre: a family on its median line moves its origin along u only");
    const { at }: { at: number[] } = S.offsets(layout);
    const values: number[][] = family.values.map((row: readonly number[]): number[] => [...row]);
    layout.anchors.forEach((anchor: IAutoMovieHumanConicSection.IAnchor, k: number): void => {
      if (anchor.kind !== "u" && anchor.kind !== "v") return;
      values[at[k]!] = values[at[k]!]!.map((x: number, m: number): number => x - line.u[m]!);
      if (anchor.mid !== true) values[at[k]! + 1] = values[at[k]! + 1]!.map((x: number, m: number): number => x - line.v[m]!);
    });

    // The two families must read the same chain: admit both at every knot and halfway between neighbours.
    const stations: number[] = knots.flatMap((s: number, m: number): number[] => (m === 0 ? [s] : [(knots[m - 1]! + s) / 2, s]));
    const read = (rows: readonly (readonly number[])[]): ((s: number) => number[]) => {
      const fields: IAutoMovieNaturalCubicSpline[] = rows.map((row: readonly number[]): IAutoMovieNaturalCubicSpline => spline(knots, row));
      return (s: number): number[] => fields.map((field: IAutoMovieNaturalCubicSpline): number => AutoMovieNaturalSpline.evaluate(field, s));
    };
    const [before, after] = [read(family.values), read(values)];
    const [cu, cv] = [spline(knots, line.u), spline(knots, line.v)];
    for (const s of stations) {
      const [old, own] = [before(s), after(s)];
      const [a, b] = [S.resolve(old, layout).input, S.resolve(own, layout).input];
      const move: AutoMovieVector2Tuple = [AutoMovieNaturalSpline.evaluate(cu, s), AutoMovieNaturalSpline.evaluate(cv, s)];
      const same: boolean = a.points.every((p: readonly number[], k: number): boolean => {
        const q: readonly number[] = b.points[k]!;
        const scale: number = Math.max(1, Math.abs(p[0]!), Math.abs(p[1]!));
        return (
          Math.abs(p[0]! - move[0] - q[0]!) <= 1e-9 * scale &&
          Math.abs(p[1]! - move[1] - q[1]!) <= 1e-9 * scale &&
          Math.abs(a.tangents[k]![0]! * b.tangents[k]![1]! - a.tangents[k]![1]! * b.tangents[k]![0]!) <= 1e-9 * Math.hypot(...a.tangents[k]!) * Math.hypot(...b.tangents[k]!) &&
          a.tangents[k]![0]! * b.tangents[k]![0]! + a.tangents[k]![1]! * b.tangents[k]![1]! > 0
        );
      });
      if (!same) throw new Error("recentre: the section at " + s + " is not the same chain about the new origin (an extreme changes side or a guide stands at its box bound)");
      const fault: string | null = AutoMovieViewChain.of(b).fault;
      if (fault !== null) throw new Error("recentre: the section at " + s + " is not admitted about the new origin: " + fault);
    }
    return values;
  }

  /**
   * The base course with its origin moved along the origin line, every section plane and chart direction kept: at a station the origin
   * is `o + cu u + cv v`, `cu` and `cv` the natural cubics through the line's knot shifts. Where the base gives its jet, the moved
   * course gives its own by the product rule.
   *
   * @evidence contracts/development/implementation.md#principled-implementation `o' = o + cu u + cv v`, so `o'_1 = o_1 + cu_1 u + cu u_1 + cv_1 v + cv v_1` and `o'_2 = o_2 + cu_2 u + 2 cu_1 u_1 + cu u_2 + cv_2 v + 2 cv_1 v_1 + cv v_2`; `u`, `v` and their derivatives are the base's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrapper over the base's `at` and `jet`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A base without a jet yields none; a selected coordinate is converted by the engine's own jet conversion from the station jet.
   * @evidence contracts/development/implementation.md#efficient-algorithms One base read and two spline reads per query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both callbacks share the two prepared splines.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The axis retains the base and two knot-sized splines.
   */
  export function axis(base: IAutoMovieViewAxis.IAxis, knots: readonly number[], line: IAutoMovieHumanConicRecentre.ILine): IAutoMovieViewAxis.IAxis {
    const [cu, cv] = [spline(knots, line.u), spline(knots, line.v)];
    type V = [number, number, number];
    const mix = (terms: readonly (readonly [number, readonly number[]])[]): V =>
      [0, 1, 2].map((c: number): number => terms.reduce((sum: number, [k, vector]: readonly [number, readonly number[]]): number => sum + k * vector[c]!, 0)) as V;
    const at = (station: number): ReturnType<IAutoMovieViewAxis.IAxis["at"]> => {
      const frame: ReturnType<IAutoMovieViewAxis.IAxis["at"]> = base.at(station);
      return {
        ...frame,
        origin: mix([[1, frame.origin], [AutoMovieNaturalSpline.evaluate(cu, station), frame.u], [AutoMovieNaturalSpline.evaluate(cv, station), frame.v]]),
      };
    };
    if (base.jet === undefined) return { at };
    return {
      at,
      jet: (station: number, parameter?: Parameters<NonNullable<IAutoMovieViewAxis.IAxis["jet"]>>[1]): IAutoMovieViewAxisJet.IJet | null => {
        const j: IAutoMovieViewAxisJet.IJet | null = base.jet!(station);
        if (j === null) return null;
        const [u0, v0] = [AutoMovieNaturalSpline.evaluate(cu, station), AutoMovieNaturalSpline.evaluate(cv, station)];
        const [[u1, u2], [v1, v2]] = [AutoMovieNaturalSpline.derivative(cu, station), AutoMovieNaturalSpline.derivative(cv, station)];
        const moved: IAutoMovieViewAxisJet.IJet = {
          value: { ...j.value, origin: mix([[1, j.value.origin], [u0, j.value.u], [v0, j.value.v]]) },
          first: { ...j.first, origin: mix([[1, j.first.origin], [u1, j.value.u], [u0, j.first.u], [v1, j.value.v], [v0, j.first.v]]) },
          second: {
            ...j.second,
            origin: mix([[1, j.second.origin], [u2, j.value.u], [2 * u1, j.first.u], [u0, j.second.u], [v2, j.value.v], [2 * v1, j.first.v], [v0, j.second.v]]),
          },
        };
        return AutoMovieViewAxisJet.parameter(moved, parameter, station);
      },
    };
  }

  /**
   * The phase about the new origin of the skin point that stands at `phase` about the base course point, at one station: the chart map
   * every address given in the family's chart goes through.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The point `r(t) (cos t, sin t)` of the base section, less the origin's move, read as a polar angle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One section read and one `atan2`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A section the engine does not admit is refused; the angle is returned in [0, 2 pi) with no branch chosen for the caller.
   * @evidence contracts/development/implementation.md#efficient-algorithms One field read per field and one chain preparation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call serves one address.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number.
   */
  export function phase(family: IAutoMovieHumanConicRecentre.IFields, line: IAutoMovieHumanConicRecentre.ILine, station: number, phase: number): number {
    const values: number[] = family.values.map((row: readonly number[]): number => AutoMovieNaturalSpline.evaluate(spline(family.knots, row), station));
    const section: IAutoMovieViewChain.ISection = S.chain(values, family.layout);
    if (section.fault !== null) throw new Error("recentre: the base section at " + station + " is not admitted: " + section.fault);
    const r: number = AutoMovieViewChain.radius(section, phase);
    const [cu, cv] = [
      AutoMovieNaturalSpline.evaluate(spline(family.knots, line.u), station),
      AutoMovieNaturalSpline.evaluate(spline(family.knots, line.v), station),
    ];
    const angle: number = Math.atan2(r * Math.sin(phase) - cv, r * Math.cos(phase) - cu);
    return angle < 0 ? angle + 2 * Math.PI : angle;
  }
}
