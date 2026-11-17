import type { IAutoMovieProductionPngPicture } from "../../production/IAutoMovieProductionPngPicture.js";
import type { IAutoMovieProductionPngProfile } from "./IAutoMovieProductionPngProfile.js";

/**
 * Required PNG profile and parser-observed picture facts. assertProductionPngPicture compares the supported pixel-format, raster, aspect and orientation fields and throws on mismatch; neither record owns image bytes.
 *
 * @evidence contracts/development/design.md#principled-representation Required PNG profile and parser-observed picture facts. assertProductionPngPicture compares the supported pixel-format, raster, aspect and orientation fields and throws on mismatch; neither record owns image bytes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface assertProductionPngPicture exchanges profile, actual; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required PNG profile and parser-observed picture facts. assertProductionPngPicture compares the supported pixel-format, raster, aspect and orientation fields and throws on mismatch; neither record owns image bytes.
 * @evidence contracts/development/common.md#meaningful-documentation Required PNG profile and parser-observed picture facts. assertProductionPngPicture compares the supported pixel-format, raster, aspect and orientation fields and throws on mismatch; neither record owns image bytes. The prose and members document how assertProductionPngPicture interprets and admits these values.
 */
export interface IAutoMovieAssertProductionPngPictureProps {
  /** Profile of the role the PNG was written for. */
  profile: IAutoMovieProductionPngProfile;

  /** Facts the PNG parser observed in the delivered file. */
  actual: IAutoMovieProductionPngPicture;
}
