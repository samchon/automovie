import type { IAutoMovieVector3 } from "@automovie/interface";

import { humanSkinLandmark } from "../basis/humanSkinLandmark";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * The rest position of a head view skin point named by a rule. A name the
 * head view does not declare, or a point on another surface than the skin
 * the rules read, refuses by name.
 */
export function humanHeadPoint(
  head: IAutoMovieHumanHeadSkin,
  name: string,
): IAutoMovieVector3 {
  const point = humanSkinLandmark(head, name);
  if (point.surface !== head.surface)
    throw new Error(
      `The skin landmark ${name} of ${head.id} is not on the head view skin the rules read.`,
    );
  const v = point.vertex;
  return {
    x: head.positions[v * 3],
    y: head.positions[v * 3 + 1],
    z: head.positions[v * 3 + 2],
  };
}
