import type { AutoMovieConstructionAxis } from "./AutoMovieConstructionAxis";
import type { AutoMovieConstructionFullness } from "./AutoMovieConstructionFullness";
import type { AutoMovieConstructionPole } from "./AutoMovieConstructionPole";
import type { IAutoMovieConstructionOutlinePair } from "./IAutoMovieConstructionOutlinePair";

/**
 * A part drawn from its own orthographic views in its own frame: the leaf of a construction tree, lofted by the engine into one section chain.
 *
 * At every station along the part's axis the four outlines give a box about the axis. The front view sees the part along the section plane's `v` axis, so its two edges are the section's extremes along `u`; the side view sees it along `u`, so its two edges are the extremes along `v`. The section touches each side of the box once, at the polar angles 0, `pi / 2`, `pi` and `3 pi / 2` of the plane's chart (the `+u`, `+v`, `-u` and `-v` directions), with zero angular slope there, and the fullness owner sets how full each quarter between those touches is. The outlines own the extremes, the fullness owns the quarters, and the diagonals are never an owner.
 *
 * Engine admission: `stations` strictly increasing and holding every outline and fullness knot's station; every outline at least two knots by strictly increasing station; each box holding its axis strictly inside it, or that station is left out with a diagnostic; `order` a positive multiple of 4 of at least 8; `samples` a positive integer.
 *
 * @evidence contracts/common.md#principled-implementation Classic three-view lofting (aircraft conic lofting, the ship lines plan): four named outlines and one fullness owner per station determine the section, each outline a function of the inputs, so breadth, depth and girth hold together instead of a girth scaling a section about its centre.
 * @evidence contracts/common.md#clear-and-simple-design One record carries the frame, the stations, the two views, the fullness and the closure; the third view enters as the fullness's `top` kind rather than another record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every value is a declared input at a named site; nothing is sampled from a mesh or an image, and an outline equals the section's extreme only in the part's own frame, which the axis states.
 * @evidence contracts/common.md#meaningful-documentation States what each view sees, the four touch angles, the ownership of extremes and fullness, the admission rules and their failure effect.
 */
export interface IAutoMovieConstructionView {
  /** Discriminator. */
  type: "view";

  /** The part's name: unique in its tree, it names the lofted chain and the face a seed or a trim refers to. */
  name: string;

  /** The part's frame along its stations: the section plane at each station. */
  axis: AutoMovieConstructionAxis;

  /** Stations of the lofted chain's sections in metres along the axis, strictly increasing; each named site's station is one of them, so it reads back exactly. */
  stations: number[];

  /** The front view's two edges: the section's extremes along `+u` and `-u`. */
  front: IAutoMovieConstructionOutlinePair;

  /** The side view's two edges: the section's extremes along `+v` and `-v`. */
  side: IAutoMovieConstructionOutlinePair;

  /** What owns the quarters' fullness at each station. */
  fullness: AutoMovieConstructionFullness;

  /** Which ends close in a point, each a smooth dome. */
  pole: AutoMovieConstructionPole;

  /** Control points of every section's periodic cubic B-spline, a positive multiple of 4 of at least 8, so each touch is a knot. */
  order: number;

  /** Uniform phases of the tessellated rings of the part, a positive integer. */
  samples: number;
}
