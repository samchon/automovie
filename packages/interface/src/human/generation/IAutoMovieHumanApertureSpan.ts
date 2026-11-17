/**
 * Aperture rim points and per-chain trim loops in station-millimetre and phase-radian charts. Runtime construction and admission remain with AutoMovieHumanApertureSpan in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes aperture rim points and per-chain trim loops in station-millimetre and phase-radian charts; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Aperture rim points and per-chain trim loops in station-millimetre and phase-radian charts. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanApertureSpan; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing ApertureSpan contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanApertureSpan {
  /** A rim point on its chain, with its chart on the neighbour where it lies on their shared ring.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A rim point on its chain, with its chart on the neighbour where it lies on their shared ring.
   * @evidence contracts/development/design.md#principled-representation `chain`: The chain the point is evaluated on. `s`: Station, mm. `t`: Phase, radians, on the branch the loop runs on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanApertureSeam.drawn. Read by AutoMovieHumanApertureSeam.drawn. Also types AutoMovieHumanApertureSpan.points, AutoMovieHumanApertureSpan.sequence.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `also`: The same point in the neighbour's chart, for a point on the shared ring.
   */
  export interface IPoint {
    /** The chain the point is evaluated on. */
    chain: string;

    /** Station, mm. */
    s: number;

    /** Phase, radians, on the branch the loop runs on. */
    t: number;

    /** The same point in the neighbour's chart, for a point on the shared ring. */
    also?: {
      /** Skin chain whose surface carries this aperture point. */
      chain: string;
      /** Physical station along that chain, calibration millimetres. */
      s: number;
      /** Section phase in radians, increasing according to the source curve's orientation. */
      t: number;
    };
  }

  /** An opening's trim on one or two chains.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation An opening's trim on one or two chains.
   * @evidence contracts/development/design.md#principled-representation `chains`: The chains, the one holding the most points first. `points`: The rim: the feet of the kept margin points, in margin order. `loops`: Each chain's polygon `[station, phase]` for the cells it leaves out, closed past the shared ring.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanApertureSpan.of. Read by AutoMovieHumanBodySurfaceOpening.open. Also types AutoMovieHumanBodySurface.spans, AutoMovieHumanBodySurface.span.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `chains`, `points`, `loops`; callers supply the complete record.
   */
  export interface ISpan {
    /** The chains, the one holding the most points first. */
    chains: string[];

    /** The rim: the feet of the kept margin points, in margin order. */
    points: IPoint[];

    /** Each chain's polygon `[station, phase]` for the cells it leaves out, closed past the shared ring. */
    loops: Map<string, [number, number][]>;
  }
}
