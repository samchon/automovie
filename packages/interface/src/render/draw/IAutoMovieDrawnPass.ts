import type { IAutoMovieInspectionRequest } from "../inspection/IAutoMovieInspectionRequest.js";
import type { IAutoMovieRasterImage } from "../picture/IAutoMovieRasterImage.js";

/**
 * One decoded pass of a sampled subject frame. AutoMovieDrawSession.frame emits records in requested pass order, using the same second, raster and film camera for each; picture storage belongs to the caller.
 *
 * @evidence contracts/development/design.md#principled-representation AutoMovieDrawSession.frame emits records in requested pass order, using the same second, raster and film camera for each; picture storage belongs to the caller.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieDrawSession.frame exchanges pass, picture; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts AutoMovieDrawSession.frame emits records in requested pass order, using the same second, raster and film camera for each; picture storage belongs to the caller.
 * @evidence contracts/development/common.md#meaningful-documentation One decoded pass of a sampled subject frame. The prose and members document how AutoMovieDrawSession.frame interprets and admits these values.
 */
export interface IAutoMovieDrawnPass {
  /** Inspection shade or guide pass requested for this picture. */
  pass: IAutoMovieInspectionRequest.Shade;
  /** Owned decoded raster of this pass at the sampled second. */
  picture: IAutoMovieRasterImage;
}
