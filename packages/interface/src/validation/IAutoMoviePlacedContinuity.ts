import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieConstraintViolation } from "./IAutoMovieConstraintViolation";

/**
 * Engine input and result for one declared placed transform, continuity edge or custody requirement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The input variants distinguish missing and unavailable facts. The endpoint record defines the presentation clock and frame. The result separates evaluated checks from excluded or unsupported coverage.
 * @evidence contracts/development/design.md#principled-representation A continuity edge, transform admission and holder relation each have their own observations and policy.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Production selects an explicit edge or custody rule. Engine supplies local checks over those facts to the diagnostics adapter.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither a prior UI visit nor a default speed or cut interpretation enters the contract.
 */
export namespace IAutoMoviePlacedContinuity {
  /**
   * The producer's actual placed transform at one canonical presentation instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States exact film seconds, world frame and the before/after use at an explicitly required seam.
   * @evidence contracts/development/design.md#principled-representation The finite placed TRS and presentation time refer to the same evaluation. The caller selects endpoints within the declared continuity relation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies the actual transform and time to the pure Engine comparison. Frame index and source retime remain with the timeline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A transform is not inferred from an observed animation clip or normalized during capture.
   */
  export interface IEndpoint {
    /** Canonical film presentation seconds, finite and nonnegative. */
    readonly seconds: number;

    /** Actual world TRS before any inspection sanitizes it. World translation is in metres. */
    readonly transform: IAutoMovieTransform;
  }

  /**
   * One declared observation or requirement at the caller's evidence path.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines raw transform admission, explicitly absent records, uncertain coverage, intentional boundaries and exact source ownership of the holder.
   * @evidence contracts/development/design.md#principled-representation Discriminated cases keep unchecked data for a structural check separate from typed endpoints and declared identities. Distance and angle limits use metres and radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A caller provides its own permitted boundary, explicit limits and allowed custodians without handing Engine any scene, seek callback or cached history.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Omitted evidence stays uncovered. A confirmed absence or free prop can be distinguished from an unavailable provider.
   */
  export type IProps = { readonly path: string } & (
    | {
        /** Admit the supplied raw canonical TRS or report an absent required transform. */
        readonly kind: "transform";

        /** Omission means the host cannot determine whether the required record exists. */
        readonly observation?:
          | { readonly kind: "present"; readonly transform: unknown }
          | { readonly kind: "missing" };
      }
    | {
        /** Compare two owner-selected canonical endpoints. */
        readonly kind: "step";

        /** A cut or declared discontinuity excludes the relation. Continuous may include an explicitly required seam. */
        readonly boundary:
          | "continuous"
          | "cut"
          | "discontinuity"
          | "unavailable";

        /** Outgoing endpoint. Omitted when this canonical endpoint was not observed. */
        readonly before?: IEndpoint;

        /** Incoming endpoint. At a required seam it may have the same seconds as before. */
        readonly after?: IEndpoint;

        /** Maximum displacement in metres for this pair. Omission leaves the measure unbounded. */
        readonly maxDistance?: number;

        /** Maximum shortest angular separation in radians. Omission leaves the measure unbounded. */
        readonly maxAngle?: number;
      }
    | {
        /** Check the holder relation under the active authored custody requirement. */
        readonly kind: "custody";

        /** The allowed holders at this exact instant. Null explicitly permits a free prop. */
        readonly allowed: readonly (string | null)[];

        /** Actual stable holder identity or null when known free. Omitted when the owner could not be observed. */
        readonly holder?: string | null;
      }
  );

  /**
   * Located failures and any measured continuous edge values, or explicit coverage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes checked failure, excluded and unsupported coverage. Measured edge units are metres and radians.
   * @evidence contracts/development/design.md#principled-representation An admitted continuous pair exposes its observations even if no threshold is supplied. A malformed pair can report violations without numeric metrics.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Canonical violations carry field paths and failed bounds. The adapter supplies shot, source, frame and report context.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No continuous motion or holder outcome is claimed for unobserved or excluded pairs.
   */
  export type IResult =
    | {
        readonly status: "checked";

        /** Finds malformed required facts or a known expectation violation. */
        readonly violations: readonly IAutoMovieConstraintViolation[];

        /** Available on valid continuous endpoint pairs, including those with no supplied limits. */
        readonly motion?: {
          readonly distance: number;
          readonly angle: number;
        };
      }
    | { readonly status: "excluded" }
    | { readonly status: "unsupported" };
}
