import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieConstraintViolation } from "./IAutoMovieConstraintViolation";

/**
 * Engine input and result for one declared placed transform, continuity edge or
 * custody requirement.
 */
export namespace IAutoMoviePlacedContinuity {
  /**
   * The producer's actual placed transform at one canonical presentation
   * instant.
   */
  export interface IEndpoint {
    /** Canonical film presentation seconds, finite and nonnegative. */
    readonly seconds: number;

    /**
     * Actual world TRS before any inspection sanitizes it. World translation is
     * in metres.
     */
    readonly transform: IAutoMovieTransform;
  }

  /** One declared observation or requirement at the caller's evidence path. */
  export type IProps = { readonly path: string } & (
    | {
        /**
         * Admit the supplied raw canonical TRS or report an absent required
         * transform.
         */
        readonly kind: "transform";

        /**
         * Omission means the host cannot determine whether the required record
         * exists.
         */
        readonly observation?:
          | { readonly kind: "present"; readonly transform: IAutoMovieTransform }
          | { readonly kind: "missing" };
      }
    | {
        /** Compare two owner-selected canonical endpoints. */
        readonly kind: "step";

        /**
         * A cut or declared discontinuity excludes the relation. Continuous may
         * include an explicitly required seam.
         */
        readonly boundary:
          | "continuous"
          | "cut"
          | "discontinuity"
          | "unavailable";

        /**
         * Outgoing endpoint. Omitted when this canonical endpoint was not
         * observed.
         */
        readonly before?: IEndpoint;

        /**
         * Incoming endpoint. At a required seam it may have the same seconds as
         * before.
         */
        readonly after?: IEndpoint;

        /**
         * Maximum displacement in metres for this pair. Omission leaves the
         * measure unbounded.
         */
        readonly maxDistance?: number;

        /**
         * Maximum shortest angular separation in radians. Omission leaves the
         * measure unbounded.
         */
        readonly maxAngle?: number;
      }
    | {
        /**
         * Check the holder relation under the active authored custody
         * requirement.
         */
        readonly kind: "custody";

        /**
         * The allowed holders at this exact instant. Null explicitly permits a
         * free prop.
         */
        readonly allowed: readonly (string | null)[];

        /**
         * Actual stable holder identity or null when known free. Omitted when
         * the owner could not be observed.
         */
        readonly holder?: string | null;
      }
  );

  /**
   * Located failures and any measured continuous edge values, or explicit
   * coverage.
   */
  export type IResult =
    | {
        readonly status: "checked";

        /** Finds malformed required facts or a known expectation violation. */
        readonly violations: readonly IAutoMovieConstraintViolation[];

        /**
         * Available on valid continuous endpoint pairs, including those with no
         * supplied limits.
         */
        readonly motion?: {
          readonly distance: number;
          readonly angle: number;
        };
      }
    | { readonly status: "excluded" }
    | { readonly status: "unsupported" };
}
