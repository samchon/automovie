/**
 * One longitudinal section's forward volume, in construction millimetres.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates columellar/infratip, paired shoulder and alar forward extents at one lower-nose section.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines an ordered head-Y station and three independent millimetre section values.
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
