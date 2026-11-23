import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Nullable model-frame rest bounds used by camera subject measurement. */
export namespace IAutoMovieComputeModelRestExtent {
  /**
   * A model's rest-pose box in model space: the axis-aligned range, in metres,
   * of its portable part geometry, on all three axes. External asset bytes are
   * not opened here, so proxy parts do not establish the imported asset's pixel
   * extent.
   *
   * Every vertex is placed the way the renderer places it: by its part's own
   * transform through {@link placeTransformedPoint}, then by the rest frame of
   * the bone the part rides, or left in model space when it rides none. The
   * canonical geometry realizer supplies primitive and bicubic recipe vertices,
   * retaining finite partial output, so framing does not reject an otherwise
   * displayable recipe. A trailing partial `x, y, z` triple in a mesh is
   * ignored.
   *
   * {@link computeModelRestExtentY} is this box read on the vertical axis. The
   * horizontal half is what a subject wider than it is tall is framed and
   * graded from: a 60 m facade authored outward from its element origin has a
   * drawn box of `x 0…60, y 0…24, z −1…1`, where the vertical read alone
   * reports `y 0…24`.
   *
   * Returns null when no part has a vertex, leaving the caller's own fallback
   * in charge rather than inventing an extent. Throws, through
   * {@link skeletonRestFrames}, when the model's skeleton is malformed.
   */
  export type IResult = {
    /**
     * New componentwise minimum of measured vertices in model metres. For
     * admitted finite geometry each component is at most max; the measurement
     * does not independently sanitize malformed coordinates.
     */
    min: IAutoMovieVector3;
    /**
     * New componentwise maximum in the same model frame. Both vectors belong to
     * the returned box and do not alias model vertices.
     */
    max: IAutoMovieVector3;
  } | null;
}
