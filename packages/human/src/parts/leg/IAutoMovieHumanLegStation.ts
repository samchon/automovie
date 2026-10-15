import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One cross-section of the leg cage: an edge loop perpendicular to the limb at a named anatomical level.
 *
 * Positions are millimetres in the skeleton's model frame. Directions around the station follow the leg's surface chart: `v` turns counterclockwise about `axis`, which points distally, starting at `anterior`, so a vertex at chart angle `v` lies in the direction `cos(2πv)·anterior + sin(2πv)·around`.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanLegStation {
  /** Anatomical level, for reading. */
  name: string;

  /** Where the section's plane crosses the bone axis. */
  origin: IAutoMovieVector3;

  /** Unit limb axis pointing distally, the section's normal. */
  axis: IAutoMovieVector3;

  /** Unit anterior direction in the section plane, where the chart's `v` is 0. */
  anterior: IAutoMovieVector3;

  /** Unit direction in the plane a quarter turn counterclockwise from `anterior` about `axis`. */
  around: IAutoMovieVector3;

  /** Unit medial direction in the plane, toward the body's midline. */
  medial: IAutoMovieVector3;

  /** Position along the leg's chart, 0 at the mid thigh ring and 1 at the ankle ring, by arc length of the bone axis. */
  u: number;

  /** Level on the thigh, 0 at the knee joint centre and 1 at the hip joint centre. */
  thigh: number;

  /** Level on the shank, 0 at the ankle joint centre and 1 at the knee joint centre. */
  shank: number;

  /** Circumference the section's limit surface has, millimetres. */
  girth: number;

  /** Breadth over depth of the section's base ellipse. */
  aspect: number;

  /**
   * How far the section's centre lies behind the bone axis, as a fraction of its half depth: the anterior extent is `1 - posterior` and the posterior `1 + posterior` half depths.
   */
  posterior: number;

  /** How far the section's centre lies lateral to the bone axis, millimetres. */
  lateral: number;

  /** Subcutaneous fat thickness at the section, millimetres. */
  fat: number;

  /** Number of vertices around the section: 12 from the thigh down to the lower calf, 8 near the ankle. */
  count: number;
}
