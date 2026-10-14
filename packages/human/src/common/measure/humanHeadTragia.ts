import type { IAutoMovieHumanHeadPair } from "./IAutoMovieHumanHeadPair";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadPoint } from "./humanHeadPoint";

/**
 * The head view's `tragion-right` and `tragion-left` skin points as a pair;
 * a missing name refuses by name (`humanHeadPoint`).
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation The two canonical named tragion landmarks are read from the same rest head view, with surface/name admission delegated to humanHeadPoint.
 * @evidence contracts/common.md#clear-and-simple-design A bilateral adapter keeps right/left role mapping in one place while the common point reader owns actual coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Role names are supported source registration, not expected vertex indices; either missing point refuses rather than mirroring its opposite side.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies tragion-right/tragion-left and named refusal through the shared point reader.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed point lookups and one pair record use constant expected work apart from key processing and fixed output storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The common rest-point reader is reused for both sides; a pair is not cached across a changed head coordinate view.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two new vectors and their pair transfer to the caller, while source arrays remain borrowed and no handle/task state survives.
 */
export function humanHeadTragia(
  head: IAutoMovieHumanHeadSkin,
): IAutoMovieHumanHeadPair {
  return {
    right: humanHeadPoint(head, "tragion-right"),
    left: humanHeadPoint(head, "tragion-left"),
  };
}
