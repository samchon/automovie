/**
 * `roof.garage.front`: the front face of the garage's low gable roof.
 *
 * Design owner: `docs/spaces/roof/garage-front.md#garage-front-roof`. Region
 * X = [5.75, 11.70 + 0.35], Z = [ridge −3.50, front eave −0.30 + 0.35] under
 * Gfront(Z) = 2.95 − (5/12)(Z + 0.30), underside 0.24 m lower; the west edge
 * meets the shared wall's outer face X = 5.75 with no overhang (roof/00).
 */
import { GARAGE } from "../building";
import { PALETTE } from "../palette";
import { part, type IHousePart } from "../solid-records";
import { rect, slopedSlab } from "../solids";
import { roofFreeEdge } from "./edges";
import { GARAGE_RIDGE_Z, gFront, OVERHANG, ROOF_THICKNESS } from "./junctions";

/**
 * Emit the garage front face.
 * @evidence spaces/roof/garage-front.md This export builds the driveway-facing half of the low garage roof.
 * @evidenceReview spaces/roof/garage-front.md #0772279 v-141 garage-front.ts:23-39 +Z half; garage-front.md:25 "앞 절반".
 * @evidence spaces/roof/garage-front.md#garage-front-roof Its rectangle starts at the shared wall and GARAGE_RIDGE_Z, reaches the garage front overhang, and follows gFront toward the eave.
 * @evidenceReview spaces/roof/garage-front.md#garage-front-roof #b0f33f8 v-141 garage-front.ts:30-34 rect X [GARAGE.inner.x[0], outer+0.35], Z [GARAGE_RIDGE_Z, GARAGE.outer.z[1]+0.35], top gFront; garage-front.md:25.
 * @evidence principles/core/source-units.md#source-scope-preservation The west edge uses GARAGE.inner.x[0] with no added overhang; the function leaves the rear slope to its separate owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 garage-front.ts:31 X starts GARAGE.inner.x[0] (5.75, shared-wall face) with no OVERHANG; rear slope stays in garage-back.ts.
 * @evidence principles/core/source-units.md#source-substantive-completion The front rectangle becomes a slopedSlab of ROOF_THICKNESS and a named roof-garage-front mesh part.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 garage-front.ts:24-37 slopedSlab thickness ROOF_THICKNESS; part id roof-garage-front.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-roof runs from the main/garage shared-wall line to the garage right eave and from its front 0.35 m overhang to GARAGE_RIDGE_Z, using the 5/12 weather profile.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: rect [GARAGE.inner.x[0], GARAGE.outer.x[1]+OVERHANG.garage] x [GARAGE_RIDGE_Z, GARAGE.outer.z[1]+OVERHANG.garage], gFront garage-front.ts:30-34. B: garage-front-roof :25 left=shared-wall roof junction, front=garage eave, back=low ridge, right=garage gable, Gfront; 0.35 in table 00-junctions.md:60.
 */
export const buildGarageFrontRoof = (): IHousePart[] => [
  part(
    "roof-garage-front",
    "roof/garage-front.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect(
        [GARAGE.inner.x[0], GARAGE.outer.x[1] + OVERHANG.garage],
        [GARAGE_RIDGE_Z, GARAGE.outer.z[1] + OVERHANG.garage],
      ),
      top: (_x, z) => gFront(z),
      thickness: ROOF_THICKNESS,
      freeEdge: roofFreeEdge,
    }),
  ),
];
