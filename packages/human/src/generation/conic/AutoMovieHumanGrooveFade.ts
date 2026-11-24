import type { IAutoMovieHumanGrooveFade } from "@automovie/interface";

/**
 * How a groove on a section's median ends along the course: by narrowing, its depth and its inflection's turn going down with its
 * width, so that every section on the way is a chain of conics.
 *
 * A median groove is three anchors a side: the crest beside it, the inflection on its flank and the floor on the median line. The crest
 * and the floor are extremes of the outline's reach, so their tangents run along the median; the inflection's tangent is turned inward
 * of them by `turn`. A conic joins two anchors only when their tangent lines meet between them. With the inflection halfway down and
 * halfway across the flank, its tangent meets the crest's and the floor's lines `depth / (2 tan turn)` either side of its own height,
 * which lies between the anchors exactly when `depth < half tan(turn)`.
 *
 * A groove ended by letting each of its fields go to a smooth section's on its own turns the inflection's tangent through the floor's
 * while the two are not in line, and no conic joins them there (`test_human_conic_lined_fade`, where such a wall is refused at seven
 * stations). Narrowed, the groove keeps its form: at width share `q` its half width is `half q`, its depth `depth q^2` and its turn
 * `turn q`. The condition then reads `depth q < half tan(turn q)`, and since `tan x >= x` it holds at every `q` in `(0, 1]` whenever
 * `depth <= half turn`. Conic lofting ends a feature the same way: a bump "grows smaller" along the body while its end points keep
 * their tangents (Raymer's account of the method, read in a course handout).
 *
 * Limit: the section model's share bound keeps a groove's anchors apart, so a groove narrows to a remainder and does not vanish on one
 * layout; `share` ends at a stated least width, and the remainder's depth is `depth least^2`.
 */
export namespace AutoMovieHumanGrooveFade {
  /** A median groove at its full form. */
  export type IGroove = IAutoMovieHumanGrooveFade.IGroove;

  /** A groove's three anchors of one side in the section's chart. */
  export type IAnchors = IAutoMovieHumanGrooveFade.IAnchors;

  const admit = (groove: IGroove): void => {
    if (!(groove.half > 0 && groove.depth > 0 && groove.turn > 0 && groove.turn < Math.PI / 2)) throw new Error("groove fade: a groove needs a positive half width and depth and a turn inside (0, pi / 2)");
  };

  /**
   * The groove at a width share: its half width by `q`, its depth by `q^2`, its turn by `q`.
   *
   * @param groove The groove at its full form.
   * @param q The width share, in (0, 1].
   *
   * @evidence contracts/development/implementation.md#principled-implementation A narrower groove of the same form is the same curve scaled across by `q`; a flank's depth goes with the square of its width at a given bend, and its turn with the width. Premise: the full groove is admitted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A share outside (0, 1] and a groove without a form are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States the units and what each number goes with.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function narrowed(groove: IGroove, q: number): IGroove {
    admit(groove);
    if (!(q > 0 && q <= 1)) throw new Error("groove fade: a width share lies in (0, 1]");
    return { half: groove.half * q, depth: groove.depth * q * q, turn: groove.turn * q };
  }

  /**
   * Whether a groove's two flank arcs are conics: its tangent lines meet between its anchors.
   *
   * @param groove The groove.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The inflection's tangent, turned by `turn` from lines `depth / 2` either side of it, reaches them `depth / (2 tan turn)` along the median's direction, which lies inside the half flank's `half / 2` exactly when `depth < half tan(turn)`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One inequality.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No margin is added: the section model's own admission holds its margin.
   * @evidence contracts/development/common.md#meaningful-documentation States the inequality's geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure predicate coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Owns nothing.
   */
  export function admitted(groove: IGroove): boolean {
    admit(groove);
    return groove.depth < groove.half * Math.tan(groove.turn);
  }

  /**
   * Whether a groove stays admitted at every width share down to nothing.
   *
   * @param groove The groove at its full form.
   *
   * @evidence contracts/development/implementation.md#principled-implementation At share `q` the condition is `depth q < half tan(turn q)`; `tan x >= x` on `[0, pi / 2)`, so `depth <= half turn` gives it for every `q`, and as `q` goes to nothing the condition tends to `depth < half turn`, so the bound is also needed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One inequality.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bound is the limit's own, not a tuned margin.
   * @evidence contracts/development/common.md#meaningful-documentation States why the bound is sufficient and needed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure predicate coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Owns nothing.
   */
  export function holds(groove: IGroove): boolean {
    admit(groove);
    return groove.depth <= groove.half * groove.turn;
  }

  /**
   * A back median groove's anchors on the `+v` side of a section whose crests reach `back` mm behind the course.
   *
   * @param groove The groove.
   * @param back The crests' reach along `-u`, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The crest stands at the hull's reach, the floor `depth` inside it on the median line, the inflection halfway between them both ways; travelling the section counter-clockwise the outline runs along `-v` at the back, so the inflection heads `turn` inward of `-pi / 2`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three points and one angle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A groove deeper than its section's reach is refused.
   * @evidence contracts/development/common.md#meaningful-documentation States the chart, the side and the direction of travel.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function anchors(groove: IGroove, back: number): IAnchors {
    admit(groove);
    if (!(back > groove.depth)) throw new Error("groove fade: the groove is deeper than its section's reach");
    return {
      crest: [-back, groove.half],
      inflection: [-back + groove.depth / 2, groove.half / 2],
      heading: -Math.PI / 2 + groove.turn,
      floor: [-back + groove.depth, 0],
    };
  }

  /**
   * The width share along a run: whole up to `from`, down to `least` at `to` by the quintic smoothstep, `least` past it.
   *
   * @param station The station, mm.
   * @param from Where the groove starts to narrow, mm.
   * @param to Where it has narrowed to its remainder, mm, past `from`.
   * @param least The remainder's width share, in (0, 1].
   *
   * @evidence contracts/development/implementation.md#principled-implementation The quintic smoothstep's first two derivatives vanish at both ends, so the groove's fields keep the wall's promised continuity where the narrowing starts and stops.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clamp of the argument, one polynomial.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An empty interval and a remainder outside (0, 1] are refused; the remainder is stated, not hidden.
   * @evidence contracts/development/common.md#meaningful-documentation States the units and what is held outside the interval.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Owns nothing.
   */
  export function share(station: number, from: number, to: number, least: number): number {
    if (!(to > from)) throw new Error("groove fade: the narrowing needs a stretch to run over");
    if (!(least > 0 && least <= 1)) throw new Error("groove fade: the remainder's width share lies in (0, 1]");
    const t: number = Math.min(1, Math.max(0, (station - from) / (to - from)));
    return 1 - (1 - least) * (10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5);
  }
}
