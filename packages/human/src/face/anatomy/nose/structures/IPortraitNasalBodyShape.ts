import { IPortraitNasalBodyStation } from "./IPortraitNasalBodyStation";

/**
 * Section/volume controls for one connected lower nose, without aperture pose.
 *
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
