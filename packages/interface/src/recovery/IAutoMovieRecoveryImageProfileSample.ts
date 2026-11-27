/** Co-charted scalar observations at one physical row. */
export interface IAutoMovieRecoveryImageProfileSample<
  T extends number[] = number[],
> {
  /** Physical model Y coordinate, millimetres. */
  yMm: number;

  /** Ordered section-family scalar fields, millimetres. */
  values: T;
}
