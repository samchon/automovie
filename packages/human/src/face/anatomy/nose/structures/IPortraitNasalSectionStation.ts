/**
 * One transverse control curve of a lower-nasal depth loft. The section height
 * and every control depth use millimetres relative to the socket's datum.
 * Cubic control poles describe a curve; they are not measured surface samples.
 *
 * @author Samchon
 */
export interface IPortraitNasalSectionStation {
  /** Head-Y height relative to the common datum, increasing between stations. */
  height: number;

  /** Head-Z depths at the profile's ordered transverse control poles. */
  depths: readonly number[];
}
