/**
 * `roof.main.back`: the main roof's back face.
 *
 * Design owner: `docs/spaces/roof/main-back.md#main-back-roof`. Region
 * X = [LEFT_EAVE_X, 1.60], Z = [back eave −11.10, ridge −5.35] under
 * Mback(Z) = 6.30 + (8/12)(Z + 10.70), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { BACK_EAVE_Z, LEFT_EAVE_X, MAIN_RIDGE_Z, ROOF_THICKNESS, SPLIT_X, mBack } from "./junctions";

/**
 * Emit the main back face.
 * @evidence spaces/roof/main-back.md This export builds the rear main-roof surface west of the right-roof step.
 * @evidence spaces/roof/main-back.md#main-back-roof The rectangle runs from LEFT_EAVE_X to SPLIT_X and BACK_EAVE_Z to MAIN_RIDGE_Z, with mBack setting its rising rear profile.
 * @evidence principles/core/source-units.md#source-scope-preservation The function takes the split and eave positions from junctions and leaves the lower right roof to its own source owner.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab constructs the rear pitched mesh with the shared roof thickness and a stable roof-main-back part id.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The main-back parent states the ridge, split, rear eave, pitch, and underside depth; its bounds produced this rectangular plane directly.
 */
export const buildMainBackRoof = (): IHousePart[] => [
  part("roof-main-back", "roof/main-back.ts", "roof", PALETTE.roof, slopedSlab({ plan: rect([LEFT_EAVE_X, SPLIT_X], [BACK_EAVE_Z, MAIN_RIDGE_Z]), top: (_x, z) => mBack(z), thickness: ROOF_THICKNESS, freeEdge: (a, b) => (a.x === LEFT_EAVE_X && b.x === LEFT_EAVE_X) || (a.z === BACK_EAVE_Z && b.z === BACK_EAVE_Z) })),
];
