/**
 * One longitudinal section's forward volume, in construction millimetres.
 *
 * @author Samchon
 */
export interface IPortraitNasalBodyStation {
  /** Head-Y station, increasing from sill toward the lower dorsum, in mm. */
  height: number;

  /** Midline infratip/columellar forward extent at this section, in mm. */
  centre: number;

  /** Paired lower-tip shoulder extent, in mm. */
  shoulder: number;

  /** Paired alar-body forward extent, in mm. */
  ala: number;
}
