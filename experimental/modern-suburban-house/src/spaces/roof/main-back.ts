/**
 * `roof.main.back`: the main roof's back face.
 *
 * Design owner: `docs/spaces/roof/main-back.md#main-back-roof`. Region
 * X = [LEFT_EAVE_X, 1.60], Z = [back eave −11.10, ridge −5.35] under
 * Mback(Z) = 6.30 + (8/12)(Z + 10.70), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { part, type IHousePart } from "../solid-records";
import { rect, slopedSlab } from "../solids";
import { roofFreeEdge } from "./edges";
import {
  BACK_EAVE_Z,
  LEFT_EAVE_X,
  MAIN_RIDGE_Z,
  mBack,
  ROOF_THICKNESS,
  SPLIT_X,
} from "./junctions";

/**
 * Emit the main back face.
 * @evidence spaces/roof/main-back.md This export builds the rear main-roof surface west of the right-roof step.
 * @evidenceReview spaces/roof/main-back.md #83924ab buildMainBackRoof main-back.ts:28-41 rect [LEFT_EAVE_X, SPLIT_X]; main-back.md:25 rear main face whose right boundary is the step to the low roof.
 * @evidence spaces/roof/main-back.md#main-back-roof The rectangle runs from LEFT_EAVE_X to SPLIT_X and BACK_EAVE_Z to MAIN_RIDGE_Z, with mBack setting its rising rear profile.
 * @evidenceReview spaces/roof/main-back.md#main-back-roof #7b226db plan rect([LEFT_EAVE_X, SPLIT_X],[BACK_EAVE_Z, MAIN_RIDGE_Z]) main-back.ts:35, top mBack :36; main-back-roof :25.
 * @evidence principles/core/source-units.md#source-scope-preservation The function takes the split and eave positions from junctions and leaves the lower right roof to its own source owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 All bounds imported from junctions :11-18; X ends at SPLIT_X; the right low roof is right-back.ts.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab constructs the rear pitched mesh with the shared roof thickness and a stable roof-main-back part id.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f slopedSlab with thickness ROOF_THICKNESS main-back.ts:34-39, id roof-main-back :30.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-back-roof spans LEFT_EAVE_X to SPLIT_X and BACK_EAVE_Z to MAIN_RIDGE_Z with the 8/12 profile and ROOF_THICKNESS underside.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: main-back.ts:35-37. B: main-back-roof :25 back half of the main area using Mback (8/12 via linked roof-profile-datums :53,:62), front=main ridge, back=rear free eave, left=side rake, right=step; underside per :64.
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
