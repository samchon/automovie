import type { AutoMovieViewChain as Q } from "@automovie/engine";
import { AutoMovieHumanConicSection as S } from "@automovie/human";
import { approximateAutoMovieRecoveryConicsAhn } from "@automovie/recovery";
import { FamilyConicExcursion as X } from "./FamilyConicExcursion";

/**
 * The offline side of `AutoMovieHumanConicSection`: reading a starting field
 * vector from an observed polygon and carrying a limb section one median
 * level deeper. The model itself (layouts, units, resolution into the
 * engine's chain) is the Human package's, re-exported here so the fit and
 * the generated figure cannot drift apart.
 */
export namespace FamilyConicSection {
  /** A planar chart point, millimetres. */
  export type P = S.P;

  /** One anchor of a layout. */
  export type IAnchor = S.IAnchor;

  /** The anchors of a section family. */
  export type ILayout = S.ILayout;

  /** What a field measures. */
  export type Unit = S.Unit;

  /** The closed chain of a field vector. */
  export type IChain = S.IChain;

  /** The limb layout of the given median depth. */
  export const limb: (depth: number) => ILayout = S.limb;

  /** The bilateral layout of the given median depth. */
  export const bilateral: (depth: number) => ILayout = S.bilateral;

  /** The lens layout (`AutoMovieHumanConicSection.lens`). */
  export const lens: (depth: number) => ILayout = S.lens;

  /**
   * The limb layout of the given median depth with a groove after each listed anchor: two inflections and the groove's own median between
   * them, `[i, m, i]`, the inflections a level deeper than every median and the groove's median a level deeper again, so each inflection
   * stands on the chord of the anchors round it and the groove's floor on the triangle of its two inflections. Across a family the
   * inflections' shares and turns are fields like every other (natural cubics on the family's knots), so each groove's two inflection lines
   * run along the stations as smooth curves, the way an aircraft's lofting draws a concavity with one more control line.
   *
   * @param depth The limb's median depth.
   * @param after Indices into `limb(depth).anchors` after which a groove stands, each at most once.
   * @param base The layout the grooves go into, of that median depth; absent, the limb's. A half-fitted part (`bilateral`) takes each
   *   groove once and its mirror gives the other side its own, as a nose's two supra-alar creases.
   */
  export function inflected(depth: number, after: readonly number[], base: ILayout = limb(depth)): ILayout {
    return {
      mirror: base.mirror,
      anchors: base.anchors.flatMap((anchor: IAnchor, k: number): IAnchor[] =>
        after.includes(k) ? [anchor, { kind: "i", level: depth + 1 }, { kind: "m", level: depth + 2 }, { kind: "i", level: depth + 1 }] : [anchor],
      ),
    };
  }

  /**
   * A layout whose anchors stand on the part's named feature lines: after each listed anchor of `base`, the given feature anchors (`f`), each
   * a point with its own tangent whose numbers are fields along the stations, so every feature line (a tip's ridge, a wing's top, a groove's
   * floor and the inflections beside it) is a smooth longitudinal control curve, as an aircraft's lofting draws them. A groove is three of
   * them, an inflection, the concave floor and an inflection, each seeded on its own section in its phase window (`feature`); where the
   * groove fades the three lie on a smooth stretch, which no `i` anchor allows, since an `i` forces an S on every section.
   *
   * @param base The layout the features go into.
   * @param features After which anchor of `base` each run of feature anchors stands.
   */
  export function featured(base: ILayout, features: readonly { after: number; anchors: IAnchor[] }[]): ILayout {
    return {
      mirror: base.mirror,
      anchors: base.anchors.flatMap((anchor: IAnchor, k: number): IAnchor[] => [anchor, ...features.filter((f): boolean => f.after === k).flatMap((f): IAnchor[] => f.anchors)]),
    };
  }

  /**
   * Whether one conic arc joins `p0` leaving along `t0` to `p1` arriving along `t1`: the two tangents stand on opposite sides of the chord
   * and their lines meet ahead of the start and behind the end, as the engine's native chain asks of every arc; with `margin`, at least
   * that share of the chord ahead and behind, for unit tangents (`FamilyConicFit.ADMISSIBLE_MARGIN`).
   */
  export function arc(p0: readonly number[], t0: readonly number[], p1: readonly number[], t1: readonly number[], margin: number = 0): boolean {
    const c: P = [p1[0]! - p0[0]!, p1[1]! - p0[1]!];
    const side = (d: readonly number[]): number => c[0] * d[1]! - c[1] * d[0]!;
    const det: number = t0[0]! * t1[1]! - t0[1]! * t1[0]!;
    if (det === 0 || side(t0) * side(t1) >= 0) return false;
    const s: number = (c[0] * t1[1]! - c[1] * t1[0]!) / det;
    const q: number = (t0[0]! * c[1] - t0[1]! * c[0]) / det;
    const chord: number = Math.hypot(c[0], c[1]) * margin;
    return s > chord && q > chord;
  }
  /** Unit of every field of a layout. */
  export const units: (layout: ILayout) => Unit[] = S.units;

  /** Resolve a field vector into its closed chain. */
  export const resolve: (values: readonly number[], layout: ILayout) => IChain = S.resolve;

  /** Build the engine's native conic chain from a field vector. */
  export const chain: (values: readonly number[], layout: ILayout) => Q.ISection = S.chain;

  /** A stored shoulder as the model reads it, inside its bounds. */
  export const shoulder: (value: number, layout: ILayout) => number = S.shoulder;

  /** The field vector with the two arcs at an anchor given the shoulders that make the curvature continuous there. */
  export const continuous: (values: readonly number[], layout: ILayout, k: number) => number[] = S.continuous;

  /** The two anchors a feature anchor stands between (`AutoMovieHumanConicSection.frame`). */
  export const frame: typeof S.frame = S.frame;

  /** A feature point's numbers on the chord of its frame (`AutoMovieHumanConicSection.unplace`). */
  export const unplace: typeof S.unplace = S.unplace;

  /** Where along its run's chord a feature stands past the one before it (`AutoMovieHumanConicSection.along`). */
  export const along: typeof S.along = S.along;

  /** Offsets of every anchor's first field, and of the first shoulder. */
  export const offsets: typeof S.offsets = S.offsets;
  const dependents: typeof S.dependents = S.dependents;
  const neighbours: typeof S.neighbours = S.neighbours;
  const clamp: typeof S.clamp = S.clamp;
  const meet: typeof S.meet = S.meet;

  /**
   * Carry a limb section one median level deeper without changing its curve:
   * a conic of middle weight `w = rho / (1 - rho)` cut at its median point
   * leaves two conics of middle weight `sqrt((1 + w) / 2)` (the rational de
   * Casteljau step at `t = 1/2` with the end weights renormalised to one;
   * Farin, "Curves and Surfaces for CAGD", rational subdivision), and the
   * median point stands at the share `rho`.
   *
   * @param values A field vector of `limb(depth)`.
   * @param depth That depth.
   * @returns The same curve as a field vector of `limb(depth + 1)`.
   */
  export function refine(values: readonly number[], depth: number): number[] {
    const from: ILayout = limb(depth);
    const { at, shoulders }: { at: number[]; shoulders: number } = offsets(from);
    const out: number[] = [];
    const halves: number[] = [];
    from.anchors.forEach((anchor: IAnchor, k: number): void => {
      const rho: number = clamp(values[shoulders + k]!);
      const w: number = Math.sqrt((1 + rho / (1 - rho)) / 2);
      out.push(...values.slice(at[k]!, at[k]! + (anchor.kind === "m" ? 1 : 2)), rho);
      halves.push(w / (1 + w), w / (1 + w));
    });
    return [...out, ...halves];
  }

  /**
   * Radius of a closed polygon along one ray from the chart origin.
   *
   * A star-shaped section meets every ray once. Where a faceted source meets
   * it more than once the outermost hit is returned and `folds` counts the
   * event, so the caller reports the non-star interval instead of losing it.
   */
  export function radius(points: readonly P[], phi: number, folds?: { count: number }): number {
    const d: P = [Math.cos(phi), Math.sin(phi)];
    let best: number = NaN;
    let hits: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const a: P = points[i]!;
      const b: P = points[(i + 1) % points.length]!;
      const sa: number = a[0] * d[1] - a[1] * d[0];
      const sb: number = b[0] * d[1] - b[1] * d[0];
      if ((sa > 0) === (sb > 0)) continue;
      const t: number = sa / (sa - sb);
      const r: number = (1 - t) * (a[0] * d[0] + a[1] * d[1]) + t * (b[0] * d[0] + b[1] * d[1]);
      if (!(r > 0)) continue;
      ++hits;
      if (!(best >= r)) best = r;
    }
    if (hits > 1 && folds !== undefined) ++folds.count;
    return best;
  }

  /**
   * A closed polygon with its corner at point `index` drawn round by an arc of `radius` mm tangent to its two sides, the sides' directions read
   * over `span` mm either side: the arc's tangent points stand `radius / tan(alpha / 2)` from the corner, `alpha` the corner's angle, and
   * the points between them are replaced by `count` points on the arc. A corner too blunt to need it, or one whose tangent points would pass
   * the span, is returned unchanged; so is a polygon whose corner turns the other way when `convex` (the default) asks for a convex one.
   *
   * @returns The new polygon and how far its corner moved in, mm (`radius / sin(alpha / 2) - radius`).
   */
  export function fillet(points: readonly P[], index: number, radius: number, span: number = 2, count: number = 12, convex: boolean = true): { points: P[]; closed: number } {
    const n: number = points.length;
    const walk = (direction: 1 | -1, mm: number): { k: number; length: number } => {
      let k: number = index;
      let length: number = 0;
      while (length < mm) {
        const next: number = (k + direction + n) % n;
        length += Math.hypot(points[next]![0] - points[k]![0], points[next]![1] - points[k]![1]);
        k = next;
        if (k === index) break;
      }
      return { k, length };
    };
    const c: P = points[index]!;
    const a: P = points[walk(-1, span).k]!;
    const b: P = points[walk(1, span).k]!;
    const unit = (p: P, q: P): P => { const l: number = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };
    const d1: P = unit(a, c);
    const d2: P = unit(c, b);
    const cross: number = d1[0] * d2[1] - d1[1] * d2[0];
    const turn: number = Math.atan2(cross, d1[0] * d2[0] + d1[1] * d2[1]);
    if ((convex && turn <= 0) || (!convex && turn >= 0) || Math.abs(turn) < 1e-3) return { points: [...points], closed: 0 };
    const alpha: number = Math.PI - Math.abs(turn);
    const tangent: number = radius / Math.tan(alpha / 2);
    if (!(tangent < span)) return { points: [...points], closed: 0 };
    const t1: P = [c[0] - tangent * d1[0], c[1] - tangent * d1[1]];
    const t2: P = [c[0] + tangent * d2[0], c[1] + tangent * d2[1]];
    const inward: P = unit([0, 0], [d2[0] - d1[0], d2[1] - d1[1]]);
    const centre: P = [c[0] + (radius / Math.sin(alpha / 2)) * inward[0], c[1] + (radius / Math.sin(alpha / 2)) * inward[1]];
    const from: number = Math.atan2(t1[1] - centre[1], t1[0] - centre[0]);
    let sweep: number = Math.atan2(t2[1] - centre[1], t2[0] - centre[0]) - from;
    while (sweep > Math.PI) sweep -= 2 * Math.PI;
    while (sweep < -Math.PI) sweep += 2 * Math.PI;
    const arc: P[] = Array.from({ length: count + 1 }, (_: unknown, j: number): P => [centre[0] + radius * Math.cos(from + (sweep * j) / count), centre[1] + radius * Math.sin(from + (sweep * j) / count)]);
    const before: number = walk(-1, tangent).k;
    const after: number = walk(1, tangent).k;
    const out: P[] = [];
    for (let k: number = after; k !== before; k = (k + 1) % n) out.push(points[k]!);
    out.push(points[before]!, ...arc);
    return { points: out, closed: radius / Math.sin(alpha / 2) - radius };
  }

  /** The least turning, radians, that counts as a feature: an inflection's strength from which its line stands wholly on it. */
  const FEATURE_LEAST: number = 0.05;

  /** Step of the headings a feature's seed tangent is searched in where its reading does not make both its arcs conics, radians. */
  const FEATURE_STEP: number = 0.01;

  /** The share of its chord a seeded feature's arcs keep between their tangent lines' meeting and their ends: over the fit's 0.02 margin. */
  const SEED_MARGIN: number = 0.05;

  /** One end of an arc of a section's conic conversion: its point, its unit tangent, whether its two arcs bend opposite ways, and the arc it starts. */
  interface IEnd {
    point: P;
    tangent: P;
    inflection: boolean;
    strength?: number;
    arc: { controls: readonly [readonly [number, number], readonly [number, number], readonly [number, number]]; weight: number } | null;
  }

  /**
   * Fairing cutoff of a section before its conversion, mm of girth: the wavelength the fairing halves. lofting.md: "fair each section to
   * the scale of the form, which means removing the ripples smaller than the features the form keeps". f1's ripple is its facets': the
   * sections' turning per unit arclength peaks at 9 to 14 mm of wavelength on the trunk (the median of each 100 mm stretch). The narrowest
   * grooves the form keeps, the linea alba's and the sternal groove's, are 12 to 20 mm wide. A cutoff at the grooves' upper width takes a
   * 14 mm ripple to a fifth while the front median and back grooves keep their inflections on the chest (450 to 600 mm), and on the abdomen (300 to 400 mm) it leaves
   * 2.4 inflections on a side's back quarter where the least-squares cubic B-spline with a control every 6 mm left 11.8: that ripple, cut
   * by the converter into arcs at every inflection, spent its arc budget and the rest of the turn was dropped (a partial conversion).
   */
  const FAIR_MM: number = 20;

  /** The least share of its run's arclength a feature line keeps from the run's ends: the model's `EDGE` of 0.03 on the chord, with a margin. */
  const LINE_EDGE: number = 0.05;

  /** The recovery converter's sampled tolerance on a faired section, mm, and its work limits. */
  const CONVERT: { toleranceMm: number; maximumArcs: number; maximumDepth: number } = { toleranceMm: 0.25, maximumArcs: 256, maximumDepth: 16 };

  /**
   * A section's conic conversion: its radius faired as the periodic smoothing spline of curvature penalty in phase, its half-power
   * wavelength `FAIR_MM` of girth, converted by Ahn's conic approximation (`approximateAutoMovieRecoveryConicsAhn`), and the ends of its
   * arcs with their tangents.
   */
  function converted(points: readonly P[]): { ends: IEnd[]; at: (phi: number) => { point: P; tangent: P } } {
    const M: number = 720;
    const radii: number[] = Array.from({ length: M }, (_: unknown, k: number): number => radius(points, (2 * Math.PI * k) / M));
    let girth: number = 0;
    for (let i: number = 0; i < points.length; ++i) girth += Math.hypot(points[(i + 1) % points.length]![0] - points[i]![0], points[(i + 1) % points.length]![1] - points[i]![1]);
    // The periodic smoothing spline that penalises the radius's second derivative is, in the trigonometric basis, each harmonic n of the
    // data shrunk by 1 / (1 + lambda n^4) (Wahba, Spline Models for Observational Data, 1990, ch. 2, the periodic space W2), a roll-off that
    // passes the form and halves the harmonic whose wavelength is the cutoff: lambda = (FAIR_MM / girth)^4. A least-squares spline on
    // fixed controls has no such cutoff: at a control every 6 mm it followed f1's facets.
    const H: number = M / 2;
    const A: number[] = [], B: number[] = [], W: number[] = [];
    const cut: number = girth / FAIR_MM;
    for (let n: number = 0; n <= H; ++n) {
      let a: number = 0, b: number = 0;
      for (let k: number = 0; k < M; ++k) {
        a += radii[k]! * Math.cos((2 * Math.PI * n * k) / M);
        b += radii[k]! * Math.sin((2 * Math.PI * n * k) / M);
      }
      const half: boolean = n === 0 || n === H;
      A.push(((half ? 1 : 2) * a) / M);
      B.push(((half ? 1 : 2) * b) / M);
      W.push(1 / (1 + (n / cut) ** 4));
    }
    // r's derivative of an order: each harmonic's a cos + b sin turned by the order's quarter turns, its own number to the order a factor.
    const rAt = (phi: number, order: number): number => {
      const c1: number = Math.cos(phi), s1: number = Math.sin(phi);
      let c: number = 1, s: number = 0, even: number = 0, odd: number = 0;
      for (let n: number = 0; n <= H; ++n) {
        const f: number = W[n]! * n ** order;
        even += f * (A[n]! * c + B[n]! * s);
        odd += f * (B[n]! * c - A[n]! * s);
        [c, s] = [c * c1 - s * s1, s * c1 + c * s1];
      }
      return [even, odd, -even, -odd][order % 4]!;
    };
    // The curve p(phi) = r(phi) e(phi), e = (cos, sin): its derivatives by Leibniz's rule, e's k-th derivative being e turned by k quarter turns.
    const binomial = (n: number, k: number): number => (k === 0 || k === n ? 1 : binomial(n - 1, k - 1) + binomial(n - 1, k));
    const curve = {
      // The closed curve's seam, where the converter starts and ends, at an eighth of a turn: started on the median line (phase 0), the
      // converter cut dozens of short arcs there whose bends flipped sign, a concavity and inflections on the front median of a section with
      // none (f1's made falling groove at 0 mm).
      domain: [Math.PI / 4, Math.PI / 4 + 2 * Math.PI] as const,
      breaks: [] as number[],
      closed: true,
      evaluate: (phi: number): readonly [number, number] => [rAt(phi, 0) * Math.cos(phi), rAt(phi, 0) * Math.sin(phi)],
      derivative: (phi: number, order: 1 | 2 | 3 | 4 | 5): readonly [number, number] => {
        let x: number = 0, y: number = 0;
        for (let j: number = 0; j <= order; ++j) {
          const c: number = binomial(order, j) * rAt(phi, j);
          const q: number = order - j;
          x += c * Math.cos(phi + (q * Math.PI) / 2);
          y += c * Math.sin(phi + (q * Math.PI) / 2);
        }
        return [x, y];
      },
    };
    const result = approximateAutoMovieRecoveryConicsAhn(curve, CONVERT);
    const arcs = [...result.arcs].sort((p, q): number => p.domain[0] - q.domain[0]);
    // The converter fits no interval whose curvature changes sign, so it bisects toward each inflection to its depth limit and leaves the
    // last sliver there (the domain over 2 to the depth) unresolved: a partial result made only of such slivers is the whole section. Each
    // of its leaves ends an arc or unresolved, so while its arc budget lasts its arcs and slivers number at most `maximumArcs`; past it, it
    // leaves wider stretches unconverted and they number more. Then the chain read across them is not the section (f1's ripple at a 6 mm
    // fairing: at station 28 the chain stopped at 107 degrees and the ray at phase 0 met nothing), so it is refused rather than drawn.
    const sliver: number = (curve.domain[1] - curve.domain[0]) / 2 ** CONVERT.maximumDepth;
    const covered: number = arcs.reduce((sum: number, arc): number => sum + (arc.domain[1] - arc.domain[0]), 0);
    const slivers: number = (curve.domain[1] - curve.domain[0] - covered) / sliver;
    if (arcs.length + slivers > CONVERT.maximumArcs + 0.5)
      throw new Error(`the section's conic conversion ran out of arcs (${arcs.length} arcs, ${slivers.toFixed(0)} slivers' width unconverted): ${result.diagnostics.join(" / ")}`);
    const bend = (arc: (typeof arcs)[number]): number => {
      const [p0, p1, p2] = arc.controls;
      return Math.sign((p1[0] - p0[0]) * (p2[1] - p1[1]) - (p1[1] - p0[1]) * (p2[0] - p1[0]));
    };
    // An arc's turn: the angle between its two end tangents (its control legs).
    const turnOf = (arc: (typeof arcs)[number]): number => {
      const [p0, p1, p2] = arc.controls;
      const d: number = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) - Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      return Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
    };
    const ends: IEnd[] = arcs.map((arc, i: number): IEnd => {
      const before = arcs[(i - 1 + arcs.length) % arcs.length]!;
      const [p0, p1] = arc.controls;
      const l: number = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
      // An inflection's strength: the lesser of the two bends it joins, each the whole turn of the arcs on its side that bend the same way
      // (an adaptive conversion cuts one bend into several short arcs, each of which turns little).
      const side = (from: number, step: 1 | -1): number => {
        const sign: number = bend(arcs[(from + arcs.length) % arcs.length]!);
        let sum: number = 0;
        for (let m: number = 0, j: number = from; m < arcs.length; ++m, j += step) {
          const piece = arcs[((j % arcs.length) + arcs.length) % arcs.length]!;
          if (bend(piece) !== sign) break;
          sum += turnOf(piece);
        }
        return sum;
      };
      return { point: [p0[0], p0[1]], tangent: [(p1[0] - p0[0]) / l, (p1[1] - p0[1]) / l], inflection: bend(before) * bend(arc) < 0, arc: { controls: arc.controls, weight: arc.weight }, strength: Math.min(side(i - 1, -1), side(i, 1)) };
    });
    return {
      ends,
      // The section as converted: the conic chain itself, not the faired curve, so a concavity the conversion leaves under its tolerance
      // is not drawn between an extreme and a feature that the chain shows no inflection between.
      at: (phi: number): { point: P; tangent: P } => {
        const got: IEnd = split(ends, phi);
        return { point: got.point, tangent: got.tangent };
      },
    };
  }

  /** The point of a section's conversion at a phase, on the arc that spans it, and its tangent: an exact split of that conic. */
  function split(ends: readonly IEnd[], phi: number): IEnd {
    const phase = (q: readonly number[]): number => Math.atan2(q[1]!, q[0]!);
    const off = (x: number): number => (((x - phi) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    // The arc whose start lies last before the phase.
    const arc: IEnd = ends.reduce((best: IEnd, end: IEnd): IEnd => (off(phase(end.point)) > off(phase(best.point)) ? end : best));
    const [p0, p1, p2] = arc.arc!.controls;
    const w: number = arc.arc!.weight;
    const at = (t: number): { point: P; tangent: P } => {
      const b0: number = (1 - t) ** 2, b1: number = 2 * t * (1 - t) * w, b2: number = t * t;
      const D: number = b0 + b1 + b2;
      const N: P = [b0 * p0[0] + b1 * p1[0] + b2 * p2[0], b0 * p0[1] + b1 * p1[1] + b2 * p2[1]];
      const dD: number = -2 * (1 - t) + 2 * (1 - 2 * t) * w + 2 * t;
      const dN: P = [-2 * (1 - t) * p0[0] + 2 * (1 - 2 * t) * w * p1[0] + 2 * t * p2[0], -2 * (1 - t) * p0[1] + 2 * (1 - 2 * t) * w * p1[1] + 2 * t * p2[1]];
      const d: P = [dN[0] * D - N[0] * dD, dN[1] * D - N[1] * dD];
      const l: number = Math.hypot(d[0], d[1]) || 1;
      return { point: [N[0] / D, N[1] / D], tangent: [d[0] / l, d[1] / l] };
    };
    let lo: number = 0, hi: number = 1;
    const start: number = phase(p0);
    const span: number = (((phase(p2) - start) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const target: number = (((phi - start) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    for (let i: number = 0; i < 50; ++i) {
      const m: number = (lo + hi) / 2;
      const o: number = (((phase(at(m).point) - start) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      if (o < Math.min(target, span)) lo = m;
      else hi = m;
    }
    const got = at((lo + hi) / 2);
    return { point: got.point, tangent: got.tangent, inflection: false, arc: null };
  }

  /**
   * Seeds of a family's sections in station order, their feature lines tracked along the stations. A line is an identity along the
   * stations, not a slot of one section (lofting.md: an inflection line is "drawn like the outlines"): each run's inflection-kind features
   * are lines that start at their windows' middles; on each section, faired and converted (`converted`), the conversion's inflections in the
   * run are matched to the lines in order, each to the line whose share of the run's arclength on the section before lies nearest, and a
   * matched line moves toward its inflection by the C2 ramp of the inflection's strength (the lesser turn of its two arcs; 0 below half
   * `FEATURE_LEAST`, 1 above it), so a line is born and dies at its tracked place as its pair's turn crosses zero, never by a jump: a hard
   * switch in a target becomes a crease however finely it is sampled (construction.md). A convex or concave feature stands at a fixed share
   * between the inflection lines (or the run's extremes) either side of it. Every feature is the faired section's own point and tangent at
   * its share. Seeded each on its own, the features were reassigned whenever the conversion's inflection count changed, and jumped up to
   * 60 mm between sections 2 mm apart where a groove faded (`groove-check`).
   *
   * @param sections The sections' observed polygons, in station order.
   * @param layout The family's layout.
   */
  export function seedAll(sections: readonly (readonly P[])[], layout: ILayout): number[][] {
    const K: number = layout.anchors.length;
    if (!layout.anchors.some((a: IAnchor): boolean => a.kind === "f")) return sections.map((points: readonly P[]): number[] => seed(points, layout));
    const lines: Map<number, number[]> = new Map();
    // Whether a line has ever had its inflection: a line that never had one keeps its window's place, and only a line whose inflection fades goes to its meeting point.
    const lived: Map<number, boolean[]> = new Map();
    const ramp = (s: number): number => {
      const x: number = Math.min(1, Math.max(0, (s - FEATURE_LEAST / 2) / (FEATURE_LEAST / 2)));
      return x * x * x * (10 - 15 * x + 6 * x * x);
    };
    return sections.map((points: readonly P[]): number[] => {
      // The section is read faired throughout, its extremes and medians too, so the anchors and the features stand on one curve: read off
      // the raw section, a median on a 1.7 mm groove's floor stood inside the faired curve its features stand on, and the arc between them
      // needed an S.
      const conversion = converted(points);
      const faired: P[] = Array.from({ length: 1440 }, (_: unknown, i: number): P => conversion.at((2 * Math.PI * i) / 1440).point);
      return seed(faired, layout, (found: readonly (P | null)[], tangentOf: readonly (P | null)[]): Map<number, { point: P; tangent: P }> => {
        const out: Map<number, { point: P; tangent: P }> = new Map();
        layout.anchors.forEach((anchor: IAnchor, k: number): void => {
          if (anchor.kind !== "f" || (k > 0 && layout.anchors[k - 1]!.kind === "f")) return;
          const run: number[] = [];
          for (let j: number = k; layout.anchors[j % K]!.kind === "f"; ++j) run.push(j % K);
          const [fb, fa]: [number, number] = S.frame(k, layout);
          const a: number = Math.atan2(found[fb]![1], found[fb]![0]);
          const span: number = (((Math.atan2(found[fa]![1], found[fa]![0]) - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          // The run's arclength on the faired section, sampled at 400 phases: a share and its phase both ways.
          const phis: number[] = Array.from({ length: 401 }, (_: unknown, i: number): number => a + (span * i) / 400);
          const lengths: number[] = [0];
          for (let i: number = 1; i <= 400; ++i) {
            const p: P = conversion.at(phis[i - 1]!).point, q: P = conversion.at(phis[i]!).point;
            lengths.push(lengths[i - 1]! + Math.hypot(q[0] - p[0], q[1] - p[1]));
          }
          const total: number = lengths[400]! || 1;
          const shareOf = (phi: number): number => {
            const o: number = (((phi - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            const x: number = (o / span) * 400;
            const i: number = Math.min(399, Math.max(0, Math.floor(x)));
            return (lengths[i]! + (x - i) * (lengths[i + 1]! - lengths[i]!)) / total;
          };
          const phiOf = (share: number): number => {
            const target: number = share * total;
            let i: number = 0;
            while (i < 399 && lengths[i + 1]! < target) ++i;
            const piece: number = lengths[i + 1]! - lengths[i]! || 1;
            return phis[i]! + ((target - lengths[i]!) / piece) * (span / 400);
          };
          // The run's inflection lines, their tracked shares.
          const kinds: number[] = run.filter((j: number): boolean => layout.anchors[j]!.feature === "inflection");
          const tracked: number[] = lines.get(k) ?? kinds.map((j: number): number => {
            const w: [number, number] = layout.anchors[j]!.window ?? [0.1, 0.9];
            return (w[0] + w[1]) / 2;
          });
          // The conversion's inflections inside the run, by share, and their strengths.
          const seen: { share: number; strength: number }[] = conversion.ends
            .filter((end: IEnd): boolean => end.inflection)
            .map((end: IEnd): { share: number; strength: number } => ({ share: shareOf(Math.atan2(end.point[1], end.point[0])), strength: end.strength ?? 0 }))
            .filter((x: { share: number; strength: number }): boolean => x.share > 0.001 && x.share < 0.999)
            .sort((x, y): number => x.share - y.share);
          // An order-keeping match of the inflections to the lines, least total distance from each line's last share (dynamic programming).
          const L: number = tracked.length, Fn: number = seen.length;
          const cost: number[][] = Array.from({ length: Fn + 1 }, (): number[] => new Array<number>(L + 1).fill(Infinity));
          const choice: number[][] = Array.from({ length: Fn + 1 }, (): number[] => new Array<number>(L + 1).fill(0));
          for (let j: number = 0; j <= L; ++j) cost[0]![j] = 0;
          for (let i: number = 1; i <= Fn; ++i)
            for (let j: number = 1; j <= L; ++j) {
              const skipLine: number = cost[i]![j - 1]!;
              const skipSeen: number = cost[i - 1]![j]! + 1;
              const take: number = cost[i - 1]![j - 1]! + Math.abs(seen[i - 1]!.share - tracked[j - 1]!);
              const best: number = Math.min(skipLine, skipSeen, take);
              cost[i]![j] = best;
              choice[i]![j] = best === take ? 2 : best === skipLine ? 1 : 0;
            }
          const next: number[] = [...tracked];
          const strengths: number[] = tracked.map((): number => 0);
          const alive: boolean[] = lived.get(k) ?? tracked.map((): boolean => false);
          lived.set(k, alive);
          for (let i: number = Fn, j: number = L; i > 0 && j > 0; ) {
            if (choice[i]![j] === 2) {
              // A line follows its inflection wherever it moves on by little (a twentieth of the run between sections), so it goes where
              // its groove goes as the groove fades and dies on the groove's floor; a far move, a birth away from the line, is taken by
              // the ramp of the inflection's strength.
              const move: number = seen[i - 1]!.share - tracked[j - 1]!;
              next[j - 1] = tracked[j - 1]! + (Math.abs(move) < 0.05 ? 1 : ramp(seen[i - 1]!.strength)) * move;
              strengths[j - 1] = seen[i - 1]!.strength;
              alive[j - 1] = true;
              --i;
              --j;
            } else if (choice[i]![j] === 1) --j;
            else --i;
          }
          // Lines keep their order with a least gap.
          for (let j: number = 1; j < next.length; ++j) next[j] = Math.max(next[j]!, next[j - 1]! + 0.01);
          lines.set(k, next);
          // Every feature of the run at its share: an inflection line's own, a convex or concave feature at equal steps between the lines
          // (or the run's ends) either side of it.
          const shares: number[] = run.map((): number => NaN);
          // A fading line goes to where its inflection pair annihilates: a concavity vanishes when its two bounding inflections meet, where
          // the curvature and its derivative are both zero. The pair of a run's first line next to a median extreme is its own mirror twin,
          // so they meet on the median; any other line's pair is its nearer neighbouring line, and they meet midway. The line stands at that
          // meeting point moved toward its inflection by the C2 ramp of the inflection's strength, so as the groove fades the line reaches
          // the meeting point with its turn gone, and the chain there is the base conic. Left where its inflection vanished, a line on a
          // fading median groove stood 8 mm off the median on a stretch the groove no longer bent, and the arc from the median needed an S.
          const median: boolean = layout.anchors[fb]!.mid === true;
          kinds.forEach((j: number, i: number): void => {
            const neighbour: number = i === 0 ? (median ? NaN : next[1] ?? NaN) : i === next.length - 1 ? next[i - 1]! : Math.abs(next[i - 1]! - next[i]!) < Math.abs(next[i + 1]! - next[i]!) ? next[i - 1]! : next[i + 1]!;
            const meeting: number = i === 0 && median ? 0 : Number.isNaN(neighbour) ? next[i]! : (next[i]! + neighbour) / 2;
            const shown: number = alive[i] ? meeting + ramp(strengths[i]!) * (next[i]! - meeting) : next[i]!;
            // Kept inside the model's share bound with a margin: the model reads a feature's share along its frame's chord and clamps
            // it to [EDGE, 1 - EDGE] (`AutoMovieHumanConicSection.along`), and a line at 3% of its run's arclength stood at 2.9% of the
            // chord on the made section, so the model moved it along the chord and the arc from the median needed an S.
            shares[run.indexOf(j)] = Math.min(1 - LINE_EDGE, Math.max(LINE_EDGE, shown));
          });
          for (let i: number = 0; i < run.length; ++i) {
            if (!Number.isNaN(shares[i]!)) continue;
            let lo: number = i - 1;
            while (lo >= 0 && Number.isNaN(shares[lo]!)) --lo;
            let hi: number = i + 1;
            while (hi < run.length && Number.isNaN(shares[hi]!)) ++hi;
            const from: number = lo < 0 ? 0 : shares[lo]!, to: number = hi >= run.length ? 1 : shares[hi]!;
            for (let m: number = lo + 1; m < hi; ++m) shares[m] = from + ((to - from) * (m - lo)) / (hi - lo);
          }
          // A fading line's point and tangent go by the same ramp to the base conic's at its share: the one conic from the run's first
          // extreme to its other, the extremes' tangents meeting at the box's corner, its shoulder where the section crosses its median line.
          // The share bound (`EDGE`) stops a line at 3% of its run short of a median meeting point, and there the converted chain still
          // carried the fading groove's concavity (its tangent turned outward by 0.21 to 0.08 of a unit at 2.4 to 0.96 mm deep, f1's made
          // falling groove), so the arc from the median needed an S; on the base conic the stop is a piece of one admissible arc.
          const q0: P = found[fb]!, q2: P = found[fa]!;
          const corner: P = meet(q0, tangentOf[fb]!, q2, tangentOf[fa]!);
          const rho: number = Math.min(0.97, Math.max(0.03, crossing(faired, [(q0[0] + q2[0]) / 2, (q0[1] + q2[1]) / 2], corner)));
          const wb: number = rho / (1 - rho);
          const baseAt = (t: number): { point: P; tangent: P } => {
            const b0: number = (1 - t) ** 2, b1: number = 2 * t * (1 - t) * wb, b2: number = t * t;
            const D: number = b0 + b1 + b2;
            const N: P = [b0 * q0[0] + b1 * corner[0] + b2 * q2[0], b0 * q0[1] + b1 * corner[1] + b2 * q2[1]];
            const dD: number = -2 * (1 - t) + 2 * (1 - 2 * t) * wb + 2 * t;
            const d: P = [-2 * (1 - t) * q0[0] + 2 * (1 - 2 * t) * wb * corner[0] + 2 * t * q2[0] - (N[0] * dD) / D, -2 * (1 - t) * q0[1] + 2 * (1 - 2 * t) * wb * corner[1] + 2 * t * q2[1] - (N[1] * dD) / D];
            const l: number = Math.hypot(d[0], d[1]) || 1;
            return { point: [N[0] / D, N[1] / D], tangent: [d[0] / l, d[1] / l] };
          };
          const baseLengths: number[] = [0];
          for (let i: number = 1; i <= 400; ++i) {
            const p: P = baseAt((i - 1) / 400).point, q: P = baseAt(i / 400).point;
            baseLengths.push(baseLengths[i - 1]! + Math.hypot(q[0] - p[0], q[1] - p[1]));
          }
          const baseShare = (share: number): { point: P; tangent: P } => {
            const target: number = share * baseLengths[400]!;
            let i: number = 0;
            while (i < 399 && baseLengths[i + 1]! < target) ++i;
            const piece: number = baseLengths[i + 1]! - baseLengths[i]! || 1;
            return baseAt((i + (target - baseLengths[i]!) / piece) / 400);
          };
          run.forEach((j: number, i: number): void => {
            const onChain = conversion.at(phiOf(shares[i]!));
            const line: number = kinds.indexOf(j);
            if (line < 0 || !alive[line]) return void out.set(j, onChain);
            const r: number = ramp(strengths[line]!);
            const onBase = baseShare(shares[i]!);
            const turned: number = Math.atan2(onChain.tangent[1], onChain.tangent[0]) - Math.atan2(onBase.tangent[1], onBase.tangent[0]);
            const heading: number = Math.atan2(onBase.tangent[1], onBase.tangent[0]) + r * Math.atan2(Math.sin(turned), Math.cos(turned));
            out.set(j, { point: [onBase.point[0] + r * (onChain.point[0] - onBase.point[0]), onBase.point[1] + r * (onChain.point[1] - onBase.point[1])], tangent: [Math.cos(heading), Math.sin(heading)] });
          });
        });
        return out;
      });
    });
  }

  /** Feature anchors placed from outside (`seedAll`): each listed anchor's point and unit tangent. */
  export type Placement = (found: readonly (P | null)[], tangent: readonly (P | null)[]) => Map<number, { point: P; tangent: P }>;

  /**
   * A starting field vector read from one observed polygon: each extreme in
   * its window, each median and inflection where the polygon crosses its
   * segment, and each shoulder where the polygon crosses its arc's median.
   * The joint fit owns the final values; this only has to be admissible.
   */
  export function seed(points: readonly P[], layout: ILayout, place?: Placement): number[] {
    const K: number = layout.anchors.length;
    const values: number[] = [];
    const found: (P | null)[] = new Array<P | null>(K).fill(null);
    const tangent: (P | null)[] = new Array<P | null>(K).fill(null);
    const at: number[] = [];
    layout.anchors.forEach((anchor: IAnchor, k: number): void => {
      at.push(values.length);
      if (anchor.kind === "m") values.push(0.5);
      else if (anchor.kind === "i") values.push(0.5, 0);
      else if (anchor.kind === "f") values.push(0, 0, 0);
      else {
        const axis: 0 | 1 = anchor.kind === "u" ? 0 : 1;
        let p: P;
        if (anchor.mid === true) {
          const front: boolean = anchor.window === undefined || Math.cos((anchor.window[0] + anchor.window[1]) / 2) > 0;
          p = [(front ? 1 : -1) * radius(points, front ? 0 : Math.PI), 0];
        } else {
          const inside: P[] = points.filter((q: P): boolean => {
            if (anchor.window === undefined) return true;
            let phi: number = Math.atan2(q[1], q[0]);
            while (phi < anchor.window[0]) phi += 2 * Math.PI;
            return phi <= anchor.window[1];
          });
          const sign: number = anchor.pick === "max" ? 1 : anchor.pick === "min" ? -1 : 0;
          p = inside.reduce((a: P, b: P): P => ((sign === 0 ? Math.abs(b[axis]) > Math.abs(a[axis]) : sign * b[axis] > sign * a[axis]) ? b : a));
        }
        found[k] = p;
        tangent[k] = axis === 0 ? [0, p[0] > 0 ? 1 : -1] : [p[1] > 0 ? -1 : 1, 0];
        if (anchor.mid === true) values.push(p[0]);
        else values.push(p[0], p[1]);
      }
    });
    // Feature anchors from the section's own conic conversion (lofting.md, Fitting: "Before converting a source's sections to conic arcs,
    // fair each section to the scale of the form ... The arcs that remain after fairing set the family's layout: its outline and inflection
    // lines"): the section faired at `FAIR_MM` and converted by the recovery converter (`converted`), each run of features takes the
    // conversion's arc ends between its two extremes, its inflections first, in order along the run; where the run has fewer ends than
    // features, the longest piece is split exactly on its own conic until it has enough. Each feature's tangent is the conversion's there.
    // Read this way a feature moves with the section's own arcs, so a groove that fades moves its features continuously: read by a window
    // and the largest turn in it, a feature jumped up to 39.5 mm between sections 2 mm apart where a groove faded (`groove-check`).
    const placed: Map<number, { point: P; tangent: P }> | null = place === undefined ? null : place(found, tangent);
    const ends: IEnd[] = placed !== null ? [] : converted(points).ends;
    const phaseOf = (q: P): number => Math.atan2(q[1], q[0]);
    const within = (phi: number, a: number, b: number): boolean => {
      const span: number = (((b - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const off: number = (((phi - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      return off > 1e-9 && off < span - 1e-9;
    };
    if (placed !== null)
      placed.forEach((end: { point: P; tangent: P }, j: number): void => {
        found[j] = end.point;
        tangent[j] = end.tangent;
        values[at[j]!] = end.point[0];
        values[at[j]! + 1] = end.point[1];
        values[at[j]! + 2] = Math.atan2(end.tangent[1], end.tangent[0]);
      });
    layout.anchors.forEach((anchor: IAnchor, k: number): void => {
      if (anchor.kind !== "f" || placed !== null) return;
      if (k > 0 && layout.anchors[k - 1]!.kind === "f") return;
      // The run: this feature and those after it up to the next extreme.
      const run: number[] = [];
      for (let j: number = k; layout.anchors[j % K]!.kind === "f"; ++j) run.push(j % K);
      const [fb, fa]: [number, number] = S.frame(k, layout);
      const a: number = phaseOf(found[fb]!), b: number = phaseOf(found[fa]!);
      const offset = (phi: number): number => (((phi - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const inside: IEnd[] = ends.filter((end: IEnd): boolean => within(phaseOf(end.point), a, b)).sort((x: IEnd, y: IEnd): number => offset(phaseOf(x.point)) - offset(phaseOf(y.point)));
      // The conversion's inflections, in order; its other arc ends are where its adaptive subdivision happened to cut, which moves from
      // one section to the next, so the remaining features stand on exact splits of the converted curve instead (below).
      const chosen: IEnd[] = inside.filter((end: IEnd): boolean => end.inflection).slice(0, run.length);
      chosen.sort((x: IEnd, y: IEnd): number => offset(phaseOf(x.point)) - offset(phaseOf(y.point)));
      // Too few: split the longest piece between neighbouring chosen ends (or the extremes) on the conic that spans its middle.
      while (chosen.length < run.length) {
        const marks: number[] = [0, ...chosen.map((end: IEnd): number => offset(phaseOf(end.point))), offset(b)];
        let widest: number = 0;
        for (let i: number = 1; i < marks.length - 1; ++i) if (marks[i + 1]! - marks[i]! > marks[widest + 1]! - marks[widest]!) widest = i;
        const middle: number = a + (marks[widest]! + marks[widest + 1]!) / 2;
        chosen.splice(widest, 0, split(ends, middle));
        chosen.sort((x: IEnd, y: IEnd): number => offset(phaseOf(x.point)) - offset(phaseOf(y.point)));
      }
      run.forEach((j: number, i: number): void => {
        const end: IEnd = chosen[i]!;
        found[j] = end.point;
        tangent[j] = end.tangent;
        values[at[j]!] = end.point[0];
        values[at[j]! + 1] = end.point[1];
        values[at[j]! + 2] = Math.atan2(end.tangent[1], end.tangent[0]);
      });
    });
    // A conic arc's tangent lines meet ahead of its start and behind its end, on one side of its chord. Where a feature fades, its reading
    // is a straight stretch whose tangent need not make both its arcs conics; each feature's tangent is then the heading nearest its
    // reading, in steps of `FEATURE_STEP`, with which the arcs to the anchors before and after it are both conics, in order round the
    // resolved anchors, so the seed is a chain of conics.
    const resolved: number[] = layout.anchors.map((_: IAnchor, k: number): number => k).filter((k: number): boolean => found[k] !== null);
    // A fading feature stands on the skin, its own sagitta its offset, and its tangent is the nearest to the skin's with which both its
    // arcs keep `SEED_MARGIN` of their chords: seeded at the region's wall (`arc` at zero), 37 of the nose's 40 sections alone were refused
    // under the fit's margin before a step.
    const conic = (a: number, tA: P, b: number, tB: P): boolean => arc(found[a]!, tA, found[b]!, tB, SEED_MARGIN);
    resolved.forEach((k: number, r: number): void => {
      if (layout.anchors[k]!.kind !== "f") return;
      const before: number = resolved[(r + resolved.length - 1) % resolved.length]!;
      const after: number = resolved[(r + 1) % resolved.length]!;
      const reading: number = values[at[k]! + 2]!;
      for (let step: number = 0; step <= Math.PI / FEATURE_STEP; ++step) {
        const tried: number[] = step === 0 ? [reading] : [reading + step * FEATURE_STEP, reading - step * FEATURE_STEP];
        const fit: number | undefined = tried.find((h: number): boolean => {
          const d: P = [Math.cos(h), Math.sin(h)];
          return conic(before, tangent[before]!, k, d) && conic(k, d, after, tangent[after]!);
        });
        if (fit === undefined) continue;
        tangent[k] = [Math.cos(fit), Math.sin(fit)];
        values[at[k]! + 2] = fit;
        return;
      }
    });
    // Each feature's numbers as the model reads them: its share of what is left of its run's chord past the feature before it, its
    // offset square to that chord and its tangent's turn from the chord (`AutoMovieHumanConicSection.along`, `place`); each then stands
    // where the model puts it, so the medians are seeded on the chain the model draws.
    let previous: number = 0;
    layout.anchors.forEach((anchor: IAnchor, k: number): void => {
      if (anchor.kind !== "f") return;
      if (k === 0 || layout.anchors[k - 1]!.kind !== "f") previous = 0;
      const [before, after]: [number, number] = S.frame(k, layout);
      const read: { values: [number, number, number]; t: number } = S.unplace(found[before]!, found[after]!, found[k]!, values[at[k]! + 2]!, previous);
      [values[at[k]!], values[at[k]! + 1], values[at[k]! + 2]] = read.values;
      previous = S.along(previous, read.values[0]);
      const placed: { point: P; tangent: P } = S.place(found[before]!, found[after]!, previous, read.values[1], read.values[2]);
      found[k] = placed.point;
      tangent[k] = placed.tangent;
    });
    for (const k of dependents(layout)) {
      const [before, after]: [number, number] = neighbours(k, found);
      const p0: P = found[before]!;
      const p2: P = found[after]!;
      if (layout.anchors[k]!.kind === "m") {
        const corner: P = meet(p0, tangent[before]!, p2, tangent[after]!);
        const middle: P = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
        const f: number = crossing(points, middle, corner);
        values[at[k]!] = f;
        found[k] = [middle[0] + f * (corner[0] - middle[0]), middle[1] + f * (corner[1] - middle[1])];
        tangent[k] = [p2[0] - p0[0], p2[1] - p0[1]];
        continue;
      }
      const chordAngle: number = Math.atan2(p2[1] - p0[1], p2[0] - p0[0]);

      // Where the section's own turning changes sign between the two neighbours (the skin's inflection, read by `inflections`), the one
      // nearest the chord's crossing, seeds the anchor: its share is its projection on the chord, its turn its tangent's angle to the chord.
      const reading: { t: number; d: number } | null = inflection(points, p0, p2, crossing(points, p0, p2));
      if (reading !== null) {
        found[k] = [p0[0] + reading.t * (p2[0] - p0[0]), p0[1] + reading.t * (p2[1] - p0[1])];
        values[at[k]!] = reading.t;
        values[at[k]! + 1] = reading.d;
        tangent[k] = [Math.cos(chordAngle + reading.d), Math.sin(chordAngle + reading.d)];
        continue;
      }
      const t: number = crossing(points, p0, p2);
      found[k] = [p0[0] + t * (p2[0] - p0[0]), p0[1] + t * (p2[1] - p0[1])];

      // An S-shaped stretch turns from its end tangent through its chord's direction and past it before turning back (a symmetric cubic S crosses its chord at one and a half times the chord's slope), so the seed turns the chord by half the angle from the end tangent to the chord.
      const end: number = Math.atan2(tangent[before]![1], tangent[before]![0]);
      const turn: number = Math.atan2(Math.sin(chordAngle - end), Math.cos(chordAngle - end));
      values[at[k]!] = t;
      values[at[k]! + 1] = turn / 2;
      tangent[k] = [Math.cos(chordAngle + turn / 2), Math.sin(chordAngle + turn / 2)];
    }
    const arcs: number = layout.mirror ? K - 1 : K;
    for (let k: number = 0; k < arcs; ++k) {
      const p0: P = found[k]!;
      const p2: P = found[(k + 1) % K]!;
      const corner: P = meet(p0, tangent[k]!, p2, tangent[(k + 1) % K]!);
      values.push(crossing(points, [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2], corner));
    }
    return values;
  }

  /**
   * The skin's inflection between two anchors as an `i` anchor's share and turn: of the points where the polygon's turning changes sign
   * (`FamilyConicExcursion.inflections`) that project onto the chord from `p0` to `p2` strictly inside it, the one nearest the share `near`;
   * its turn is its tangent's angle to the chord, read over its neighbours. Null when no sign change projects inside the chord.
   */
  function inflection(points: readonly P[], p0: P, p2: P, near: number): { t: number; d: number } | null {
    const chord: P = [p2[0] - p0[0], p2[1] - p0[1]];
    const length2: number = chord[0] * chord[0] + chord[1] * chord[1];
    if (!(length2 > 0)) return null;
    let best: { t: number; d: number } | null = null;
    const n: number = points.length;
    for (const i of X.inflections(points)) {
      const p: P = points[i]!;
      const t: number = ((p[0] - p0[0]) * chord[0] + (p[1] - p0[1]) * chord[1]) / length2;
      if (!(t > 0.08 && t < 0.92)) continue;
      // Only a point near the chord: an inflection elsewhere round the section belongs to another groove.
      const off: number = Math.abs((p[0] - p0[0]) * chord[1] - (p[1] - p0[1]) * chord[0]) / Math.sqrt(length2);
      if (off > 0.5 * Math.sqrt(length2)) continue;
      const a: P = points[(i + n - 2) % n]!;
      const b: P = points[(i + 2) % n]!;
      let d: number = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.atan2(chord[1], chord[0]);
      d = Math.atan2(Math.sin(d), Math.cos(d));
      if (best === null || Math.abs(t - near) < Math.abs(best.t - near)) best = { t, d };
    }
    return best;
  }

  /** Share of the segment from `from` to `to` where the polygon first crosses it; one half when it does not. */
  function crossing(points: readonly P[], from: P, to: P): number {
    const dir: P = [to[0] - from[0], to[1] - from[1]];
    let best: number = Infinity;
    for (let i: number = 0; i < points.length; ++i) {
      const s: P = points[i]!;
      const e: P = points[(i + 1) % points.length]!;
      const edge: P = [e[0] - s[0], e[1] - s[1]];
      const div: number = dir[0] * edge[1] - dir[1] * edge[0];
      if (div === 0) continue;
      const delta: P = [s[0] - from[0], s[1] - from[1]];
      const share: number = (delta[0] * edge[1] - delta[1] * edge[0]) / div;
      const along: number = (delta[0] * dir[1] - delta[1] * dir[0]) / div;
      if (share > 0.05 && share < 0.95 && along >= 0 && along <= 1 && share < best) best = share;
    }
    return Number.isFinite(best) ? best : 0.5;
  }
}
