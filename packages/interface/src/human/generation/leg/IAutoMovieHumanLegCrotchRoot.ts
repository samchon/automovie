import type { IAutoMovieLoftChain } from "../../../construction/IAutoMovieLoftChain";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLegCrotchFillet } from "./IAutoMovieHumanLegCrotchFillet";

/**
 * Type contracts exchanged by AutoMovieHumanLegCrotchRoot; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanLegCrotchRoot exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IRoot, IArcs, OfCentre. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanLegCrotchRoot; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IRoot, IArcs, OfCentre contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanLegCrotchRoot {
  /** The crotch ring a leg takes, canonical: the trunk's arc, front pinch first.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The crotch ring a leg takes, canonical: the trunk's arc, front pinch first.
   * @evidence contracts/development/design.md#principled-representation `arc`: The arc from the front pinch round the outside to the rear pinch. `rates`: The trunk's station derivative at each point of the arc, per mm up. `seconds`: The trunk's second station derivative at each point of the arc, per mm squared.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegCrotchRoot.of. Read by AutoMovieHumanLegCrotchFillet.of, AutoMovieHumanLegCrotchRoot.start. Also types AutoMovieHumanLegChain.root, AutoMovieHumanLegCrotchRoot.root.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `arc`, `rates`, `seconds`, `y`, `centre`, `ring`, `corner`; callers supply the complete record.
   */
  export interface IRoot {
    /** The arc from the front pinch round the outside to the rear pinch. */
    arc: AutoMovieVector3Tuple[];

    /** The trunk's station derivative at each point of the arc, per mm up. */
    rates: AutoMovieVector3Tuple[];

    /** The trunk's second station derivative at each point of the arc, per mm squared. */
    seconds: AutoMovieVector3Tuple[];

    /** Station of the ring. */
    y: number;

    /** Centre the ring's phases are read about, `[x, z]`. */
    centre: [number, number];

    /** The rounded ring at the leg's phases, with its normals and the trunk's derivatives. */
    ring: IAutoMovieHumanLegCrotchFillet.ILoop;

    /** Corner size at the ring. */
    corner: number;
  }

  /** The trunk and the phase arcs of its bottom ring that one leg takes.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The trunk and the phase arcs of its bottom ring that one leg takes.
   * @evidence contracts/development/design.md#principled-representation `trunk`: The trunk chain, owner of the ring. `arcs`: The arcs `[from, to]` of the trunk's phases the leg takes, radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegCrotchRoot.arcs. Also types AutoMovieHumanLegCrotchRoot.taken.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `trunk`, `arcs`; callers supply the complete record.
   */
  export interface IArcs {
    /** The trunk chain, owner of the ring. */
    trunk: IAutoMovieLoftChain;

    /** The arcs `[from, to]` of the trunk's phases the leg takes, radians. */
    arcs: [number, number][];
  }

  /** The centre argument of AutoMovieHumanLegCrotchRoot.of. The crotch ring a leg takes, with the trunk's own jet along it.
  @param calibration Calibration holding `trunk` and the event.
  @param side The leg's side.
  @param sign 1 for the left leg, -1 for the right's reflection.
  @param centre Centre the ring's phases are read about, `[x, z]`: the law's own last centre.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The crotch ring a leg takes, with the trunk's own jet along it.
 * @evidence contracts/development/design.md#principled-representation The crotch ring a leg takes, with the trunk's own jet along it. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegCrotchRoot.OfCentre is the canonical exchange used by AutoMovieHumanLegCrotchRoot.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegCrotchRoot.of for the crotch ring a leg takes, with the trunk's own jet along it.
 */
  export type OfCentre = [number, number];
}
