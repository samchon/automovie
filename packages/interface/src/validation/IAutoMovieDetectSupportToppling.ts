import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Static support-hull facts supplied to the toppling adviser. */
export namespace IAutoMovieDetectSupportToppling {
  /**
   * Borrowed world geometry for one instant. detectSupportToppling compares XZ
   * center-to-convex-hull distance with margin and uses the nearest hull edge
   * as the candidate pivot. Empty support or invalid margin returns a finding;
   * finite representable point coordinates remain a caller premise rather than
   * a checked guarantee.
   *
   * An overhang produces a fresh time-zero fall event at the nearest XZ point
   * and the center's height. Unsuppressed advice also includes a horizontal
   * direction and excess distance. Pivot endpoints borrow support records;
   * input arrays are unchanged. This static sampled geometry does not prove
   * dynamic instability or create motion.
   */
  export type IProps = {
    /** Scene node id attached to the event; omission produces a null actor. */
    node?: string | undefined;

    /**
     * World center in metres; XZ determines overhang and Y supplies the event
     * point's height.
     */
    centerOfMass: IAutoMovieVector3;

    /**
     * Nonempty borrowed world contact points in metres; projected to an XZ
     * hull, with returned pivot endpoints potentially aliasing these records.
     */
    support: readonly IAutoMovieVector3[];

    /**
     * Finite nonnegative horizontal allowance in metres, default 0.02; distance
     * equal to margin produces no event.
     */
    margin?: number | undefined;

    /**
     * Any defined string, including empty, keeps the overhang event but
     * suppresses its warning and toppling suggestion.
     */
    physicsIntent?: string | undefined;

    /**
     * Diagnostic path prefix, default "$input"; no scene-node resolution is
     * performed from it.
     */
    path?: string | undefined;
  };
}
