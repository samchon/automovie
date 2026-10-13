/** A field-located malformed joint-axis basis issue. */
export interface IAutoMovieJointAxesIssue {
  /** JSON-ish path to the offending axis field. */
  path: string;

  /** Human-readable correction requirement. */
  expected: string;

  /** Offending value. */
  value: unknown;
}
