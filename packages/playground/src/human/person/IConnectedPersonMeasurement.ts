/**
 * A measured body channel solved for a target: the new shape and the length
 * the solved body actually measures, in metres.
 *
 * @author Samchon
 */
export interface IConnectedPersonMeasurement {
  /** The body shape after the solve. */
  shape: Record<string, number>;

  /** The measured length of the solved body, metres. */
  actualMetres: number;
}
