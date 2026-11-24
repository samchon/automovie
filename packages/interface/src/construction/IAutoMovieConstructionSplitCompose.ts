import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieConstructionComposedEnd } from "./IAutoMovieConstructionComposedEnd";
import type { IAutoMovieConstructionSkinCut } from "./IAutoMovieConstructionSkinCut";
import type { IAutoMovieConstructionSplit } from "./IAutoMovieConstructionSplit";
import type { IAutoMovieConstructionSplitSeam } from "./IAutoMovieConstructionSplitSeam";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * What a split derives from its declared planes (`IAutoMovieConstructionSplit.ICut`, `ICompose`): a child's rail as its skin cut by
 * planes written in a named frame, and from a composed end the forks on the host's ring, the seam planes and every child's rail.
 */
export namespace IAutoMovieConstructionSplitCompose {
  /** The exact physical plane of one composition seam, supplied to a material observation. */
  export interface IValleyFrame {
    /** The lower consecutive child's index. */
    index: number;

    /** Host forks in world millimetres, in seam traversal order. */
    ends: [AutoMovieVector3Tuple, AutoMovieVector3Tuple];

    /** The unit along-chord and outward depth directions. */
    axes: [AutoMovieVector3Tuple, AutoMovieVector3Tuple];

    /** The adjacent children's length-averaged cut centres in the terminal plane, millimetres. */
    sides: [AutoMovieVector3Tuple, AutoMovieVector3Tuple];

    /** The band's column count. */
    count: number;
  }

  /** Observe the seam's interior knots in millimetres, or refuse the source. */
  export type Valley = (frame: IValleyFrame) => IAutoMovieConstructionSplitSeam.Knot[] | string;

  /** The original parent loop's physical station and its phase derivatives, in mm and radians. */
  export type ParentCut = (phase: number) => [number, number, number];

  /**
   * An orthonormal frame in kernel coordinates.
   */
  export interface IBasis {
    /** The origin, mm. */
    origin: AutoMovieVector3Tuple;

    /** The first axis, unit. */
    x: AutoMovieVector3Tuple;

    /** The second axis, unit. */
    y: AutoMovieVector3Tuple;

    /** The third axis, unit. */
    z: AutoMovieVector3Tuple;
  }

  /**
   * One child as the derivations read it.
   */
  export interface IChild {
    /** The child face's name in refusals. */
    name: string;

    /** The child's skin. */
    surface: IAutoMovieSolidSurface;

    /** The station's sign into the child's kept side. */
    into: 1 | -1;

    /** The child's own stations inside its domain, increasing, mm. */
    stations: readonly number[];

    /** The child's declared rail distance, mm. */
    rail: number;

    /** The child's facing end section's frame, its third axis into the child. */
    basis: IBasis;
  }

  /**
   * What a composed end gives the split.
   */
  export interface IDerived {
    /** Each seam's host phases `[a, b]` in the split's own convention, radians. */
    seams: [number, number][];

    /** Each seam plane's bisector, unit. */
    headings: AutoMovieVector3Tuple[];

    /**
     * Each seam's valley as the seam's knots `[along, depth, lateral?]`, mm, in the seam's local frame from its first fork on the host's
     * ring (`AutoMovieConstructionSplitSeam.create`). The input material observation can own the interior samples. Otherwise each
     * depth is the deeper of the two children's cuts by the seam plane over their common chord.
     */
    valleys: IAutoMovieConstructionSplitSeam.Knot[][];

    /** How far the host's end ring stands from the composed outline in the end plane, mm: the greatest and the mean over the ring's samples. */
    host: { max: number; mean: number };

    /** Each child's rail. */
    cuts: IAutoMovieConstructionSkinCut.ICut[];

    /** Shifted carrying planes by child, labelled 0 for the host and 1 + seam index. */
    railPlanes: {
      /** The physical shift from the source junction to the child rail, mm. */
      shift: AutoMovieVector3Tuple;
      /** The host and adjacent seam planes with their loop labels. */
      planes: { label: number; plane: IAutoMovieConstructionSkinCut.IPlane }[];
    }[];

    /** The composition the rest was derived from. */
    composition: IAutoMovieConstructionComposedEnd.IComposition;
  }

  /** Actual split declaration, terminal ring and ordered original sources. */
  export interface IInput {
    /** Declared composition frame and plane. */
    compose: IAutoMovieConstructionSplit.ICompose;

    /** The actual host's regular surface, terminal station and numerical frame. */
    host: { surface: IAutoMovieSolidSurface; station: number; basis: IBasis };

    /** Every ordered original child and its declared rail. */
    children: readonly IChild[];

    /** Existing composition sample count. */
    count: number;
  }

  /**
   * One original child cut on the common physical plane.
   */
  export interface ISection {
    /** Actual input surface, stations and direction. */
    readonly child: IChild;

    /** End plane in the same world millimetres as the source. */
    readonly plane: IAutoMovieConstructionSkinCut.IPlane;

    /** Sample count of the original cut and section. */
    readonly count: number;

    /** Actual wall cut with station and both derivatives. */
    readonly cut: IAutoMovieConstructionSkinCut.ICut;

    /** Actual closed section consumed by the composition. */
    readonly section: IAutoMovieConstructionComposedEnd.ISection;
  }
}
