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
 * @evidenceReview spaces/roof/garage-back.md #74b6e24 `buildGarageBackRoof` returns `roof-garage-back`, the garage slab from its common ridge toward the rear wall and free back eave.
 * @evidence spaces/roof/garage-back.md#garage-back-roof The plan spans the garage shared-wall line to its outer overhang and the back eave to GARAGE_RIDGE_Z; gBack gives the rear pitch.
 * @evidenceReview spaces/roof/garage-back.md#garage-back-roof #b0eec87 The `rect` reaches from `GARAGE.inner.x[0]` to the free east edge and from `GARAGE.outer.z[0] - OVERHANG.garage` to `GARAGE_RIDGE_Z`; `gBack(z)` sets the rear slope.
 * @evidence principles/core/source-units.md#source-scope-preservation GARAGE, OVERHANG, and GARAGE_RIDGE_Z bound only the rear garage plane; the function does not author a second garage footprint.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This builder takes its X/Z bounds from `GARAGE` and `GARAGE_RIDGE_Z`, with `OVERHANG.garage` only on free edges; it emits no separate building extent or front slope.
 * @evidence principles/core/source-units.md#source-substantive-completion rect and slopedSlab construct a pitched solid with ROOF_THICKNESS and a stable roof-garage-back part identity.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `slopedSlab` applies `gBack` and `ROOF_THICKNESS` to the rear rectangle, and `part` gives that solid the stable id `roof-garage-back`.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-back-roof runs from the main/garage shared-wall line to the garage right eave and from GARAGE_RIDGE_Z to the rear overhang, using the 5/12 profile and 0.24 m underside reservation.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `garage-back-roof` assigns the rear eave and left shared-wall contact, and `roof-profile-datums` supplies `gBack`, 5/12 slope, 0.35 m reach and 0.24 m underside; this builder adds no missing parent edge.
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
