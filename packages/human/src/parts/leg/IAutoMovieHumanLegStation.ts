import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One station of the leg's loft: a cross-section perpendicular to the limb at a named anatomical level.
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

  /** Level on the thigh, 0 at the knee joint centre and 1 at the hip joint centre. */
  thigh: number;

  /** Level on the shank, 0 at the ankle joint centre and 1 at the knee joint centre. */
  shank: number;

  /** Circumference of the section, millimetres: what its base shape is drawn at and what the loft's row at the station keeps on the limit surface, relief included. */
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

  /**
   * The junction ring this station continues straight, or null. A collar repeats its ring's vertices translated along the site axis, so the two loops either side of the ring cancel radially and the joined limit surface keeps the ring's girth there.
   */
  collar: "thigh" | "ankle" | null;

  /** Number of vertices around the station's row: 12 from the thigh down to the calcaneal tendon, 8 at the ankle's collar and ring. */
  count: number;
}
