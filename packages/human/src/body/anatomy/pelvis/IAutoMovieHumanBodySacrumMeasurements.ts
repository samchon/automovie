import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed midline sacrum volume shared by both pelvic sides.
 *
 * It is one bone, not a left/right duplicate. The posterior sacral surface
 * participates in gluteus maximus origin; a segmented volume does not locate
 * that attachment or reconstruct the sacral surface. Geometry and attachment
 * landmarks are generated state rather than authored coordinates.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySacrumMeasurements {
  /** One midline sacral bone; its volume is separate from both coxal bones. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
