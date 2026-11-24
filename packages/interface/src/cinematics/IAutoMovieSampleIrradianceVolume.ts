import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieIrradianceVolume } from "./IAutoMovieIrradianceVolume";

/**
 * Input of `sampleAutoMovieIrradianceVolume`, the CPU reference of the
 * irradiance a lit material adds from the film's probes.
 */
export namespace IAutoMovieSampleIrradianceVolume {
  /** One receiver. */
  export interface IProps {
    /** The baked grid. */
    volume: IAutoMovieIrradianceVolume;

    /** The receiver's world position, metres. */
    point: IAutoMovieVector3;

    /** The receiver's world unit normal. */
    normal: IAutoMovieVector3;
  }
}
