/**
 * `roof.right.front`: the front face of the main building's lower right roof.
 *
 * Design owner: `docs/spaces/roof/right-front.md#right-front-roof`. Region
 * X = [1.60, RIGHT_EAVE_X], Z = [ridge −5.35, front eave 0.40] under
 * Rfront(Z) = 5.95 − (7/12) Z, underside 0.24 m lower (roof/00). No overhang is
 * added at the split plane; the step wall closes it (envelope/right).
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { FRONT_EAVE_Z, MAIN_RIDGE_Z, RIGHT_EAVE_X, ROOF_THICKNESS, SPLIT_X, rFront } from "./junctions";

/** Emit the right low roof front face. */
export const buildRightFrontRoof = (): IHousePart[] => [
  part("roof-right-front", "roof/right-front.ts", "roof", PALETTE.roof, slopedSlab({ plan: rect([SPLIT_X, RIGHT_EAVE_X], [MAIN_RIDGE_Z, FRONT_EAVE_Z]), top: (_x, z) => rFront(z), thickness: ROOF_THICKNESS })),
];
