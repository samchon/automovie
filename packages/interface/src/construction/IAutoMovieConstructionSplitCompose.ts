import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieConstructionComposedEnd } from "./IAutoMovieConstructionComposedEnd";
import type { IAutoMovieConstructionSkinCut } from "./IAutoMovieConstructionSkinCut";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * What a split derives from its declared planes (`IAutoMovieConstructionSplit.ICut`, `ICompose`): a child's rail as its skin cut by
 * planes written in a named frame, and from a composed end the forks on the host's ring, the seam planes and every child's rail.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two derivations and their sources.
 * @evidence contracts/development/design.md#principled-representation Planes fixed in a section's frame are resolved through that frame, and the composed end's forks, seam planes and rails are computed from the children's skins, so every result is a function of the parts' frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A frame record, a child record, the derived record and three functions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every failed premise is returned as a named refusal; nothing is clamped, tabulated or repaired.
 */
export namespace IAutoMovieConstructionSplitCompose {
  /**
   * An orthonormal frame in kernel coordinates.
   *
   * @evidence contracts/development/design.md#principled-representation An origin and three unit axes carry a point or a direction written in the frame into the kernel's coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four vectors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values only.
   * @evidence contracts/development/common.md#meaningful-documentation States the units.
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
   *
   * @evidence contracts/development/design.md#principled-representation The child's skin, its kept side, its own stations and its facing end's frame are what a cut of it needs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values only; the realization admits the face before it builds this record.
   * @evidence contracts/development/common.md#meaningful-documentation States each field's unit.
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
   *
   * @evidence contracts/development/design.md#principled-representation The seams' host phases, their planes' headings and the children's rails are exactly the members the split otherwise reads from its declaration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values derived from the children's skins and the host's ring alone.
   * @evidence contracts/development/common.md#meaningful-documentation States each member's indexing and unit.
   */
  export interface IDerived {
    /** Each seam's host phases `[a, b]` in the split's own convention, radians. */
    seams: [number, number][];

    /** Each seam plane's bisector, unit. */
    headings: AutoMovieVector3Tuple[];

    /**
     * Each seam's valley as the seam's knots `[along, depth]`, mm, in the seam's own plane coordinates from its first fork on the host's
     * ring (`AutoMovieConstructionSplitSeam.create`): at each place along the chord the deeper of the two children's cuts by the seam plane.
     */
    valleys: [number, number][][];

    /** How far the host's end ring stands from the composed outline in the end plane, mm: the greatest and the mean over the ring's samples. */
    host: { max: number; mean: number };

    /** Each child's rail. */
    cuts: IAutoMovieConstructionSkinCut.ICut[];

    /** The composition the rest was derived from. */
    composition: IAutoMovieConstructionComposedEnd.IComposition;
  }
}
