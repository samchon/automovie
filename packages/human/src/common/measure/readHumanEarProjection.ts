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
 * the outermost crossing of triangles touching the named ear area is the ear
 * point at that height; their other corners may lie outside that vertex area.
 * The outermost crossing of non-ear triangles behind the
 * ear point stands in for the mastoid surface (a stated convention: the skin
 * behind the ear at the same height, not the palpated process). The reading
 * is the lateral (X) distance between them. A height that cuts no ear or no
 * scalp behind it refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation At the selected height, ear-touching and non-ear triangle crossings are searched on the source ear's side; outermost ear and posterior scalp X positions define protrusion. Scalp stands in for the mastoid surface, and absent cross-sections refuse.
 * @evidence contracts/common.md#clear-and-simple-design Shared ear/plane instruments own region admission and crossings; this reader owns side selection, posterior scalp constraint and lateral separation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No palpated bone coordinate or study-average protrusion is fabricated; the scalp surrogate is an explicit approximation and no missing crossing receives a fallback.
 * @evidence contracts/common.md#meaningful-documentation The comment states height-specific horizontal sections, mastoid-skin approximation, lateral metre distance and missing ear/scalp failure.
 * @evidence contracts/performance.md#efficient-algorithms For T triangles, R ear memberships and C crossings, two plane walks plus ear admission and filtering use O(T+R+C) work and input-sized temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted ear Set is reused by both complementary keep predicates, and each resulting population supplies one maximum reduction; no head/height result cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Ear/crossing/filter arrays and Sets are local, and only two markers plus the distance transfer; source skin buffers and callback effects stay caller-owned.
 */
export function readHumanEarProjection(
  head: IAutoMovieHumanHeadSkin,
  region: string,
  height: number,
): IAutoMovieHumanHeadReading {
  const ear: ReturnType<typeof humanHeadEar> = humanHeadEar(head, region);
  const area: NonNullable<IAutoMovieHumanHeadSkin["skinRegions"]>[string] =
    head.skinRegions![region];
  const sign: number = Math.sign(
    area.vertices.reduce(
      (sum: number, v: number): number => sum + head.positions[v * 3],
      0,
    ),
  );
  const lateral: (point: IAutoMovieVector3) => number = (
    point: IAutoMovieVector3,
  ): number => sign * point.x;
  const outermost: (
    points: IAutoMovieVector3[],
  ) => IAutoMovieVector3 | undefined = (
    points: IAutoMovieVector3[],
  ): IAutoMovieVector3 | undefined =>
    points.reduce<IAutoMovieVector3 | undefined>(
      (
        a: IAutoMovieVector3 | undefined,
        b: IAutoMovieVector3,
      ): IAutoMovieVector3 | undefined =>
        a === undefined || lateral(b) > lateral(a) ? b : a,
      undefined,
    );
  const earPoint: IAutoMovieVector3 | undefined = outermost(
    humanHeadPlanePoints(head, 1, height, (t: number): boolean =>
      ear.triangles.has(t),
    ).filter(
      (point: IAutoMovieVector3): boolean => Math.sign(point.x) === sign,
    ),
  );
  if (earPoint === undefined)
    throw new Error(
      `The head view of ${head.id} cuts no ${region} at ${(height * 1000).toFixed(1)} mm.`,
    );
  const scalp: IAutoMovieVector3 | undefined = outermost(
    humanHeadPlanePoints(
      head,
      1,
      height,
      (t: number): boolean => !ear.triangles.has(t),
    ).filter(
      (point: IAutoMovieVector3): boolean =>
        Math.sign(point.x) === sign && point.z < earPoint.z,
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
