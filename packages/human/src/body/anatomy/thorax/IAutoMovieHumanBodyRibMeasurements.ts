import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One numbered bony rib distinct from its costal cartilage and neighbour.
 *
 * A volume is an optional imaging/target constraint, not a curved rib path,
 * anterior junction, respiratory motion or user-authored 3D control spline.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyRibMeasurements {
  /** Osseous rib volume alone, excluding cartilage and intercostal muscle. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
