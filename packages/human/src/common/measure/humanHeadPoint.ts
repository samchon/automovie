import type { IAutoMovieVector3 } from "@automovie/interface";

import { humanSkinLandmark } from "../basis/humanSkinLandmark";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * The rest position of a head view skin point named by a rule. A name the
 * head view does not declare, or a point on another surface than the skin
 * the rules read, refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation Named landmark lookup must address the same head surface; its registered vertex's rest XYZ supplies the point, relying on upstream binding admission for valid resident indices.
 * @evidence contracts/common.md#clear-and-simple-design humanSkinLandmark owns the source-name lookup and this wrapper binds it to the current head view's rest coordinate array.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest expected point or consumer-specific fallback substitutes a missing/misplaced source landmark.
 * @evidence contracts/common.md#meaningful-documentation The comment describes rest position and named/surface refusal, preserving the distinction between registered identity and clinical accuracy.
 * @evidence contracts/performance.md#efficient-algorithms Dictionary lookup and three coordinate reads use O(1) expected work for a source name plus its key cost, with one vector allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical landmark lookup is reused and coordinates are reread for the current rest view rather than cached by name alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The borrowed registration/positions stay with their caller; a fresh three-scalar vector transfers without a retained mesh, handle or task.
 */
export function humanHeadPoint(
  head: IAutoMovieHumanHeadSkin,
  name: string,
): IAutoMovieVector3 {
  const point: ReturnType<typeof humanSkinLandmark> = humanSkinLandmark(
    head,
    name,
  );
  if (point.surface !== head.surface)
    throw new Error(
      `The skin landmark ${name} of ${head.id} is not on the head view skin the rules read.`,
    );
  const v: number = point.vertex;
  return {
    x: head.positions[v * 3],
    y: head.positions[v * 3 + 1],
    z: head.positions[v * 3 + 2],
  };
}
