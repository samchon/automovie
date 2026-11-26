import { AutoMovieHumanConicSection as S } from "./AutoMovieHumanConicSection";
import { AutoMovieViewChain } from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicSection,
  IAutoMovieViewChain,
} from "@automovie/interface";

/**
 * A girth closed by fullness: the section whose extremes are given takes the one fullness at which its taut tape measures a published
 * girth.
 *
 * A measurement site gives three numbers of one section: a breadth, a depth and a girth (ISO 8559-1, ANSUR II). The breadth and the depth
 * place the section's extremes. Between two extremes the conic chain still has its fullness free: each median's share `f` and each arc's
 * shoulder `rho = w / (1 + w)` for the arc's middle weight `w` (a quarter of an ellipse has `rho = sqrt(2) - 1`; Sanchez-Reyes 2011,
 * Characteristics of conic segments in Bezier form). The girth is the measure that fixes it. With the extremes held, a section of larger
 * shares contains the section of smaller ones, and of two convex curves the outer is the longer, so the tape rises with the fullness and
 * one scalar has one answer.
 *
 * The scalar moves every fullness share of the section together on its logit, `logit(share') = logit(share) + fullness`: a share stays
 * a share, two shares keep their order, and zero leaves the section as given. A conic's perimeter has no closed form, so the answer is
 * found by bisection on the tape, read as the perimeter of the convex hull of the section sampled round its course point.
 *
 * Limits: the tape is a hull, so a section with a groove is measured as a tape measures it, bridged; an inflection's share and a
 * feature's place are not fullness and stay; the section must contain its course point.
 */
export namespace AutoMovieHumanNativeGirthClosure {
  /** A section closed on a girth. */
  export interface IClosed {
    /** The scalar added to every fullness share's logit; zero when the given section already measures the girth. */
    fullness: number;

    /** The section's field vector at that fullness: every millimetre and angle field as given, the fullness shares moved. */
    values: readonly number[];

    /** The closed section's taut tape, mm. */
    tape: number;
  }

  /**
   * Phases a section is sampled at for its tape. A chord of an inscribed polygon falls short of its arc by the arc's length times
   * `(length x curvature)^2 / 24`; at 1,440 phases a trunk section of 200 mm reach is sampled every 0.9 mm, under 1e-5 of its girth
   * short wherever its radius of curvature is over 10 mm.
   */
  const PHASES: number = 1440;

  /** Halvings of the bracket: each halves the fullness interval, so sixty take a bracket of 14 to 1e-17, under one unit of a double. */
  const HALVINGS: number = 60;

  /**
   * The taut tape of a section, mm: the perimeter of the convex hull of its outline about its course point.
   *
   * @param values The section's field vector.
   * @param layout Its layout.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A tape drawn taut round a body lies on the section's convex hull (the published girths are tape lengths); the outline is read through the engine's own chain, so the tape measures the curve the loft draws. Premise: the course point lies inside the section, which the chain's radius needs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain, one sampling, one monotone-chain hull.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A section the chain refuses is refused with the chain's fault; nothing is patched.
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the hull and the sampling's error.
   * @evidence contracts/development/implementation.md#efficient-algorithms `PHASES` radius reads and one sort of as many points.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Owns nothing past the call.
   */
  export function tape(values: readonly number[], layout: IAutoMovieHumanConicSection.ILayout): number {
    const section: IAutoMovieViewChain.ISection = S.chain(values, layout);
    if (section.fault !== null) throw new Error("girth closure: the section is not admitted: " + section.fault);
    const points: AutoMovieVector2Tuple[] = Array.from({ length: PHASES }, (_: unknown, k: number): AutoMovieVector2Tuple => {
      const phi: number = (2 * Math.PI * k) / PHASES;
      const r: number = AutoMovieViewChain.radius(section, phi);
      return [r * Math.cos(phi), r * Math.sin(phi)];
    });

    // Andrew's monotone chain: the lower and the upper hull of the points sorted by coordinate.
    const sorted: AutoMovieVector2Tuple[] = [...points].sort((a: AutoMovieVector2Tuple, b: AutoMovieVector2Tuple): number => a[0] - b[0] || a[1] - b[1]);
    const turn = (o: AutoMovieVector2Tuple, a: AutoMovieVector2Tuple, b: AutoMovieVector2Tuple): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = (source: readonly AutoMovieVector2Tuple[]): AutoMovieVector2Tuple[] => {
      const out: AutoMovieVector2Tuple[] = [];
      for (const p of source) {
        while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0) out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    const hull: AutoMovieVector2Tuple[] = [...half(sorted), ...half([...sorted].reverse())];
    let sum: number = 0;
    for (let i: number = 0; i < hull.length; ++i) {
      const a: AutoMovieVector2Tuple = hull[i]!;
      const b: AutoMovieVector2Tuple = hull[(i + 1) % hull.length]!;
      sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return sum;
  }

  /**
   * A section's field vector with every fullness share (each median's `f`, each arc's shoulder) moved by `fullness` on its logit.
   *
   * @param values The section's field vector.
   * @param layout Its layout.
   * @param fullness The scalar added to each share's logit; zero returns a copy of the given numbers.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The logit is the monotone map of a share in (0, 1) onto the line, so one addition moves every share the same way, keeps it a share and keeps two shares' order. Each share is first confined to the model's own bounds (`AutoMovieHumanConicSection.clamp`), which is what the chain reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the layout's anchors and one over its arcs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An inflection's share and a feature's place are not fullness and are left; a field vector shorter than its layout is refused.
   * @evidence contracts/development/common.md#meaningful-documentation Names which fields move and what zero returns.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the section's fields.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh array.
   */
  export function shift(values: readonly number[], layout: IAutoMovieHumanConicSection.ILayout, fullness: number): number[] {
    const { at, shoulders }: { at: number[]; shoulders: number } = S.offsets(layout);
    const arcs: number = layout.mirror ? layout.anchors.length - 1 : layout.anchors.length;
    if (values.length < shoulders + arcs) throw new Error("girth closure: the field vector has " + values.length + " numbers, its layout " + (shoulders + arcs));
    const moved = (share: number): number => {
      const held: number = S.clamp(share);
      return 1 / (1 + Math.exp(-(Math.log(held / (1 - held)) + fullness)));
    };
    const out: number[] = [...values];
    layout.anchors.forEach((anchor: IAutoMovieHumanConicSection.IAnchor, k: number): void => {
      if (anchor.kind === "m") out[at[k]!] = moved(values[at[k]!]!);
    });
    for (let arc: number = 0; arc < arcs; ++arc) out[shoulders + arc] = moved(values[shoulders + arc]!);
    return out;
  }

  /**
   * The section closed on a girth: the fullness at which its taut tape measures `girth`, its extremes as given.
   *
   * @param values The section's field vector, its extremes already at the site's breadth and depth.
   * @param layout Its layout.
   * @param girth The published girth at the site, a taut tape's length, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Bisection on a monotone function: with the extremes held the section of larger shares contains the smaller one's and a convex curve inside another is the shorter, so the tape does not fall as the fullness rises. The bracket is twice the logit of the model's share bound either way, past which every share stands at its bound from wherever it started. Precision: the tape is met to the bracket's last halving, about 1e-13 mm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bracket, one loop, the two public helpers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A girth the section cannot measure at any fullness inside the layout's bounds is refused with the two tapes it can reach; no reach is moved to make room, since a breadth or a depth is its own input.
   * @evidence contracts/development/common.md#meaningful-documentation States the units, what is held, what moves and the refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms `HALVINGS` tapes, each `PHASES` radius reads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure solve coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function solve(values: readonly number[], layout: IAutoMovieHumanConicSection.ILayout, girth: number): IClosed {
    if (!(Number.isFinite(girth) && girth > 0)) throw new Error("girth closure: the girth must be finite and positive");
    const given: number = tape(values, layout);
    if (given === girth) return { fullness: 0, values, tape: given };

    // Past this shift every share stands at one of the model's bounds, whatever it was: the bracket holds every reachable section.
    const edge: number = S.clamp(0);
    const limit: number = 2 * Math.log((1 - edge) / edge);
    let [low, high]: [number, number] = [-limit, limit];
    const [least, most]: [number, number] = [tape(shift(values, layout, low), layout), tape(shift(values, layout, high), layout)];
    if (girth < least || girth > most)
      throw new Error("girth closure: a girth of " + girth + " mm lies outside what these extremes can measure, " + least + " to " + most + " mm");
    for (let k: number = 0; k < HALVINGS; ++k) {
      const middle: number = (low + high) / 2;
      if (tape(shift(values, layout, middle), layout) < girth) low = middle;
      else high = middle;
    }
    const fullness: number = (low + high) / 2;
    const closed: number[] = shift(values, layout, fullness);
    return { fullness, values: closed, tape: tape(closed, layout) };
  }
}
