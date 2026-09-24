/**
 * `roof.garage.back`: the back face of the garage's low gable roof.
 *
 * Design owner: `docs/spaces/roof/garage-back.md#garage-back-roof`. Region
 * X = [5.75, 11.70 + 0.35], Z = [back eave −6.70 − 0.35, ridge −3.50] under
 * Gback(Z) = 2.95 + (5/12)(Z + 6.70), underside 0.24 m lower (roof/00).
 */
import { GARAGE } from "../building";
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { GARAGE_RIDGE_Z, OVERHANG, ROOF_THICKNESS, gBack } from "./junctions";

/** Emit the garage back face. */
export const buildGarageBackRoof = (): IHousePart[] => [
  part(
    "roof-garage-back",
    "roof/garage-back.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect([GARAGE.inner.x[0], GARAGE.outer.x[1] + OVERHANG.garage], [GARAGE.outer.z[0] - OVERHANG.garage, GARAGE_RIDGE_Z]),
      top: (_x, z) => gBack(z),
      thickness: ROOF_THICKNESS,
    }),
  ),
];
