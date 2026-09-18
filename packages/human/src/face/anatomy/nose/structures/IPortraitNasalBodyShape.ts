import { IPortraitNasalBodyStation } from "./IPortraitNasalBodyStation";

/**
 * Section/volume controls for one connected lower nose, without aperture pose.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Controls a connected lower-nose body independently of nostril placement.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines longitudinal stations, transverse widths and independent paired alar fullness, spread and crease profiles.
 * @author Samchon
 */
export interface IPortraitNasalBodyShape {
  /** At least two ordered longitudinal stations; endpoint extents must be zero. */
  stations: readonly IPortraitNasalBodyStation[];
  /** Midline section half-width, in mm. */
  centreWidth: number;
  /** Paired shoulder centres' distance from the midline, in mm. */
  shoulderOffset: number;
  /** Each shoulder section's compact half-width, in mm. */
  shoulderWidth: number;
  /** Paired alar centres' distance from the midline, in mm. */
  alarOffset: number;
  /** Each alar section's compact half-width, in mm. */
  alarWidth: number;
  /** Additional right/left alar forward extent, in mm, on the same alar profile. */
  fullness: readonly [number, number];
  /** Right/left lateral support at the alar profile peak, in mm. */
  spread: readonly [number, number];
  /** Alar-facial crease centres lie this far lateral to each alar centre, in mm. */
  creaseOffset: number;
  /** Compact half-width of each alar-facial crease section, in mm. */
  creaseWidth: number;
  /** Right/left crease recession, in mm; positive values move into the face. */
  crease: readonly [number, number];
}
