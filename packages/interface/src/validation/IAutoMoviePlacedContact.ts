import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieConstraintViolation } from "./IAutoMovieConstraintViolation";

/**
 * Measurements of an evaluated contact against its declared owner at one film
 * instant.
 */
export namespace IAutoMoviePlacedContact {
  /** The placed point and the support-relative target for a declared contact. */
  export interface ISupportSample {
    /**
     * Actual placed point at the active sole socket or other declared contact,
     * in world metres.
     */
    readonly point: IAutoMovieVector3;

    /**
     * Rigid support frame at this instant. Its positive Y axis points away from
     * the support surface.
     */
    readonly frame: IAutoMovieRigidTransform;

    /**
     * Expected point in support-local metres, supplied by the owner of the
     * active contact phase.
     */
    readonly anchor: IAutoMovieVector3;
  }

  /** Placed hand and prop frames and the expected relative grip. */
  export interface IGripSample {
    /** Actual placed grip socket in world metres and orientation. */
    readonly hand: IAutoMovieRigidTransform;

    /** Actual placed prop in world metres and orientation. */
    readonly prop: IAutoMovieRigidTransform;

    /**
     * Expected prop frame relative to the hand, including any authored in-hand
     * motion at this instant.
     */
    readonly expected: IAutoMovieRigidTransform;
  }

  /**
   * One active check and its declared limits, with absent observations left
   * uncovered.
   */
  export type IProps = { readonly path: string } & (
    | {
        /** The support sample and two distances are measured in metres. */
        readonly kind: "support";

        /**
         * Omitted when the declared active contact cannot be observed in the
         * placed scene.
         */
        readonly sample?: ISupportSample;

        /** Maximum absolute gap along the support normal, metres. */
        readonly maxGap: number;

        /**
         * Maximum distance from the expected point along the support plane,
         * metres.
         */
        readonly maxSlip: number;
      }
    | {
        /**
         * The grip sample uses a distance limit and a shortest rotation angle
         * limit.
         */
        readonly kind: "grip";

        /**
         * Omitted when the declared active grip cannot be observed in the
         * placed scene.
         */
        readonly sample?: IGripSample;

        /** Maximum position separation in the hand's frame, metres. */
        readonly maxDistance: number;

        /** Maximum orientation separation, radians in [0, π]. */
        readonly maxAngle: number;
      }
  );

  /** Measured contact values and findings or coverage for unavailable evidence. */
  export type IResult =
    | {
        readonly status: "checked";
        readonly kind: "support";

        /**
         * Signed normal gap in metres. Positive values put the point above its
         * support target.
         */
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
