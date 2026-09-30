/**
 * Subject-owned nasal attachment. The two cut populations are triangle ordinals
 * on the measured host, fixed before a component deforms its openings.
 *
 * @author Samchon
 */
export interface IPortraitNoseSocket {
  /** Nasal midline in the host frame, in mm. */
  midline: number;

  /** Tip influence centre Y, in mm. */
  tipY: number;

  /** Tip influence radii in X/Y, in mm. */
  tipRadius: [number, number];

  /** Alar centres' distance from the midline, in mm. */
  alarOffset: number;

  /** Alar centre Y, in mm. */
  alarY: number;

  /** Alar influence radius, in mm. */
  alarRadius: number;

  /** Host skin vertices that the component directly sculpts. */
  surface: number[];

  /** Original triangle ordinals for each nasal opening. */
  nostrils: number[][];

  /** Three retained skin datums spanning the nasal root and paired facial base. */
  supportPlane?: readonly number[];
}
