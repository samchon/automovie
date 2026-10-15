/**
 * `roof.right.back`: the back face of the main building's lower right roof.
 *
 * Region
 * X = [1.60, RIGHT_EAVE_X], Z = [back eave −11.10, ridge −5.35] under
 * Rback(Z) = 5.95 + (7/12)(Z + 10.70), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../PALETTE";
import { slopedSlab } from "../slopedSlab";
import { rect } from "../rect";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { roofFreeEdge } from "./roofFreeEdge";
import { RIGHT_EAVE_X } from "./RIGHT_EAVE_X";
import { RIGHT_BACK_EAVE_Z } from "./RIGHT_BACK_EAVE_Z";
import { rBack } from "./rBack";
import { MAIN_RIDGE_Z } from "./MAIN_RIDGE_Z";
import { SPLIT_X } from "./SPLIT_X";
import { ROOF_THICKNESS } from "./ROOF_THICKNESS";

/**
 * Emit the right low roof back face.
 */
export const buildRightBackRoof = (): IHousePart[] => [
  part(
    "roof-right-back",
    "roof/right-back.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect([SPLIT_X, RIGHT_EAVE_X], [RIGHT_BACK_EAVE_Z, MAIN_RIDGE_Z]),
      top: (_x, z) => rBack(z),
      thickness: ROOF_THICKNESS,
      freeEdge: roofFreeEdge,
    }),
  ),
];
