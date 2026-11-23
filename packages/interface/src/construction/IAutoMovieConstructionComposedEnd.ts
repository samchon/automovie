import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * An end composed of its children's sections in one plane (`IAutoMovieConstructionSplit.ICompose`): the closed curves the children's
 * skins cut in the plane, laid side by side, with the forks where neighbours cross, the lobes each child keeps on the outline and the
 * seam plane between each pair.
 *
 * In the plane each section is a closed curve read by its child's phase with its tangent. Two neighbours' curves cross in two points,
 * the pair's forks: the composed outline is each curve's arcs outside its neighbours, so a lobe's extremes are the child's own and the
 * valley between two lobes ends in the forks. The pair's seam plane passes through both forks and holds the unit bisector of the two
 * children's axes, so it is a function of both children's frames; its normal points from the lower child toward the upper one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sections, the forks, the lobes and the seam plane with its orientation.
 * @evidence contracts/development/design.md#principled-representation A branch node's surface is made of its children's root sections (Ji, Liu and Wang 2010); the union outline of closed curves is their arcs outside one another, and the plane through two crossing points that holds the axes' bisector is the mirror plane of two equal children, in which their skins meet.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The section record, the input, the composition with its forks, seams and lobes, the builder and the section of a cut skin.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neighbours that do not cross twice, others that overlap and a bisector along the forks' chord are refused by name; no fork is tabulated or snapped.
 */
export namespace IAutoMovieConstructionComposedEnd {
  /**
   * One child's section in the end plane.
   *
   * @evidence contracts/development/design.md#principled-representation A closed curve by the child's own phase with its tangent, and the child's axis, are what the forks and the bisector are computed from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A name, one reader and one direction.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader is the child's own curve; no polygon stands in for it past the search for crossings.
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and direction.
   */
  export interface ISection {
    /** The child's name in refusals. */
    name: string;

    /**
     * The section's point at a child phase, mm, with its derivative in the phase; period `2 pi`.
     */
    at: (psi: number) => { point: AutoMovieVector3Tuple; first: AutoMovieVector3Tuple; second?: AutoMovieVector3Tuple };

    /** The child's axis at the section, unit, into the child. */
    axis: AutoMovieVector3Tuple;
  }

  /**
   * One piece of the composed outline: a lobe of one section, read from one fork to the next.
   *
   * @evidence contracts/development/design.md#principled-representation The outline is the sections' own arcs joined at the forks, so a piece is a section and a phase interval in the direction the outline runs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A section index and two phases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The piece names the child's own curve; no fitted curve stands in for it.
   * @evidence contracts/development/common.md#meaningful-documentation States the direction and the unit.
   */
  export interface IPiece {
    /** The section the piece lies on. */
    section: number;

    /** The phase the piece starts at, radians: a fork. */
    from: number;

    /** The phase it ends at, radians, above or below `from` as the outline runs: the next fork. */
    to: number;
  }

  /**
   * The composed outline as one closed curve: every section's lobes joined through the forks, in the order they bound the union.
   *
   * Sections that cross have no gap between them, so the saddle rule (a radius of half the gap between two root sections) gives each fork a zero radius: a fork is a corner of the outline, a point of both lobes, and needs no fillet.
   *
   * @evidence contracts/development/design.md#principled-representation The union outline of closed curves that cross pairwise is their outer arcs in order; a host family that adopts it for its last section ends on the children's own curves.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The pieces and one reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader evaluates the sections themselves; nothing is resampled or smoothed at a fork.
   * @evidence contracts/development/common.md#meaningful-documentation States the pieces' order, the parameter and the fork's corner.
   */
  export interface IOutline {
    /** The pieces in order round the outline, the first the first section's lobe read by increasing phase. */
    pieces: IPiece[];

    /**
     * The outline at a parameter `t` in `[0, pieces.length)`: piece `floor(t)` at the share `t - floor(t)` of its phase interval, with
     * its first derivative in `t` and, where the section supplies one, its second; the first derivative turns at each whole `t`, a fork.
     */
    at: (t: number) => { point: AutoMovieVector3Tuple; first: AutoMovieVector3Tuple; second?: AutoMovieVector3Tuple };

    /**
     * The distance in the end plane from a point's foot on the plane to the outline, mm: the least over the pieces, each solved on its
     * section's own curve from its nearest sample.
     */
    distance: (point: AutoMovieVector3Tuple) => number;
  }

  /**
   * What a composition is built from.
   *
   * @evidence contracts/development/design.md#principled-representation The end plane and the sections in the children's order are the whole composition.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four fields; the sample count is the caller's sampling input.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values only.
   * @evidence contracts/development/common.md#meaningful-documentation States each field's unit and order.
   */
  export interface IInput {
    /** A point of the end plane, mm. */
    point: AutoMovieVector3Tuple;

    /** The end plane's unit normal, out of the host. */
    normal: AutoMovieVector3Tuple;

    /** The sections in the children's order, at least two; neighbours are consecutive. */
    sections: readonly ISection[];

    /** Phases round each section at which crossings are searched, at least 8. */
    samples: number;
  }

  /**
   * One fork: a point two neighbouring sections share.
   *
   * @evidence contracts/development/design.md#principled-representation The crossing point with its phase on each of the two curves, so each child reads its own lobe from it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A point and two phases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The point is the lower child's curve at its phase; the upper child's curve passes through it to the solver's rounding.
   * @evidence contracts/development/common.md#meaningful-documentation States the owner of the point and the phases' order.
   */
  export interface IFork {
    /** The fork, mm: the lower child's section at its phase. */
    point: AutoMovieVector3Tuple;

    /** The fork's phase on the lower child's section and on the upper child's, radians in `[0, 2 pi)`. */
    phases: [number, number];
  }

  /**
   * The seam between two neighbours.
   *
   * @evidence contracts/development/design.md#principled-representation Two forks and the plane through them that holds the axes' bisector.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The forks, the plane's normal and the bisector.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values derived from the two sections alone.
   * @evidence contracts/development/common.md#meaningful-documentation States the forks' order and both directions' orientation.
   */
  export interface ISeam {
    /** The forks: the first on the left of the direction from the lower child's centre to the upper child's, seen against the end plane's normal. */
    forks: [IFork, IFork];

    /** The seam plane's unit normal, from the lower child toward the upper one. */
    normal: AutoMovieVector3Tuple;

    /** The unit bisector of the two children's axes, which the seam plane holds. */
    heading: AutoMovieVector3Tuple;
  }

  /**
   * A built composition.
   *
   * @evidence contracts/development/design.md#principled-representation The seams between neighbours and each child's lobes are the composed outline's whole structure.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three arrays.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values derived from the sections alone.
   * @evidence contracts/development/common.md#meaningful-documentation States each array's indexing and unit.
   */
  export interface IComposition {
    /** Seam `j` between sections `j` and `j + 1`. */
    seams: ISeam[];

    /** Each section's lobes: the phase intervals `[from, to]`, `from < to <= from + 2 pi`, on which it is the composed outline. */
    lobes: [number, number][][];

    /** Each section's centre, the mean of its sampled points, mm. */
    centres: AutoMovieVector3Tuple[];

    /** The composed outline as one closed curve. */
    outline: IOutline;
  }
}
