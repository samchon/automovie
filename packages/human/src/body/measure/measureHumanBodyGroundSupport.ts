import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyFootSupport } from "../structures/IAutoMovieHumanBodyFootSupport";
import { humanBodyDominantVertices } from "./humanBodyDominantVertices";

/**
 * Read each foot's lowest posed skin point against the ground plane, or null
 * when neither a ground landmark nor an explicit plane is supplied.
 *
 * By default the plane is horizontal through the shaped `joint-ground` landmark, the
 * source rig's ground cube. A foot is the skin dominantly weighted to its foot
 * and toes bones (`humanBodyDominantVertices`); its lowest point is searched
 * on the posed skin the caller supplies, so a raised heel or a curled toe
 * moves it. The gap is that point's height above the plane. This is the
 * geometric support the rig promises (feet on the ground function), not a
 * pressure, friction or tissue-contact model. A side with no foot region is
 * left out.
 *
 * An explicitly placed build supplies its fixed ground-plane height instead;
 * that plane is owned by the placement and does not move with shaped rig
 * landmarks. A supplied nonfinite plane refuses as an invalid instrument input.
 *
 * @evidence contracts/common.md#principled-implementation The lowest point is searched on final posed skin against the explicitly supplied fixed plane or the default shaped source ground.
 * @evidence contracts/common.md#clear-and-simple-design One region pass per foot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing landmark and absent explicit plane answer null instead of an assumed floor; an explicit nonfinite plane refuses.
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
  groundPlaneHeightMetres?: number,
): IAutoMovieHumanBodyFootSupport[] | null {
  const ground = landmarks["joint-ground"];
  if (
    groundPlaneHeightMetres !== undefined &&
    !Number.isFinite(groundPlaneHeightMetres)
  )
    throw new Error("Body ground reading needs a finite fixed plane height.");
  if (ground === undefined && groundPlaneHeightMetres === undefined)
    return null;
  const floor = groundPlaneHeightMetres ?? ground!.y;
  return (["left", "right"] as const).flatMap(
    (side): IAutoMovieHumanBodyFootSupport[] => {
      let lowest: IAutoMovieVector3 | undefined;
      for (const [index, surface] of basis.surfaces.entries()) {
        const positions = posedSurfaces[index];
        if (positions === undefined) continue;
        for (const vertex of humanBodyDominantVertices(surface, [
          `${side}Foot`,
          `${side}Toes`,
        ]))
          if (lowest === undefined || positions[vertex * 3 + 1] < lowest.y)
            lowest = {
              x: positions[vertex * 3],
              y: positions[vertex * 3 + 1],
              z: positions[vertex * 3 + 2],
            };
      }
      return lowest === undefined
        ? []
        : [{ side, lowest, gapMetres: lowest.y - floor }];
    },
  );
}
