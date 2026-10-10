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
 */
export function readHumanEarProjection(
  head: IAutoMovieHumanHeadSkin,
  region: string,
  height: number,
): IAutoMovieHumanHeadReading {
  const ear = humanHeadEar(head, region);
  const area = head.skinRegions![region];
  const sign = Math.sign(
    area.vertices.reduce((sum, v) => sum + head.positions[v * 3], 0),
  );
  const lateral = (point: IAutoMovieVector3): number => sign * point.x;
  const outermost = (
    points: IAutoMovieVector3[],
  ): IAutoMovieVector3 | undefined =>
    points.reduce<IAutoMovieVector3 | undefined>(
      (a, b) => (a === undefined || lateral(b) > lateral(a) ? b : a),
      undefined,
    );
  const earPoint = outermost(
    humanHeadPlanePoints(head, 1, height, (t) => ear.triangles.has(t)).filter(
      (point) => Math.sign(point.x) === sign,
    ),
  );
  if (earPoint === undefined)
    throw new Error(
      `The head view of ${head.id} cuts no ${region} at ${(height * 1000).toFixed(1)} mm.`,
    );
  const scalp = outermost(
    humanHeadPlanePoints(head, 1, height, (t) => !ear.triangles.has(t)).filter(
      (point) => Math.sign(point.x) === sign && point.z < earPoint.z,
    ),
  );
  if (scalp === undefined)
    throw new Error(
      `The head view of ${head.id} has no scalp behind ${region} at ${(height * 1000).toFixed(1)} mm.`,
    );
  return {
    metres: lateral(earPoint) - lateral(scalp),
    points: { "ear-point": earPoint, "scalp-reference": scalp },
  };
}
