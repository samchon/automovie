import type { IAutoMovieLoftFrame } from "../../../construction/IAutoMovieLoftFrame";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanHeadLipContact; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadLipContact {
  /** One original forward point and its optional physical lateral derivatives.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One original forward point and its optional physical lateral derivatives.
   * @evidence contracts/development/design.md#principled-representation `point`: Actual point in world mm. `forwardJet`: First and second forward derivatives per lateral mm; absent at a singular inverse.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadLipContact.IReading is the canonical exchange used by AutoMovieHumanHeadLipContact.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `point`, `forwardJet`; callers supply the complete record.
   */
  export interface IReading {
    /** Actual point in world mm. */
    point: AutoMovieVector3Tuple;
    /** First and second forward derivatives per lateral mm; absent at a singular inverse. */
    forwardJet: [number, number] | null;
  }

  /** A section value is valid independently of availability of its frame2.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A section value is valid independently of availability of its frame2.
   * @evidence contracts/development/design.md#principled-representation `frame`: Actual midpoint and oriented secant axes, with parallel lateral planes. `jet`: Analytic derivatives in physical lateral mm, null at a singular border/corner. `resting`: Same original parent resting point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanHeadLipPart.cachedSection, AutoMovieHumanHeadLipPart.section.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `jet`, `resting`, `border`; callers supply the complete record.
   */
  export interface ISection {
    /** Actual midpoint and oriented secant axes, with parallel lateral planes. */
    frame: IAutoMovieLoftFrame.IFrame;
    /** Analytic derivatives in physical lateral mm, null at a singular border/corner. */
    jet: FrameJet;
    /** Same original parent resting point. */
    resting: AutoMovieVector3Tuple;
    /** Same original parent border point, at its own height. */
    border: AutoMovieVector3Tuple;
  }

  /** The actual axis owner's nullable analytic frame2 result.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The actual axis owner's nullable analytic frame2 result.
   * @evidence contracts/development/design.md#principled-representation The actual axis owner's nullable analytic frame2 result. ReturnType< NonNullable<IAutoMovieViewAxis.IAxis["jet"]> > retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadLipContact.differentiate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadLipContact.differentiate for the actual axis owner's nullable analytic frame2 result.
   */
  export type FrameJet = ReturnType<
    NonNullable<IAutoMovieViewAxis.IAxis["jet"]>
  >;

  /** One full native parent source, with explicit units and chart ownership.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One full native parent source, with explicit units and chart ownership.
   * @evidence contracts/development/design.md#principled-representation `parent`: Identical original material parent. `source`: Complete original signed supports, effective fullness and cap laws. `frame`: Actual source plane at stomion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadLipContact.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `parent`, `source`, `frame`; callers supply the complete record.
   */
  export interface IContact {
    /** Identical original material parent. */
    parent: IAutoMovieViewPart;
    /** Complete original signed supports, effective fullness and cap laws. */
    source: IAutoMovieLoftViewSource.ISource;
    /** Actual source plane at stomion. */
    frame: IAutoMovieLoftFrame.IFrame;
    /** Forward resting point at world lateral mm. */
    at(lateral: number): IReading;
    /** Actual signed border at Euclidean height mm; heightJet uses physical lateral mm. */
    section(
      lateral: number,
      height: number,
      sign: number,
      heightJet: readonly [number, number] | null,
    ): ISection;
  }
}
