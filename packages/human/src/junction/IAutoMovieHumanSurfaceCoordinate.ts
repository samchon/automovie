import { AutoMovieHumanPart } from "./AutoMovieHumanPart";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";

/**
 * A semantic address on the skin: which part, which side, and where on that part's own chart.
 *
 * Landmarks, measurements, garments and UV layout address the surface through these coordinates instead of vertex indices, because a coordinate survives any change of identity while an index does not. Every part is tube-like, so its chart is two parameters: `u` along the part's axis and `v` around it. A part generator documents its axis and where `v` starts; on a part with openings in its side, such as the trunk at the arms, the openings are regions of the same chart.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSurfaceCoordinate {
  /** The part whose chart this is. */
  part: AutoMovieHumanPart;

  /** The side of a bilateral part, or null for the trunk, neck and head. */
  side: AutoMovieHumanSide | null;

  /**
   * Position along the part's axis, 0 at its proximal end (toward the trunk, or the bottom of the trunk) and 1 at its distal end.
   */
  u: number;

  /**
   * Position around the part's axis as a fraction of a turn, 0 at the part's anterior mark and increasing counterclockwise about the axis pointing distally, from 0 to 1. The corners of one face lie within half a turn of each other without wrapping, so a face that reaches the wrap meridian from below writes 1 there and one that leaves it upward writes 0.
   */
  v: number;
}
