/**
 * `roof.right.front`: the front face of the main building's lower right roof.
 *
 * Region
 * X = [1.60, RIGHT_EAVE_X], Z = [ridge −5.35, front eave 0.40] under
 * Rfront(Z) = 5.95 − (7/12) Z, underside 0.24 m lower (roof/00). No overhang is
 * added at the split plane; the step wall closes it (envelope/right).
 */
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { slopedSlab } from "../slopedSlab";
import { rect } from "../rect";
import { roofFreeEdge } from "./roofFreeEdge";
import { RIGHT_EAVE_X } from "./RIGHT_EAVE_X";
import { RIGHT_FRONT_EAVE_Z } from "./RIGHT_FRONT_EAVE_Z";
import { rFront } from "./rFront";
import { MAIN_RIDGE_Z } from "./MAIN_RIDGE_Z";
import { SPLIT_X } from "./SPLIT_X";
import { ROOF_THICKNESS } from "./ROOF_THICKNESS";

/**
 * Emit the right low roof front face.
 */
export const buildRightFrontRoof = (): IHousePart[] => [
  part(
    "roof-right-front",
    "roof/right-front.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect([SPLIT_X, RIGHT_EAVE_X], [MAIN_RIDGE_Z, RIGHT_FRONT_EAVE_Z]),
      top: (_x, z) => rFront(z),
      thickness: ROOF_THICKNESS,
      freeEdge: roofFreeEdge,
    }),
  ),
];
