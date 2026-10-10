/**
 * Why a face measurement reader cannot read the current basis.
 *
 * @author Samchon
 */
export interface IHumanFaceMeasurementGap {
  /** What the basis lacks, for example an unregistered landmark. */
  reason: string;
}
