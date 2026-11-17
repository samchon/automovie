import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Static support-hull facts supplied to the toppling adviser.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Static support-hull facts supplied to the toppling adviser. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation World metre geometry and a horizontal margin define one static support query.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The support adviser joins existing hull geometry to canonical event/toppling results.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A static hull query is not a dynamic simulation or complete stability proof.
 */
export namespace IAutoMovieDetectSupportToppling {
  /**
   * Borrowed world geometry for one instant. detectSupportToppling compares XZ center-to-convex-hull distance with margin and uses the nearest hull edge as the candidate pivot. Empty support or invalid margin returns a finding; finite representable point coordinates remain a caller premise rather than a checked guarantee.
   *
   * An overhang produces a fresh time-zero fall event at the nearest XZ point and the center's height. Unsuppressed advice also includes a horizontal direction and excess distance. Pivot endpoints borrow support records; input arrays are unchanged. This static sampled geometry does not prove dynamic instability or create motion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines frame, support predicate, defaults, admission limits and borrowed pivot ownership.
   * @evidence contracts/development/design.md#principled-representation World metre points and a metre margin determine horizontal overhang; canonical vector records preserve the full points for reporting the pivot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The adviser reuses hull and segment geometry and returns canonical support advice without a physical simulator or actor-state owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Empty support is refused rather than fabricated; physicsIntent suppresses advice while preserving the event, and no dynamic-stability verdict is implied.
   */
  export type IProps = {
    /** Scene node id attached to the event; omission produces a null actor. */
    node?: string | undefined;

    /** World center in metres; XZ determines overhang and Y supplies the event point's height. */
    centerOfMass: IAutoMovieVector3;

    /** Nonempty borrowed world contact points in metres; projected to an XZ hull, with returned pivot endpoints potentially aliasing these records. */
    support: readonly IAutoMovieVector3[];

    /** Finite nonnegative horizontal allowance in metres, default 0.02; distance equal to margin produces no event. */
    margin?: number | undefined;

    /** Any defined string, including empty, keeps the overhang event but suppresses its warning and toppling suggestion. */
    physicsIntent?: string | undefined;

    /** Diagnostic path prefix, default "$input"; no scene-node resolution is performed from it. */
    path?: string | undefined;
  };
}
