/**
 * `roof.right.front`: the front face of the main building's lower right roof.
 *
 * Design owner: `docs/spaces/roof/right-front.md#right-front-roof`. Region
 * X = [1.60, RIGHT_EAVE_X], Z = [ridge −5.35, front eave 0.40] under
 * Rfront(Z) = 5.95 − (7/12) Z, underside 0.24 m lower (roof/00). No overhang is
 * added at the split plane; the step wall closes it (envelope/right).
 */
import { PALETTE } from "../palette";
import { part, type IHousePart } from "../solid-records";
import { rect, slopedSlab } from "../solids";
import { roofFreeEdge } from "./edges";
import {
  MAIN_RIDGE_Z,
  rFront,
  RIGHT_EAVE_X,
  RIGHT_FRONT_EAVE_Z,
  ROOF_THICKNESS,
  SPLIT_X,
} from "./junctions";

/**
 * Emit the right low roof front face.
 * @evidence spaces/roof/right-front.md This export builds the front slope of the lower right roof.
 * @evidenceReview spaces/roof/right-front.md #91b132f buildRightFrontRoof right-front.ts:29-42; right-front.md:25 front half of the right area.
 * @evidence spaces/roof/right-front.md#right-front-roof Its plan reaches from SPLIT_X to RIGHT_EAVE_X and from MAIN_RIDGE_Z to RIGHT_FRONT_EAVE_Z, with rFront setting the descending weather surface.
 * @evidenceReview spaces/roof/right-front.md#right-front-roof #b4e92ff right-front.md:7 body; plan rect([SPLIT_X, RIGHT_EAVE_X],[MAIN_RIDGE_Z, RIGHT_FRONT_EAVE_Z]).
 * @evidence principles/core/source-units.md#source-scope-preservation It ends at the split plane without an invented overhang there; the step-wall and rear-slope owners retain their separate faces.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 West edge exactly SPLIT_X, no overhang (:36); step wall owned by envelope/right.ts (right-roof-closures), rear slope by right-back.ts.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab turns the bounded front rectangle into roof-right-front with a deterministic mesh and shared underside thickness.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f slopedSlab with ROOF_THICKNESS right-front.ts:35-40, id roof-right-front :31.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Right-front-roof consumes the lower roof's own 0.40 m front free reach from roof-profile-datums; its 7/12 slope runs from MAIN_RIDGE_Z to RIGHT_FRONT_EAVE_Z.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 As 468 for the front slope.
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
