import type { IAutoMovieProductionPngPicture } from "../production/IAutoMovieProductionPngPicture";
import type { IAutoMovieProductionPngProfile } from "./IAutoMovieProductionPngProfile";

/**
 * Required PNG profile and parser-observed picture facts.
 * assertProductionPngPicture compares the supported pixel-format, raster,
 * aspect and orientation fields and throws on mismatch; neither record owns
 * image bytes.
 */
export interface IAutoMovieAssertProductionPngPictureProps {
  /** Profile of the role the PNG was written for. */
  profile: IAutoMovieProductionPngProfile;

  /** Facts the PNG parser observed in the delivered file. */
  actual: IAutoMovieProductionPngPicture;
}
