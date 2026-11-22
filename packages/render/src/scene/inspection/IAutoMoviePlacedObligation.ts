import type {
  IAutoMovieConstraintViolation,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";

/**
 * The outcome of one placed obligation: measured with its violations and
 * witness, or unavailable with the coverage reason.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two outcomes and what each carries.
 * @evidence contracts/development/design.md#principled-representation A checked obligation keeps its violations and witness together; an unavailable one keeps only its coverage status and reason.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries exactly what the observer turns into findings and coverage.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unavailable obligation has no violations to mistake for a pass.
 */
export type IAutoMoviePlacedObligation =
  | {
      readonly status: "checked";
      readonly violations: readonly IAutoMovieConstraintViolation[];
      readonly witness: IAutoMovieInspectionDiagnostics.IWitness;
    }
  | {
      readonly status: "unsupported" | "excluded";
      readonly reason: string;
    };
