import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadEar } from "./humanHeadEar";
import { humanHeadPlanePoints } from "./humanHeadPlanePoints";

/**
 * Read an auricle's protrusion from the head at one height, in metres. ANSUR
 * II 6.4.33 (Hotzman et al. 2011, p. 109) measures ear protrusion as "the
 * horizontal distance between the mastoid process and the outside edge of the
 * right ear at its most lateral point (ear point)".
 *
 * The head view is cut by the horizontal plane at `height`. On the ear's side
 * the outermost crossing within the named ear area is the ear point at that
 * height; the outermost crossing of the skin outside the area and behind the
 * ear point stands in for the mastoid surface (a stated convention: the skin
 * behind the ear at the same height, not the palpated process). The reading
 * is the lateral (X) distance between them. A height that cuts no ear or no
 * scalp behind it refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation The ear point and the scalp reference are found on each skin at the given height.
 * @evidence contracts/common.md#clear-and-simple-design One section and two maxima.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A section without an ear or a scalp reference refuses; the reference is a documented convention.
 * @evidence contracts/common.md#meaningful-documentation States the protocol sentence, the section, the reference convention and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Horizontal is the XZ plane of the head frame; the distance is along X, metres.
 * @evidence contracts/anatomy.md#anatomical-source Follows ANSUR II 6.4.33 and names the scalp reference as a convention.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanEarProjection(
  head: IAutoMovieHumanHeadSkin,
  region: string,
  height: number,
): IAutoMovieHumanHeadReading {
  const ear = humanHeadEar(head, region);
  const area = head.skinRegions![region];
  const sign = Math.sign(area.vertices.reduce((sum, v) => sum + head.positions[v * 3], 0));
  const lateral = (point: IAutoMovieVector3): number => sign * point.x;
  const outermost = (points: IAutoMovieVector3[]): IAutoMovieVector3 | undefined =>
    points.reduce<IAutoMovieVector3 | undefined>((a, b) => (a === undefined || lateral(b) > lateral(a) ? b : a), undefined);
  const earPoint = outermost(humanHeadPlanePoints(head, 1, height, (t) => ear.triangles.has(t)).filter((point) => Math.sign(point.x) === sign));
  if (earPoint === undefined) throw new Error(`The head view of ${head.id} cuts no ${region} at ${(height * 1000).toFixed(1)} mm.`);
  const scalp = outermost(
    humanHeadPlanePoints(head, 1, height, (t) => !ear.triangles.has(t)).filter((point) => Math.sign(point.x) === sign && point.z < earPoint.z),
  );
  if (scalp === undefined) throw new Error(`The head view of ${head.id} has no scalp behind ${region} at ${(height * 1000).toFixed(1)} mm.`);
  return { metres: lateral(earPoint) - lateral(scalp), points: { "ear-point": earPoint, "scalp-reference": scalp } };
}
