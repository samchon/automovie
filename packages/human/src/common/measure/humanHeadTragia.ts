import type { IAutoMovieHumanHeadPair } from "./IAutoMovieHumanHeadPair";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadPoint } from "./humanHeadPoint";

/**
 * The head view's `tragion-right` and `tragion-left` skin points as a pair;
 * a missing name refuses by name (`humanHeadPoint`).
 *
 * @author Samchon
 */
export function humanHeadTragia(
  head: IAutoMovieHumanHeadSkin,
): IAutoMovieHumanHeadPair {
  return {
    right: humanHeadPoint(head, "tragion-right"),
    left: humanHeadPoint(head, "tragion-left"),
  };
}
