import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieConstructionComposedEnd } from "./IAutoMovieConstructionComposedEnd";
import type { IAutoMovieConstructionSkinCut } from "./IAutoMovieConstructionSkinCut";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * What a split derives from its declared planes
 * (`IAutoMovieConstructionSplit.ICut`, `ICompose`): a child's rail as its skin
 * cut by planes written in a named frame, and from a composed end the forks on
 * the host's ring, the seam planes and every child's rail.
 */
export namespace IAutoMovieConstructionSplitCompose {
  /** An orthonormal frame in kernel coordinates. */
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

  /** One child as the derivations read it. */
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

  /** What a composed end gives the split. */
  export interface IDerived {
    /** Each seam's host phases `[a, b]` in the split's own convention, radians. */
    seams: [number, number][];

    /** Each seam plane's bisector, unit. */
    headings: AutoMovieVector3Tuple[];

    /**
     * Each seam's valley as the seam's knots `[along, depth]`, mm, in the
     * seam's own plane coordinates from its first fork on the host's ring
     * (`AutoMovieEngineConstructionSplitSeam.create`): at each place along the chord
     * the deeper of the two children's cuts by the seam plane.
     */
    valleys: [number, number][][];

    /**
     * How far the host's end ring stands from the composed outline in the end
     * plane, mm: the greatest and the mean over the ring's samples.
     */
    host: IDerivedHost;

    /** Each child's rail. */
    cuts: IAutoMovieConstructionSkinCut.ICut[];

    /** The composition the rest was derived from. */
    composition: IAutoMovieConstructionComposedEnd.IComposition;
  }

  /** The host object of {@link IDerived}. */
  export type IDerivedHost = { max: number; mean: number };
}
