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
 */
export namespace IAutoMovieConstructionComposedEnd {
  /**
   * One child's section in the end plane.
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
   * An observed nearest branch site on the same outline whose distance is returned by the ordinary search.
   */
  export interface IOutlineDistanceSite {
    /** Index in the retained pieces, zero based. */
    piece: number;

    /** Unitless share in [0, 1] along this piece's directed phase interval. */
    share: number;

    /** IDs of the start and end forks in piece order. An ID is twice its seam index plus its fork index. */
    forks: readonly [number, number];

    /** Whether the search settled on this site, including an active endpoint. */
    settled: boolean;
  }

  /**
   * The composed outline as one closed curve: every section's lobes joined through the forks, in the order they bound the union.
   *
   * Sections that cross have no gap between them, so the saddle rule (a radius of half the gap between two root sections) gives each fork a zero radius: a fork is a corner of the outline, a point of both lobes, and needs no fillet.
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
    distance: (
      point: AutoMovieVector3Tuple,
      // The exact scalar winner leads, followed by other numerically tied branch sites in the original search order.
      observe?: (sites: readonly IOutlineDistanceSite[]) => void,
    ) => number;
  }

  /**
   * What a composition is built from.
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
   */
  export interface IFork {
    /** The fork, mm: the lower child's section at its phase. */
    point: AutoMovieVector3Tuple;

    /** The fork's phase on the lower child's section and on the upper child's, radians in `[0, 2 pi)`. */
    phases: [number, number];
  }

  /**
   * The seam between two neighbours.
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
