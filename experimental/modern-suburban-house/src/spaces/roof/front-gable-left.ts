/**
 * `roof.front-gable.left`: the west face of the front gable.
 *
 * Design owner: `docs/spaces/roof/front-gable-left.md#front-gable-left-roof`.
 * The exposed face is the triangle from the left valley foot on the front
 * eave, up the left valley to the apex where both valleys meet the gable
 * ridge, and back along the ridge X = -3.775 to the eave; its height is
 * F(X) = 6.30 + (9/12)(X − a), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, slopedSlab } from "../solids";
import { GABLE_CORNERS, ROOF_THICKNESS, gable } from "./junctions";

/** Emit the gable's west face. */
export const buildFrontGableLeftRoof = (): IHousePart[] => {
  const { leftFoot, apex, ridgeFront } = GABLE_CORNERS;
  return [
    part("roof-front-gable-left", "roof/front-gable-left.ts", "roof", PALETTE.roof, slopedSlab({ plan: [leftFoot, apex, ridgeFront], top: (x) => gable(x), thickness: ROOF_THICKNESS })),
  ];
};
