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
 * @evidenceReview spaces/roof/main-back.md #83924ab `buildMainBackRoof` returns `roof-main-back`, the high roof's rear plane bounded on the right by `SPLIT_X` before the lower roof begins.
 * @evidence spaces/roof/main-back.md#main-back-roof The rectangle runs from LEFT_EAVE_X to SPLIT_X and BACK_EAVE_Z to MAIN_RIDGE_Z, with mBack setting its rising rear profile.
 * @evidenceReview spaces/roof/main-back.md#main-back-roof #a43fc34 The `rect` plan spans `LEFT_EAVE_X` to `SPLIT_X` and `BACK_EAVE_Z` to `MAIN_RIDGE_Z`; `mBack(z)` gives the rear face its upward rise toward that ridge.
 * @evidence principles/core/source-units.md#source-scope-preservation The function takes the split and eave positions from junctions and leaves the lower right roof to its own source owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Every plan bound comes from `junctions.ts`, and the east edge stops at `SPLIT_X`; `buildRightBackRoof` owns the lower continuation without this builder duplicating it.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab constructs the rear pitched mesh with the shared roof thickness and a stable roof-main-back part id.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `slopedSlab` forms the rear plan under `mBack` with `ROOF_THICKNESS` and `roofFreeEdge`; `part` gives the resulting solid id `roof-main-back`.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-back-roof spans LEFT_EAVE_X to SPLIT_X and BACK_EAVE_Z to MAIN_RIDGE_Z with the 8/12 profile and ROOF_THICKNESS underside.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `main-back-roof` assigns ridge, rear free eave and right step, while `roof-profile-datums` supplies `mBack`, 8/12 slope and 0.24 m underside; this rectangle needs no extra parent roof plane.
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
