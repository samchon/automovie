/** One structured defect or unsupported case a pattern run reports. */
export interface IAutoMoviePatternFinding {
  /** What the run measured and found wanting. */
  kind:
    | "sliver"
    | "unsupported-piece"
    | "module-overlap"
    | "joint-deviation"
    | "grain-break";
  /** Occurrence ids involved, in ascending placement order. */
  occurrences: string[];
  /** The measured quantity, in the finding's own unit. */
  measured: number;
  /** The limit the measurement failed against. */
  limit: number;
  /** A statement an author or an agent can act on. */
  detail: string;
}
