import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieBody } from "../model/IAutoMovieBody";

/** Declared support and initial trajectory facts for the free-fall adviser. */
export namespace IAutoMovieDetectFreeFall {
  /**
   * Borrowed world-space facts for one instant. detectFreeFall considers a
   * nonnull body unsupported when its XZ center lies farther than margin from
   * the support hull, or support is empty, and neither attached nor falling is
   * true. It does not discover contacts or validate the body's mass.
   *
   * Invalid margin or duration returns a finding immediately. An unsupported
   * candidate emits a time-zero event whose point borrows centerOfMass; absent
   * physicsIntent it also warns and builds a fresh projectile clip. Vector, fps
   * and allocation errors can propagate from trajectory generation. No motion
   * is applied to inputs.
   */
  export type IProps = {
    /**
     * Scene node id for the event and proposed clip; omission gives a null
     * event actor and clip target "object".
     */
    node?: string | undefined;

    /**
     * Declared physical body; null skips fall advice, while a nonnull record is
     * used only as a presence test here.
     */
    body: IAutoMovieBody | null;

    /**
     * World center in metres; borrowed directly by a fall event and read as
     * trajectory origin. Finite representable geometry is a caller premise for
     * support queries.
     */
    centerOfMass: IAutoMovieVector3;

    /**
     * Borrowed world support points in metres, projected to XZ; empty means
     * unsupported, and point heights do not affect that decision.
     */
    support: readonly IAutoMovieVector3[];

    /**
     * True when another object holds or attaches this body, suppressing the
     * candidate fall.
     */
    attached: boolean;

    /**
     * True when a fall is already authored/in progress, preventing duplicate
     * advice.
     */
    falling: boolean;

    /**
     * Allowed horizontal distance beyond support in metres, default 0.02; must
     * be finite and nonnegative, with equality treated as supported.
     */
    margin?: number | undefined;

    /**
     * World acceleration in m/s^2, default AutoMovieEngineGravity.DOWN; checked by
     * trajectory generation only if a trajectory is requested.
     */
    gravity?: IAutoMovieVector3 | undefined;

    /**
     * Initial world velocity in m/s, default zero; checked when the proposed
     * trajectory is built.
     */
    velocity?: IAutoMovieVector3 | undefined;

    /**
     * Proposed clip duration in seconds, default 1; finite positive admission
     * runs even when no fall would occur.
     */
    fallDuration?: number | undefined;

    /**
     * Proposed trajectory samples per second, default 30; delegated trajectory
     * admission can throw.
     */
    fps?: number | undefined;

    /**
     * Any defined string suppresses the warning and trajectory but keeps the
     * candidate event; its content is not interpreted.
     */
    physicsIntent?: string | undefined;

    /** Finding-path prefix, default "$input"; unrelated to the node lookup id. */
    path?: string | undefined;
  };
}
