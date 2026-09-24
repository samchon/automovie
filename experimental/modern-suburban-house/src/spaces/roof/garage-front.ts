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
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { GARAGE_RIDGE_Z, OVERHANG, ROOF_THICKNESS, gFront } from "./junctions";

/** Emit the garage front face. */
export const buildGarageFrontRoof = (): IHousePart[] => [
  part(
    "roof-garage-front",
    "roof/garage-front.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect([GARAGE.inner.x[0], GARAGE.outer.x[1] + OVERHANG.garage], [GARAGE_RIDGE_Z, GARAGE.outer.z[1] + OVERHANG.garage]),
      top: (_x, z) => gFront(z),
      thickness: ROOF_THICKNESS,
    }),
  ),
];
