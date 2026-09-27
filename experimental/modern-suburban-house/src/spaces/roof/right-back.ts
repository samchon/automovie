/**
 * `roof.right.back`: the back face of the main building's lower right roof.
 *
 * Design owner: `docs/spaces/roof/right-back.md#right-back-roof`. Region
 * X = [1.60, RIGHT_EAVE_X], Z = [back eave −11.10, ridge −5.35] under
 * Rback(Z) = 5.95 + (7/12)(Z + 10.70), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { rect, slopedSlab } from "../solids";
import { part, type IHousePart } from "../solid-records";
import { roofFreeEdge } from "./edges";
import {
  MAIN_RIDGE_Z,
  rBack,
  RIGHT_BACK_EAVE_Z,
  RIGHT_EAVE_X,
  ROOF_THICKNESS,
  SPLIT_X,
} from "./junctions";

/**
 * Emit the right low roof back face.
 * @evidence spaces/roof/right-back.md This export builds the rear slope of the lower right roof.
 * @evidenceReview spaces/roof/right-back.md `buildRightBackRoof` emits the single `roof-right-back` slab for the rear half of the lower right mass, ending at its shared low ridge.
 * @evidence spaces/roof/right-back.md#right-back-roof SPLIT_X and RIGHT_EAVE_X close its east-west width while RIGHT_BACK_EAVE_Z and MAIN_RIDGE_Z bound the rear rBack slope.
 * @evidenceReview spaces/roof/right-back.md#right-back-roof The `rect` plan spans `SPLIT_X` to `RIGHT_EAVE_X` and `RIGHT_BACK_EAVE_Z` to `MAIN_RIDGE_Z`; `rBack(z)` sets the rising rear weather face.
 * @evidence principles/core/source-units.md#source-scope-preservation The part stops at the step plane and uses its own rear eave and the main ridge, leaving the wall step and front slope to other owners.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation This builder's left edge remains at `SPLIT_X` and its Z bounds are rear eave to ridge; the right envelope and `buildRightFrontRoof` retain the step wall and front face.
 * @evidence principles/core/source-units.md#source-substantive-completion rect and slopedSlab emit a pitched roof-right-back mesh with the shared 0.24 m depth.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion `slopedSlab` takes the rear rectangle, `rBack` top, 0.24 m `ROOF_THICKNESS` and `roofFreeEdge` to form the stable `roof-right-back` part.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Right-back-roof consumes the lower roof's own 0.40 m rear free reach from roof-profile-datums; its 7/12 slope runs from RIGHT_BACK_EAVE_Z to MAIN_RIDGE_Z.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `roof-profile-datums` assigns the lower right roof its own 7/12 slope and 0.40 m rear reach; `RIGHT_BACK_EAVE_Z` uses `OVERHANG.right`, and this builder consumes that edge without changing the parent roof profile.
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
