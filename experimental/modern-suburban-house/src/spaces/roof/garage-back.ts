/**
 * `roof.garage.back`: the back face of the garage's low gable roof.
 *
 * Design owner: `docs/spaces/roof/garage-back.md#garage-back-roof`. Region
 * X = [5.75, 11.70 + 0.35], Z = [back eave −6.70 − 0.35, ridge −3.50] under
 * Gback(Z) = 2.95 + (5/12)(Z + 6.70), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { GARAGE_RIDGE_Z, GARAGE_ROOF, OVERHANG, ROOF_THICKNESS, gBack } from "./junctions";

/** Emit the garage back face. */
export const buildGarageBackRoof = (): IHousePart[] => [
  part(
    "roof-garage-back",
    "roof/garage-back.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect([GARAGE_ROOF.westFace, GARAGE_ROOF.eastFace + OVERHANG.garage], [GARAGE_ROOF.backFace - OVERHANG.garage, GARAGE_RIDGE_Z]),
      top: (_x, z) => gBack(z),
      thickness: ROOF_THICKNESS,
    }),
  ),
];
