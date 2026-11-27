import type { IAutoMovieSweepTransport } from "./IAutoMovieSweepTransport";

/** Shared transport and station layout for a live sweep orientation evaluator. */
export namespace IAutoMovieOrientSweep {
  /**
   * Create the station-rotation buffers of a sweep and the in-place computation
   * of its section planes.
   *
   * The carried frame at `u` is the transport's rotation-minimizing frame, or
   * under the fixed orientation its first frame's axes moved to the spine
   * point. `update` stores each giving station's turn relative to the carried
   * frame at its `at`, the station's rotation premultiplied by the inverse of
   * the carried basis; a station without a rotation has no turn. The plane at
   * `u` is the carried frame turned by the normalized linear interpolation of
   * the two bracketing stations' turns, the second negated when their dot
   * product is negative, held beyond the end stations, as sweep-based
   * deformation interpolates key-ellipse orientations (Hyun et al. 2005, The
   * Visual Computer 21(8-10):542-550). Without any giving station the plane is
   * the carried frame.
   */
  export type IProps = {
    /**
     * Borrowed live spine transport, updated before the orientation's update
     * method. Its frame origin is in model metres and its axes are unit
     * directions in that frame. Retained by the returned orientation.
     */
    transport: IAutoMovieSweepTransport;

    /**
     * Borrowed, nonempty, increasing normalized station-u buffer. It fixes
     * rotation-buffer sizes at construction and is read during later updates
     * and queries; preserve length and ordering. compileSweep admits
     * station knots; this kernel does not.
     */
    knots: Float64Array;

    /**
     * True carries the transport's u=0 axes to each spine point; false uses its
     * rotation-minimizing axes at each u. Station rotations still apply in
     * either mode.
     */
    fixed: boolean;
  };
}
