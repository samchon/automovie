import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieConstraintViolation } from "./IAutoMovieConstraintViolation";

/**
 * Measurements of an evaluated contact against its declared owner at one film instant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The inputs name the observed frames, authored target, units and unavailable case. The result separates measured findings from invalid inputs and unsupported coverage.
 * @evidence contracts/development/design.md#principled-representation A support compares a point against a carrier-local anchor. A grip compares two world rigid frames against one hand-local offset. Their geometric quantities and limits remain distinct.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Engine measures the two relations. A production adapter selects the declared active contact and supplies the same placed facts to each inspection host.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No branch supplies a rest pose or chooses a support based on proximity. Discriminants separate the inputs and measurements used by each relation.
 */
export namespace IAutoMoviePlacedContact {
  /**
   * The placed point and the support-relative target for a declared contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines world observation, metre-valued local anchor, positive support normal and active rolling contact ownership.
   * @evidence contracts/development/design.md#principled-representation A rigid frame establishes local XZ tangent directions and the local positive Y normal. The anchor and actual point are separate observations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The support owner can supply floor, moving deck or currently active rolling point through the same record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The anchor comes from the contact declaration or plan. An evaluated point cannot serve as its own target.
   */
  export interface ISupportSample {
    /** Actual placed point at the active sole socket or other declared contact, in world metres. */
    readonly point: IAutoMovieVector3;

    /** Rigid support frame at this instant. Its positive Y axis points away from the support surface. */
    readonly frame: IAutoMovieRigidTransform;

    /** Expected point in support-local metres, supplied by the owner of the active contact phase. */
    readonly anchor: IAutoMovieVector3;
  }

  /**
   * Placed hand and prop frames and the expected relative grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the actual hand socket, prop world frame and authored target in hand-local metres and unit orientation.
   * @evidence contracts/development/design.md#principled-representation Two actual rigid placements determine the prop's relationship to the hand. The owner supplies an independent target for the same instant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The grip owner folds the declared in-hand motion into its target and supplies the correct claimant at handoff boundaries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No fixture-specific object, guessed held offset or always-fixed grip assumption is required.
   */
  export interface IGripSample {
    /** Actual placed grip socket in world metres and orientation. */
    readonly hand: IAutoMovieRigidTransform;

    /** Actual placed prop in world metres and orientation. */
    readonly prop: IAutoMovieRigidTransform;

    /** Expected prop frame relative to the hand, including any authored in-hand motion at this instant. */
    readonly expected: IAutoMovieRigidTransform;
  }

  /**
   * One active check and its declared limits, with absent observations left uncovered.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the report path, absent observation effect, maximum absolute normal gap, maximum tangential slip and grip limits.
   * @evidence contracts/development/design.md#principled-representation The discriminant ties each geometry relation to its own finite nonnegative limits. Grip angle uses radians in [0, π].
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the current placed evidence and thresholds enter Engine. Timeline, custody selection and report aggregation remain with the caller.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An omitted sample does not imply zero gap, perfect grip or no active expectation.
   */
  export type IProps = { readonly path: string } & (
    | {
        /** The support sample and two distances are measured in metres. */
        readonly kind: "support";

        /** Omitted when the declared active contact cannot be observed in the placed scene. */
        readonly sample?: ISupportSample;

        /** Maximum absolute gap along the support normal, metres. */
        readonly maxGap: number;

        /** Maximum distance from the expected point along the support plane, metres. */
        readonly maxSlip: number;
      }
    | {
        /** The grip sample uses a distance limit and a shortest rotation angle limit. */
        readonly kind: "grip";

        /** Omitted when the declared active grip cannot be observed in the placed scene. */
        readonly sample?: IGripSample;

        /** Maximum position separation in the hand's frame, metres. */
        readonly maxDistance: number;

        /** Maximum orientation separation, radians in [0, π]. */
        readonly maxAngle: number;
      }
  );

  /**
   * Measured contact values and findings or coverage for unavailable evidence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the axis and sign of gap, the tangential metric, grip separation units and each coverage case.
   * @evidence contracts/development/design.md#principled-representation The measured arm keeps explicit metrics and breaches. An invalid arm reports numeric or structural input problems. The unsupported arm carries no invented measurements.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Measures and canonical validation findings let the adapter report a located check without repeating the computation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A refused input cannot be mistaken for a measured contact. A measured contact can carry violations.
   */
  export type IResult =
    | {
        readonly status: "checked";
        readonly kind: "support";

        /** Signed normal gap in metres. Positive values put the point above its support target. */
        readonly gap: number;

        /** Tangential distance from the expected anchor, metres. */
        readonly slip: number;

        /** Findings for exceeded limits. Empty when both limits pass. */
        readonly violations: readonly IAutoMovieConstraintViolation[];
      }
    | {
        readonly status: "checked";
        readonly kind: "grip";

        /** Position separation from the expected offset, metres. */
        readonly distance: number;

        /** Shortest orientation separation in radians. */
        readonly angle: number;

        /** Findings for exceeded limits. Empty when both limits pass. */
        readonly violations: readonly IAutoMovieConstraintViolation[];
      }
    | {
        readonly status: "invalid";

        /** Findings for malformed inputs or unrepresentable measured quantities. */
        readonly violations: readonly IAutoMovieConstraintViolation[];
      }
    | { readonly status: "unsupported" };
}
