/**
 * `roof.front-gable.right`: the east face of the front gable, toward the stair
 * window.
 *
 *
 * The exposed face is the triangle from the apex down the right valley to its
 * foot on the front eave and back along the ridge X = -3.775; height
 * F(X) = 6.30 + (9/12)(b − X), underside 0.24 m lower (roof/00).
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
 * Emit the gable's east face.
 */
export const buildFrontGableRightRoof = (): IHousePart[] => {
  const { rightFoot, apex, ridgeFront } = GABLE_CORNERS;
  return [
    part(
      "roof-front-gable-right",
      "roof/front-gable-right.ts",
      "roof",
      PALETTE.roof,
      slopedSlab({
        plan: [apex, rightFoot, ridgeFront],
        top: (x) => gableHeight(x),
        thickness: ROOF_THICKNESS,
        freeEdge: roofFreeEdge,
      }),
    ),
  ];
};
