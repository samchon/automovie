import type { IAutoMovieBeatEndState } from "../harness/IAutoMovieBeatEndState";

/**
 * Data and callback contracts shared by the ValidateContinuity operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compare every prior-end actor to the incoming opening for missing presence, Euclidean drift, facing angle and persistent mount changes. Member documentation states the supplied records, units and absence meanings used by validateContinuity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The two boundary states remain distinct and reuse one end-state shape; continuity compares presence, placement and mounts without fabricating missing actors.
 * @evidence contracts/development/design.md#principled-representation previous and opening are canonical beat boundary states; positionTolerance is world metres and facingToleranceDeg is degrees, defaulting to 0.05 and 5.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateContinuity, used by validateContinuity. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateContinuity {
  /**
   * Compare every prior-end actor to the incoming opening for missing presence, Euclidean drift, facing angle and persistent mount changes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Compare every prior-end actor to the incoming opening for missing presence, Euclidean drift, facing angle and persistent mount changes. Member documentation states the supplied records, units and absence meanings used by validateContinuity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The two boundary states remain distinct and reuse one end-state shape; continuity compares presence, placement and mounts without fabricating missing actors.
   * @evidence contracts/development/design.md#principled-representation previous and opening are canonical beat boundary states; positionTolerance is world metres and facingToleranceDeg is degrees, defaulting to 0.05 and 5.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateContinuity.IProps, used by validateContinuity. Its previous, opening, positionTolerance, facingToleranceDeg members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** The previous beat's resolved end-state. */
    previous: IAutoMovieBeatEndState;

    /** The incoming beat's resolved opening-state. */
    opening: IAutoMovieBeatEndState;

    /** World-space position drift tolerated (metres); defaults to 0.05. */
    positionTolerance?: number;

    /** Facing drift tolerated (degrees); defaults to 5. */
    facingToleranceDeg?: number;
  };
}
