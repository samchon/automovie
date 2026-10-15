/**
 * `roof.main.back`: the main roof's back face.
 *
 * Region
 * X = [LEFT_EAVE_X, 1.60], Z = [back eave −11.10, ridge −5.35] under
 * Mback(Z) = 6.30 + (8/12)(Z + 10.70), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { slopedSlab } from "../slopedSlab";
import { rect } from "../rect";
import { roofFreeEdge } from "./roofFreeEdge";
import { LEFT_EAVE_X } from "./LEFT_EAVE_X";
import { BACK_EAVE_Z } from "./BACK_EAVE_Z";
import { mBack } from "./mBack";
import { MAIN_RIDGE_Z } from "./MAIN_RIDGE_Z";
import { SPLIT_X } from "./SPLIT_X";
import { ROOF_THICKNESS } from "./ROOF_THICKNESS";

/**
 * Emit the main back face.
 */
export const buildMainBackRoof = (): IHousePart[] => [
  part(
    "roof-main-back",
    "roof/main-back.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect([LEFT_EAVE_X, SPLIT_X], [BACK_EAVE_Z, MAIN_RIDGE_Z]),
      top: (_x, z) => mBack(z),
      thickness: ROOF_THICKNESS,
      freeEdge: roofFreeEdge,
    }),
  ),
];
