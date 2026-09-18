/**
 * One transverse control curve of a lower-nasal depth loft. The section height
 * and every control depth use millimetres relative to the socket's datum.
 * Cubic control poles describe a curve; they are not measured surface samples.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Defines a transverse lower-nose depth curve independently of surface sampling density.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries one local head-Y height and ordered head-Z control depths relative to the same socket datum.
 */
export interface IPortraitNasalSectionStation {
  /** Head-Y height relative to the common datum, increasing between stations. */
  height: number;

  /** Head-Z depths at the profile's ordered transverse control poles. */
  depths: readonly number[];
}
