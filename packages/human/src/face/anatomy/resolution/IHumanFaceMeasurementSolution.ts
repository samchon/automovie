/**
 * The channel weight a face measurement target solved to and the value it
 * reads.
 *
 * @author Samchon
 */
export interface IHumanFaceMeasurementSolution {
  /** The channel whose weight was solved. */
  channel: string;

  /** The solved weight, inside the channel's envelope. */
  weight: number;

  /** The reading at that weight, in the measurement's unit. */
  measured: number;
}
