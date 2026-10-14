/**
 * `roof.garage.back`: the back face of the garage's low gable roof.
 *
 * Region
 * X = [5.75, 11.70 + 0.35], Z = [back eave −6.70 − 0.35, ridge −3.50] under
 * Gback(Z) = 2.95 + (5/12)(Z + 6.70), underside 0.24 m lower (roof/00).
 */
import { GARAGE } from "../building";
import { PALETTE } from "../palette";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { rect, slopedSlab } from "../solids";
import { roofFreeEdge } from "./edges";
import { GARAGE_RIDGE_Z, gBack, OVERHANG, ROOF_THICKNESS } from "./junctions";

/**
 * Emit the garage back face.
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
