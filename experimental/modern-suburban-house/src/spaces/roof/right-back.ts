/**
 * `roof.right.back`: the back face of the main building's lower right roof.
 *
 * Design owner: `docs/spaces/roof/right-back.md#right-back-roof`. Region
 * X = [1.60, RIGHT_EAVE_X], Z = [back eave −11.10, ridge −5.35] under
 * Rback(Z) = 5.95 + (7/12)(Z + 10.70), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { BACK_EAVE_Z, MAIN_RIDGE_Z, RIGHT_EAVE_X, ROOF_THICKNESS, SPLIT_X, rBack } from "./junctions";

/**
 * Emit the right low roof back face.
 * @evidence spaces/roof/right-back.md This export builds the rear slope of the lower right roof.
 * @evidence spaces/roof/right-back.md#right-back-roof SPLIT_X and RIGHT_EAVE_X close its east-west width while BACK_EAVE_Z and MAIN_RIDGE_Z bound the rear rBack slope.
 * @evidence principles/core/source-units.md#source-scope-preservation The part stops at the step plane and imports the common ridge/eave bounds, leaving the wall step and front slope to other owners.
 * @evidence principles/core/source-units.md#source-substantive-completion rect and slopedSlab emit a pitched roof-right-back mesh with the shared 0.24 m depth.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The right-back parent fixes the step, rear eave, ridge, and pitch; the rectangular solid required no new wall-head location.
 */
export const buildRightBackRoof = (): IHousePart[] => [
  part("roof-right-back", "roof/right-back.ts", "roof", PALETTE.roof, slopedSlab({ plan: rect([SPLIT_X, RIGHT_EAVE_X], [BACK_EAVE_Z, MAIN_RIDGE_Z]), top: (_x, z) => rBack(z), thickness: ROOF_THICKNESS })),
];
