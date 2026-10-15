/**
 * `roof.front-gable.left`: the west face of the front gable.
 *
 *
 * The exposed face is the triangle from the left valley foot on the front
 * eave, up the left valley to the apex where both valleys meet the gable
 * ridge, and back along the ridge X = -3.775 to the eave; its height is
 * F(X) = 6.30 + (9/12)(X − a), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { slopedSlab } from "../slopedSlab";
import { roofFreeEdge } from "./roofFreeEdge";
import { GABLE_CORNERS } from "./GABLE_CORNERS";
import { gableHeight } from "./gableHeight";
import { ROOF_THICKNESS } from "./ROOF_THICKNESS";

/**
 * Emit the gable's west face.
 */
export const buildFrontGableLeftRoof = (): IHousePart[] => {
  const { leftFoot, apex, ridgeFront } = GABLE_CORNERS;
  return [
    part(
      "roof-front-gable-left",
      "roof/front-gable-left.ts",
      "roof",
      PALETTE.roof,
      slopedSlab({
        plan: [leftFoot, apex, ridgeFront],
        top: (x) => gableHeight(x),
        thickness: ROOF_THICKNESS,
        freeEdge: roofFreeEdge,
      }),
    ),
  ];
};
