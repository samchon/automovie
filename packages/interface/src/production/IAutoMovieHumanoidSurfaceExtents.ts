import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/** Physical-segment bounds reader used to limit humanoid surface-region radii. */
export namespace IAutoMovieHumanoidSurfaceExtents {
  /**
   * Synchronous lookup of one bone's physical-segment collider bounds at
   * neutral placement, in model-rest metres.
   *
   * humanoidSurfaceExtents reads the least axis breadth, halves it,
   * and combines that with half the nearest same-facing region distance, then
   * applies a 0.01 m contact-radius floor. The callback therefore supplies the
   * segment box, not the resulting region disc. The surface-ray tools
   * implementation returns fresh extrema over the segment's shapes and throws
   * for a missing segment; an empty shape list leaves infinite sentinel
   * corners. The extent operation does not validate or mutate the result and
   * propagates callback exceptions. It may request the same bone for several
   * regions and retains neither the callback nor returned boxes after the
   * call.
   */
  export type ReadBounds = (bone: AutoMovieHumanoidBone) => {
    /**
     * Lower corner of the union of this segment's collider bounds after neutral
     * placement, in model-rest metres, not bone-local coordinates.
     */
    min: IAutoMovieVector3;

    /**
     * Upper corner in the same frame; max-minus-min gives the three breadths.
     * Empty shape lists in the standard reader leave negative-infinite maxima.
     */
    max: IAutoMovieVector3;
  };
}
