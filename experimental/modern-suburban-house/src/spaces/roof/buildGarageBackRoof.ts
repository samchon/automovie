/**
 * `roof.garage.back`: the back face of the garage's low gable roof.
 *
 * Region
 * X = [5.75, 11.70 + 0.35], Z = [back eave −6.70 − 0.35, ridge −3.50] under
 * Gback(Z) = 2.95 + (5/12)(Z + 6.70), underside 0.24 m lower (roof/00).
 */
import { GARAGE_OUTLINE } from "../GARAGE_OUTLINE";
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { slopedSlab } from "../slopedSlab";
import { rect } from "../rect";
import { roofFreeEdge } from "./roofFreeEdge";
import { gBack } from "./gBack";
import { GARAGE_RIDGE_Z } from "./GARAGE_RIDGE_Z";
import { OVERHANG } from "./OVERHANG";
import { ROOF_THICKNESS } from "./ROOF_THICKNESS";

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
        [GARAGE_OUTLINE.inner.x[0], GARAGE_OUTLINE.outer.x[1] + OVERHANG.garage],
        [GARAGE_OUTLINE.outer.z[0] - OVERHANG.garage, GARAGE_RIDGE_Z],
      ),
      top: (_x, z) => gBack(z),
      thickness: ROOF_THICKNESS,
      freeEdge: roofFreeEdge,
    }),
  ),
];
