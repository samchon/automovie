/**
 * `roof.front-gable.right`: the east face of the front gable, toward the stair
 * window.
 *
 *
 * The exposed face is the triangle from the apex down the right valley to its
 * foot on the front eave and back along the ridge X = -3.775; height
 * F(X) = 6.30 + (9/12)(b − X), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { slopedSlab } from "../solids";
import { roofFreeEdge } from "./edges";
import { gable, GABLE_CORNERS, ROOF_THICKNESS } from "./junctions";

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
        top: (x) => gable(x),
        thickness: ROOF_THICKNESS,
        freeEdge: roofFreeEdge,
      }),
    ),
  ];
};
