import { IAutoMovieConstraintViolation } from "@automovie/interface";

/** One actionable failure at the public authoring boundary. */
export interface IAutoMovieAuthoringDiagnostic {
  /** Stable machine-readable category. */
  code:
    | "registration-invalid"
    | "builder-failed"
    | "contract-mismatch"
    | "contract-realization-failed"
    | "stage-invalid"
    | "blocking-invalid"
    | "performance-invalid"
    | "pipeline-failed";
  /** Pipeline phase that owns the correction. */
  phase:
    | "registration"
    | "build"
    | "stage"
    | "blocking"
    | "performance"
    | "contract"
    | "continuity";
  /** Exact source or generated field that failed. */
  path: string;
  /** What was observed, including the offending identity or value. */
  fact: string;
  /** Why the failure prevents a trustworthy shot artifact. */
  impact: string;
  /** Concrete source edit or input correction that permits the next attempt. */
  recovery: string;
  /** Original domain violation when a lower engine gate produced one. */
  violation?: IAutoMovieConstraintViolation;
}
