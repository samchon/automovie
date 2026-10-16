import { AutoMovieHumanBranch } from "./AutoMovieHumanBranch";
import { AutoMovieHumanPart } from "./AutoMovieHumanPart";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";

/**
 * A semantic address on the skin: which part, which side, which branch of it, and where on that chart.
 *
 * Landmarks, measurements and garments address the evaluation surface through these coordinates instead of vertex indices. A texture layout may map this same domain or declare separate face-varying UVs from the network's logical layout, as the version 4 hand does; physical evaluation coordinates are not replaced when its texture charts change. Every chart is tube-like, so it is two parameters: `u` along its axis and `v` around it. A part generator documents its axis and where `v` starts; on a part with openings in its side, such as the trunk at the arms, the openings are regions of the same chart.
 *
 * A part that branches, the hand into its digits, gives each branch its own chart, named by a closed set per part, {@link AutoMovieHumanBranch}; the address is a union over parts, so a branch is typed only on the part that has it.
 */
export type IAutoMovieHumanSurfaceCoordinate = {
  [Part in AutoMovieHumanPart]: IAutoMovieHumanSurfaceCoordinate.IOn<Part>;
}[AutoMovieHumanPart];
export namespace IAutoMovieHumanSurfaceCoordinate {
  /**
   * An address on one part.
   *
   * @template Part The part whose chart this is
   * @author Samchon
   */
  export interface IOn<Part extends AutoMovieHumanPart> {
    /** The part whose chart this is. */
    part: Part;

    /** The side of a bilateral part, or null for the trunk, neck and head. */
    side: AutoMovieHumanSide | null;

    /**
     * The branch whose own chart this is, or null or omitted for the part's main chart. Only a part that branches admits a branch.
     */
    branch?: AutoMovieHumanBranch<Part> | null;

    /**
     * Position along the chart's axis, 0 at its proximal end (toward the trunk, the bottom of the trunk, or a branch's root) and 1 at its distal end.
     */
    u: number;

    /**
     * Position around the chart's axis as a fraction of a turn, 0 at its anterior mark and increasing counterclockwise about the axis pointing distally, from 0 to 1. The corners of one face lie within half a turn of each other without wrapping, so a face that reaches the wrap meridian from below writes 1 there and one that leaves it upward writes 0.
     */
    v: number;
  }
}
