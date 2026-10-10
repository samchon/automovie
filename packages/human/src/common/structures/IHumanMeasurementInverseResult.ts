/**
 * The weight a measurement inverse selected and the reading it gives.
 *
 * @author Samchon
 */
export interface IHumanMeasurementInverseResult {
  /** Selected channel weight. */
  weight: number;

  /** The caller's reading at `weight`, in metres. */
  actualMetres: number;
}
