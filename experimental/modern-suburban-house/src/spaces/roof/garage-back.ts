/**
 * `roof.garage.back`: the back face of the garage's low gable roof.
 *
 * Design owner: `docs/spaces/roof/garage-back.md#garage-back-roof`. Region
 * X = [5.75, 11.70 + 0.35], Z = [back eave −6.70 − 0.35, ridge −3.50] under
 * Gback(Z) = 2.95 + (5/12)(Z + 6.70), underside 0.24 m lower (roof/00).
 */
import { GARAGE } from "../building";
import { PALETTE } from "../palette";
import { part, type IHousePart } from "../solid-records";
import { rect, slopedSlab } from "../solids";
import { roofFreeEdge } from "./edges";
import { GARAGE_RIDGE_Z, gBack, OVERHANG, ROOF_THICKNESS } from "./junctions";

/**
 * Emit the garage back face.
 * @evidence spaces/roof/garage-back.md This export owns the rear half of the low garage roof.
 * @evidenceReview spaces/roof/garage-back.md #74b6e24 v-141 garage-back.ts:22-38 roof-garage-back; docs/spaces/roof/garage-back.md:25 rear half of the garage region.
 * @evidence spaces/roof/garage-back.md#garage-back-roof The plan spans the garage shared-wall line to its outer overhang and the back eave to GARAGE_RIDGE_Z; gBack gives the rear pitch.
 * @evidenceReview spaces/roof/garage-back.md#garage-back-roof #b0eec87 v-141 garage-back.ts:29-33 rect X [GARAGE.inner.x[0], GARAGE.outer.x[1]+OVERHANG.garage], Z [GARAGE.outer.z[0]-OVERHANG.garage, GARAGE_RIDGE_Z], top gBack; garage-back.md:25 ridge front, rear free eave, left main-wall junction, Gback.
 * @evidence principles/core/source-units.md#source-scope-preservation GARAGE, OVERHANG, and GARAGE_RIDGE_Z bound only the rear garage plane; the function does not author a second garage footprint.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 garage-back.ts:8-12 only GARAGE/OVERHANG/GARAGE_RIDGE_Z/gBack shape one rect plan; no footprint authored.
 * @evidence principles/core/source-units.md#source-substantive-completion rect and slopedSlab construct a pitched solid with ROOF_THICKNESS and a stable roof-garage-back part identity.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 garage-back.ts:24-36 rect + slopedSlab thickness ROOF_THICKNESS, id roof-garage-back.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-back-roof runs from the main/garage shared-wall line to the garage right eave and from GARAGE_RIDGE_Z to the rear overhang, using the 5/12 profile and 0.24 m underside reservation.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: rect [GARAGE.inner.x[0], GARAGE.outer.x[1]+OVERHANG.garage] x [GARAGE.outer.z[0]-OVERHANG.garage, GARAGE_RIDGE_Z], gBack, ROOF_THICKNESS garage-back.ts:29-35. B: garage-back-roof :25 left=본채 벽 접합, right=박공 사선 모서리, front=garage ridge, back=rear free eave, Gback; 5/12 and 0.24 via linked roof-profile-datums :53,:60,:62.
 */
export const buildGarageBackRoof = (): IHousePart[] => [
  part(
    "roof-garage-back",
    "roof/garage-back.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect(
        [GARAGE.inner.x[0], GARAGE.outer.x[1] + OVERHANG.garage],
        [GARAGE.outer.z[0] - OVERHANG.garage, GARAGE_RIDGE_Z],
      ),
      top: (_x, z) => gBack(z),
      thickness: ROOF_THICKNESS,
      freeEdge: roofFreeEdge,
    }),
  ),
];
