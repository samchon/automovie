import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import type { IAutoMovieReferenceGround } from "./IAutoMovieReferenceGround";

/**
 * Data contracts of `autoMovieSkyIlluminance`, the isotropic sky term shared by
 * the daylight study and the illuminance meter.
 */
export namespace IAutoMovieSkyIlluminance {
  /**
   * One plane orientation under one declared sky, measured at any number of
   * points.
   *
   * The sky is isotropic with diffuse horizontal illuminance `illuminance`, in
   * lux; a point's sky illuminance is `illuminance × V`, where `V` is the
   * fraction of `count` cosine-weighted directions around `normal` that rise
   * above `ground` and leave the point without crossing a solid.
   */
  export type IProps = {
    /** World normal of the measured plane; finite and non-zero, any length. */
    normal: IAutoMovieVector3;

    /** Reference ground whose up direction is the horizon. */
    ground: IAutoMovieReferenceGround;

    /** Number of hemisphere directions, a positive safe integer. */
    count: number;

    /** Diffuse horizontal illuminance of the sky, in lux; at or above zero. */
    illuminance: number;

    /** Convex solids that block sky rays, in world metres. */
    solids: readonly IAutoMovieAnalysisSolid[];
  };
}
