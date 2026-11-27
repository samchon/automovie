import type {
  IAutoMovieConstraintViolation,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";

/*
 * The outcome of one placed obligation: measured with its violations and
 * witness, or unavailable with the coverage reason.
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
