import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyFootSupport } from "../structures/IAutoMovieHumanBodyFootSupport";
import { humanBodyDominantVertices } from "./humanBodyDominantVertices";

/**
 * Read each foot region's lowest posed skin point against a horizontal ground plane, in metres.
 *
 * The default plane passes through shaped joint-ground; explicit placement supplies its fixed source-neutral height instead. Current posed vertices dominantly attached to each side's foot/toes select the lowest point, and the signed gap is that point's Y minus plane height. A side with no region is omitted; no supplied plane or ground landmark returns null. Matching admitted source-order surfaces are a caller premise.
 *
 * Nonfinite plane height refuses whether explicit or landmark-derived. A lowest rig-weight skin vertex is a geometric support witness, without force, pressure, friction, balance, tissue-contact or continuous foot-volume certification. Caller arrays remain unchanged and returned point records are new.
 *
 * @evidence contracts/common.md#principled-implementation Explicit fixed ground height takes precedence over joint-ground; current dominant foot/toes skin vertices supply each side's minimum Y and signed metre separation.
 * @evidence contracts/common.md#clear-and-simple-design Shared dominant-region selection feeds one horizontal support instrument, independent of rigid placement and clinical joint solving.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing plane returns null, missing sides remain omitted and nonfinite planes refuse; attachment minima cannot establish force, balance or biological tissue contact.
 * @evidence contracts/common.md#meaningful-documentation The prose gives plane precedence, signed gap, source-order premise, side omission, new point ownership and geometric limits.
 * @evidence contracts/performance.md#efficient-algorithms Each side scans actual surface skin rows through the shared dominant selector and then its selected vertices, taking linear population work with no iterative placement solve.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing foot/toes attachment identities serve both support and placement readers while changed posed coordinates receive fresh extrema.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local ordinal lists expire and at most two new point/gap records escape, retaining no skin arrays, simulation state or external task.
 *
 * @author Samchon
 */
export function measureHumanBodyGroundSupport(
  basis: IAutoMovieHumanBodyBasis,
  posedSurfaces: readonly (readonly number[])[],
  landmarks: Readonly<Record<string, IAutoMovieVector3>>,
  groundPlaneHeightMetres?: number,
): IAutoMovieHumanBodyFootSupport[] | null {
  const ground: IAutoMovieVector3 | undefined = landmarks["joint-ground"];
  if (
    groundPlaneHeightMetres !== undefined &&
    !Number.isFinite(groundPlaneHeightMetres)
  )
    throw new Error("Body ground reading needs a finite fixed plane height.");
  if (ground === undefined && groundPlaneHeightMetres === undefined)
    return null;
  const floor: number = groundPlaneHeightMetres ?? ground!.y;
  if (!Number.isFinite(floor))
    throw new Error(
      "Body ground reading needs a finite fixed or landmark plane height.",
    );
  return (["left", "right"] as const).flatMap(
    (side: "left" | "right"): IAutoMovieHumanBodyFootSupport[] => {
      let lowest: IAutoMovieVector3 | undefined;
      for (const [index, surface] of basis.surfaces.entries()) {
        const positions: readonly number[] | undefined = posedSurfaces[index];
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
