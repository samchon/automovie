import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Physical-segment bounds reader used to limit humanoid surface-region radii. */
export namespace IAutoMovieHumanoidSurfaceExtents {
  /**
   * Synchronous lookup of one bone's physical-segment collider bounds at neutral placement, in model-rest metres.
   *
   * AutoMovieHumanoidSurfaceExtents reads the least axis breadth, halves it, and combines that with half the nearest same-facing region distance, then applies a 0.01 m contact-radius floor. The callback therefore supplies the segment box, not the resulting region disc. The surface-ray tools implementation returns fresh extrema over the segment's shapes and throws for a missing segment; an empty shape list leaves infinite sentinel corners. The extent operation does not validate or mutate the result and propagates callback exceptions. It may request the same bone for several regions and retains neither the callback nor returned boxes after the call.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the callback frame, breadth use, repeated calls, exceptions, empty-shape sentinel and borrowed lifetime.
   * @evidence contracts/development/design.md#principled-representation A canonical humanoid bone selects model-rest axis bounds in metres; validatePhysicalProfile admits nonempty segment shapes, and callback providers must preserve finite ordered corners for a meaningful breadth.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The extent calculation only reads a bone's min/max corners; collider construction and rig lookup stay with the surface-reader implementation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The 10 mm output floor is the contact policy, not a guarantee that invalid or empty collider geometry was admitted; callback failures are not converted into guessed boxes.
   */
  export type IBounds = (bone: AutoMovieHumanoidBone) => {
      /** Lower corner of the union of this segment's collider bounds after neutral placement, in model-rest metres, not bone-local coordinates. */
      min: IAutoMovieVector3;

      /** Upper corner in the same frame; max-minus-min gives the three breadths. Empty shape lists in the standard reader leave negative-infinite maxima. */
      max: IAutoMovieVector3;
    };
}
