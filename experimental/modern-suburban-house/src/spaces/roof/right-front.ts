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

/**
 * Emit the right low roof front face.
 * @evidence spaces/roof/right-front.md This export builds the front slope of the lower right roof.
 * @evidence spaces/roof/right-front.md#right-front-roof Its plan reaches from SPLIT_X to RIGHT_EAVE_X and from MAIN_RIDGE_Z to FRONT_EAVE_Z, with rFront setting the descending weather surface.
 * @evidence principles/core/source-units.md#source-scope-preservation It ends at the split plane without an invented overhang there; the step-wall and rear-slope owners retain their separate faces.
 * @evidence principles/core/source-units.md#source-substantive-completion slopedSlab turns the bounded front rectangle into roof-right-front with a deterministic mesh and shared underside thickness.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The right-front parent gives the front eave, split, ridge, and lower pitch; those coordinates build the plane without an added edge decision.
 */
export const buildRightFrontRoof = (): IHousePart[] => [
  part("roof-right-front", "roof/right-front.ts", "roof", PALETTE.roof, slopedSlab({ plan: rect([SPLIT_X, RIGHT_EAVE_X], [MAIN_RIDGE_Z, FRONT_EAVE_Z]), top: (_x, z) => rFront(z), thickness: ROOF_THICKNESS })),
];
