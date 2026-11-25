import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Original lip-parent contact readings and nullable physical lateral
 * derivatives. Runtime construction and admission remain with
 * AutoMovieHumanHeadLipContact in Human.
 */
export namespace IAutoMovieHumanHeadLipContact {
  /** One original forward point and its optional physical lateral derivatives. */
  export interface IReading {
    /** Actual point in world mm. */
    point: AutoMovieVector3Tuple;
    /**
     * First and second forward derivatives per lateral mm; absent at a singular
     * inverse.
     */
    forwardJet: [number, number] | null;
  }

  /** A section value is valid independently of availability of its frame2. */
  export interface ISection {
    /** Actual midpoint and oriented secant axes, with parallel lateral planes. */
    frame: IAutoMovieLoftSectionFrame;
    /**
     * Analytic derivatives in physical lateral mm, null at a singular
     * border/corner.
     */
    jet: FrameJet;
    /** Same original parent resting point. */
    resting: AutoMovieVector3Tuple;
    /** Same original parent border point, at its own height. */
    border: AutoMovieVector3Tuple;
  }

  /** The actual axis owner's nullable analytic frame2 result. */
  export type FrameJet = ReturnType<
    NonNullable<IAutoMovieViewAxis.IAxis["jet"]>
  >;

  /** One full native parent source, with explicit units and chart ownership. */
  export interface IContact {
    /** Identical original material parent. */
    parent: IAutoMovieViewPart;
    /** Complete original signed supports, effective fullness and cap laws. */
    source: IAutoMovieLoftViewSource.ISource;
    /** Actual source plane at stomion. */
    frame: IAutoMovieLoftSectionFrame;
    /** Forward resting point at world lateral mm. */
    at(lateral: number): IReading;
    /** Prepare another regular level of the same forward field once. */
    level(station: number): (lateral: number) => IReading;
    /**
     * Actual signed border at Euclidean height mm; heightJet uses physical
     * lateral mm.
     */
    section(
      lateral: number,
      height: number,
      sign: number,
      heightJet: readonly [number, number] | null,
    ): ISection;
  }
}
