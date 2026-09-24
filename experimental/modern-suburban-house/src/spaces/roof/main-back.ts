/**
 * `roof.main.back`: the main roof's back face.
 *
 * Design owner: `docs/spaces/roof/main-back.md#main-back-roof`. Region
 * X = [LEFT_EAVE_X, 1.60], Z = [back eave −11.10, ridge −5.35] under
 * Mback(Z) = 6.30 + (8/12)(Z + 10.70), underside 0.24 m lower (roof/00).
 */
import { MAIN_RIDGE_Z } from "../building";
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { BACK_EAVE_Z, LEFT_EAVE_X, ROOF_THICKNESS, SPLIT_X, mBack } from "./junctions";

/** Emit the main back face. */
export const buildMainBackRoof = (): IHousePart[] => [
  part("roof-main-back", "roof/main-back.ts", "roof", PALETTE.roof, slopedSlab({ plan: rect([LEFT_EAVE_X, SPLIT_X], [BACK_EAVE_Z, MAIN_RIDGE_Z]), top: (_x, z) => mBack(z), thickness: ROOF_THICKNESS })),
];
