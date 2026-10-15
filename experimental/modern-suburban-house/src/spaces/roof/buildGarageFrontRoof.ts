/**
 * `roof.garage.front`: the front face of the garage's low gable roof.
 *
 * Region
 * X = [5.75, 11.70 + 0.35], Z = [ridge −3.50, front eave −0.30 + 0.35] under
 * Gfront(Z) = 2.95 − (5/12)(Z + 0.30), underside 0.24 m lower; the west edge
 * meets the shared wall's outer face X = 5.75 with no overhang (roof/00).
 */
import { GARAGE_OUTLINE } from "../GARAGE_OUTLINE";
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { slopedSlab } from "../slopedSlab";
import { rect } from "../rect";
import { roofFreeEdge } from "./roofFreeEdge";
import { gFront } from "./gFront";
import { GARAGE_RIDGE_Z } from "./GARAGE_RIDGE_Z";
import { OVERHANG } from "./OVERHANG";
import { ROOF_THICKNESS } from "./ROOF_THICKNESS";

/**
 * Emit the garage front face.
 */
export const buildGarageFrontRoof = (): IHousePart[] => [
  part(
    "roof-garage-front",
    "roof/garage-front.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect(
        [GARAGE_OUTLINE.inner.x[0], GARAGE_OUTLINE.outer.x[1] + OVERHANG.garage],
        [GARAGE_RIDGE_Z, GARAGE_OUTLINE.outer.z[1] + OVERHANG.garage],
      ),
      top: (_x, z) => gFront(z),
      thickness: ROOF_THICKNESS,
      freeEdge: roofFreeEdge,
    }),
  ),
];
