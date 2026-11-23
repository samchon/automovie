import type { AutoMovieConstructionPole } from "./AutoMovieConstructionPole";
import type { IAutoMovieConstructionAxis } from "./IAutoMovieConstructionAxis";
import type { IAutoMovieConstructionFullness } from "./IAutoMovieConstructionFullness";
import type { IAutoMovieConstructionOutlinePair } from "./IAutoMovieConstructionOutlinePair";

/**
 * A part drawn from its own orthographic views in its own frame: the leaf of a
 * construction tree, lofted by the engine into one section chain.
 *
 * At every station along the part's axis the four outlines give a box about the
 * axis. The front view sees the part along the section plane's `v` axis, so its
 * two edges are the section's extremes along `u`; the side view sees it along
 * `u`, so its two edges are the extremes along `v`. The section touches each
 * side of the box once, at the polar angles 0, `pi / 2`, `pi` and `3 pi / 2` of
 * the plane's chart (the `+u`, `+v`, `-u` and `-v` directions), with zero
 * angular slope there, and the fullness owner sets how full each quarter
 * between those touches is. The outlines own the extremes, the fullness owns
 * the quarters, and the diagonals are never an owner.
 *
 * Engine admission: `stations` strictly increasing; every outline at least two
 * knots by strictly increasing station; each box holding its axis strictly
 * inside it, or that station is left out with a diagnostic; `order` a positive
 * multiple of 4 of at least 8; `samples` a positive integer. Direct
 * shoulder/top sources retain their original continuous functions at every site
 * without requiring a layer there. Generic girth's coefficient representation
 * requires every in-domain contour/fullness knot as a declared station. Outside
 * controls may retain an original scalar parameter without emitting layers.
 * Each actual pole must remain the same zero-valued singular endpoint of that
 * parameter, with the same inward side. A parameter endpoint alone declares no
 * cap; preserving an old native field requires the removed cap's actual effects
 * to vanish on the kept interval.
 */
export interface IAutoMovieConstructionView {
  /** Discriminator. */
  type: "view";

  /**
   * The part's name: unique in its tree, it names the lofted chain and the face
   * a seed or a trim refers to.
   */
  name: string;

  /** The part's frame along its stations: the section plane at each station. */
  axis: IAutoMovieConstructionAxis;

  /**
   * Stations of principal output sections, metres, strictly increasing.
   * Continuous direct shoulder/top sources remain authoritative between them.
   * Generic girth requires every retained contour/fullness knot here,
   * regardless of diagnostic label. Outside source controls retain their
   * original functions; internal interpolation and axis knots require no extra
   * layers.
   */
  stations: number[];

  /** The front view's two edges: the section's extremes along `+u` and `-u`. */
  front: IAutoMovieConstructionOutlinePair;

  /** The side view's two edges: the section's extremes along `+v` and `-v`. */
  side: IAutoMovieConstructionOutlinePair;

  /** What owns the quarters' fullness at each station. */
  fullness: IAutoMovieConstructionFullness;

  /** Which ends close in a point, each a smooth dome. */
  pole: AutoMovieConstructionPole;

  /**
   * Control points of every section's periodic cubic B-spline, a positive
   * multiple of 4 of at least 8, so each touch is a knot.
   */
  order: number;

  /** Uniform phases of the tessellated rings of the part, a positive integer. */
  samples: number;
}
