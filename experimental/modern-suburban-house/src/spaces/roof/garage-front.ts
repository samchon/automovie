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
import { part, rect, slopedSlab, type IHousePart } from "../solids";
import { GARAGE_RIDGE_Z, gFront, OVERHANG, ROOF_THICKNESS } from "./junctions";

/**
 * Emit the garage front face.
 * @evidence spaces/roof/garage-front.md This export builds the driveway-facing half of the low garage roof.
 * @evidence spaces/roof/garage-front.md#garage-front-roof Its rectangle starts at the shared wall and GARAGE_RIDGE_Z, reaches the garage front overhang, and follows gFront toward the eave.
 * @evidence principles/core/source-units.md#source-scope-preservation The west edge uses GARAGE.inner.x[0] with no added overhang; the function leaves the rear slope to its separate owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The front rectangle becomes a slopedSlab of ROOF_THICKNESS and a named roof-garage-front mesh part.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garage-front parent fixes the shared-wall contact, ridge, pitch, and eave; construction did not require a new garage interface.
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
    }),
  ),
];
