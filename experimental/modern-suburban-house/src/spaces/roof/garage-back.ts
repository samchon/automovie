/**
 * `roof.garage.back`: the back face of the garage's low gable roof.
 *
 * Design owner: `docs/spaces/roof/garage-back.md#garage-back-roof`. Region
 * X = [5.75, 11.70 + 0.35], Z = [back eave −6.70 − 0.35, ridge −3.50] under
 * Gback(Z) = 2.95 + (5/12)(Z + 6.70), underside 0.24 m lower (roof/00).
 */
import { GARAGE } from "../building";
import { PALETTE } from "../palette";
import { part, rect, slopedSlab, type IHousePart } from "../solids";
import { GARAGE_RIDGE_Z, gBack, OVERHANG, ROOF_THICKNESS } from "./junctions";

/**
 * Emit the garage back face.
 * @evidence spaces/roof/garage-back.md This export owns the rear half of the low garage roof.
 * @evidence spaces/roof/garage-back.md#garage-back-roof The plan spans the garage shared-wall line to its outer overhang and the back eave to GARAGE_RIDGE_Z; gBack gives the rear pitch.
 * @evidence principles/core/source-units.md#source-scope-preservation GARAGE, OVERHANG, and GARAGE_RIDGE_Z bound only the rear garage plane; the function does not author a second garage footprint.
 * @evidence principles/core/source-units.md#source-substantive-completion rect and slopedSlab construct a pitched solid with ROOF_THICKNESS and a stable roof-garage-back part identity.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garage-back parent gives the shared-wall start, back overhang, ridge, and pitch; those boundaries were sufficient for this rectangular mesh.
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
    }),
  ),
];
