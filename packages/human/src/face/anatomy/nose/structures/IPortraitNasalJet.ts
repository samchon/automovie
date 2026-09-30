/**
 * A position and physical first derivative on a millimetre-valued section.
 *
 * @author Samchon
 */
export interface IPortraitNasalJet {
  /** XYZ in the common head frame, in mm. */
  point: readonly number[];

  /** dXYZ/ds for physical section distance s in mm; this is not normalized. */
  derivative: readonly number[];
}
