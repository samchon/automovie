/**
 * One bounded, one-dimensional measurement inverse: the channel weight range,
 * the existing weight, the metric target and the caller's reader.
 *
 * @author Samchon
 */
export interface IHumanMeasurementInverseInput {
  /** Finite ordered channel weight range containing `current`. */
  range: [number, number];

  /** Existing channel weight, returned unchanged when the target already reads equal. */
  current: number;

  /** Requested reading, in metres. */
  targetMetres: number;

  /**
   * The caller's reading at one weight, in metres.
   */
  read: (weight: number) => number;

  /** Measurement name stated in refusals. */
  label: string;
}
