/**
 * A final shared rim sample and its positive exterior transverse direction.
 *
 * @author Samchon
 */
export interface IPortraitNasalRimJet {
  /** Shared rim position in head millimetres. */
  point: readonly number[];

  /** Unit tangent along the ordered cyclic aperture boundary. */
  tangent: readonly number[];

  /** Unit surface co-normal pointing from the rim towards exterior skin. */
  transverse: readonly number[];
}
