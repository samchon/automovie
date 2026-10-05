import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyFootSupport } from "../structures/IAutoMovieHumanBodyFootSupport";
import { humanBodyDominantVertices } from "./humanBodyDominantVertices";

/**
 * Read each foot's lowest posed skin point against the ground plane, or null
 * when the basis has no ground landmark.
 *
 * The plane is horizontal through the shaped `joint-ground` landmark, the
 * source rig's ground cube. A foot is the skin dominantly weighted to its foot
 * and toes bones (`humanBodyDominantVertices`); its lowest point is searched
 * on the posed skin the caller supplies, so a raised heel or a curled toe
 * moves it. The gap is that point's height above the plane. This is the
 * geometric support the rig promises (feet on the ground function), not a
 * pressure, friction or tissue-contact model. A side with no foot region is
 * left out.
 *
 * @evidence contracts/common.md#principled-implementation The lowest point is searched on the final posed skin against the source's own ground landmark.
 * @evidence contracts/common.md#clear-and-simple-design One region pass per foot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A basis without a ground landmark answers null instead of an assumed floor height.
 * @evidence contracts/common.md#meaningful-documentation States the plane, the region, the sign and what is not modelled.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The foot region is a rig attachment, not an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits readings, not geometry.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the basis frame; the plane is perpendicular to +Y.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The builder owns the posed skin.
 * @evidence contracts/modeling.md#rendered-observation The body editor's contact check shows each foot's gap beside the posed frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It reads and admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It receives evaluated geometry.
 * @author Samchon
 */
export function measureHumanBodyGroundSupport(
  basis: IAutoMovieHumanBodyBasis,
  posedSurfaces: readonly (readonly number[])[],
  landmarks: Readonly<Record<string, IAutoMovieVector3>>,
): IAutoMovieHumanBodyFootSupport[] | null {
  const ground = landmarks["joint-ground"];
  if (ground === undefined) return null;
  return (["left", "right"] as const).flatMap((side): IAutoMovieHumanBodyFootSupport[] => {
    let lowest: IAutoMovieVector3 | undefined;
    for (const [index, surface] of basis.surfaces.entries()) {
      const positions = posedSurfaces[index];
      if (positions === undefined) continue;
      for (const vertex of humanBodyDominantVertices(surface, [`${side}Foot`, `${side}Toes`]))
        if (lowest === undefined || positions[vertex * 3 + 1] < lowest.y)
          lowest = { x: positions[vertex * 3], y: positions[vertex * 3 + 1], z: positions[vertex * 3 + 2] };
    }
    return lowest === undefined ? [] : [{ side, lowest, gapMetres: lowest.y - ground.y }];
  });
}
