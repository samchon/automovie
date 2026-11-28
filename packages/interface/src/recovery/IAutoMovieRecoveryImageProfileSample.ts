/**
 * Store one physical Y station and its ordered section-family values in
 * millimetres. The family determines the field order and count.
 */
export interface IAutoMovieRecoveryImageProfileSample<
  T extends number[] = number[],
> {
  /** Physical Y station in the common chart, in millimetres. */
  yMm: number;

  /** Section-family scalars in the specified field order, all in millimetres. */
  values: T;
}
