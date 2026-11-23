import type { IAutoMovieArcLengthJet } from "../../geometry/IAutoMovieArcLengthJet";

/**
 * Section-phase jets and guide constraints used to derive seam knot controls.
 *
 * The interface package owns these declarations; AutoMovieHumanSeamKnot in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Section-phase jets and guide constraints used to derive seam knot controls. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only Jet, IGuide, ISector, ControlsResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation Jet, IGuide, ISector, ControlsResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanSeamKnot exchanges the named Jet, IGuide, ISector, ControlsResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanSeamKnot {
  /** A section point with its first and second phase derivatives, `[p, p', p'']`.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A section point with its first and second phase derivatives, `[p, p', p'']`.
   * @evidence contracts/development/design.md#principled-representation A section point with its first and second phase derivatives, `[p, p', p'']`. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanDigitSector.of, AutoMovieHumanSeamKnot.knot. Read by AutoMovieHumanSeamKnot.controls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmTube.jet, AutoMovieHumanDigitSection.flat, IHalf, half for a section point with its first and second phase derivatives, `[p, p', p'']`.
   */
  export type Jet = [number[], number[], number[]];

  /** A guide: a knot owned by a longitudinal landmark curve.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A guide: a knot owned by a longitudinal landmark curve.
   * @evidence contracts/development/design.md#principled-representation `knot`: Knot index in `[0, N)`. `jet`: The guide's published jet in section coordinates. `speed`: Parameter speed at the guide, mm per radian of phase.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanSeamKnot.assemble. Also types AutoMovieHumanTrunkAssembly.all, AutoMovieHumanArmTube.guides.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `acceleration`: Tangential acceleration, mm per radian squared; absent means 0.
   */
  export interface IGuide {
    /** Knot index in `[0, N)`. */
    knot: number;

    /** The guide's published jet in section coordinates. */
    jet: IAutoMovieArcLengthJet;

    /** Parameter speed at the guide, mm per radian of phase. */
    speed: number;

    /** Tangential acceleration, mm per radian squared; absent means 0. */
    acceleration?: number;
  }

  /**
   * A sector between consecutive guides: its own curve over the phases of its
   * span, in section coordinates.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A sector between consecutive guides: its own curve over the phases of its span, in section coordinates.
   * @evidence contracts/development/design.md#principled-representation `name`: Name in errors. `jet`: The sector's jet at a phase of its own knots, per radian.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanSeamKnot.assemble. Also types AutoMovieHumanTrunkAssembly.between, AutoMovieHumanArmTube.sectors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `jet`; callers supply the complete record.
   */
  export interface ISector {
    /** Name in errors. */
    name: string;

    /**
     * The sector's jet at a phase of its own knots, per radian.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The sector's jet at a phase of its own knots, per radian.
     */
    jet: (t: number) => Jet;
  }

  /** Result of AutoMovieHumanSeamKnot.controls. The three control points `[P-, P0, P+]` that give a knot a jet: the
  inverse of {@link knot}.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The three control points `[P-, P0, P+]` that give a knot a jet: the inverse of {@link knot}.
 * @evidence contracts/development/design.md#principled-representation The three control points `[P-, P0, P+]` that give a knot a jet: the inverse of {@link knot}. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSeamKnot.ControlsResult is the canonical exchange used by AutoMovieHumanSeamKnot.controls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSeamKnot.controls for the three control points `[P-, P0, P+]` that give a knot a jet: the inverse of {@link knot}.
 */
  export type ControlsResult = [number[], number[], number[]];
}
