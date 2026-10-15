import type { IHousePart } from "../types/IHousePart";
import { GARAGE_OUTLINE } from "./GARAGE_OUTLINE";
import { GARAGE_OWNER } from "./GARAGE_OWNER";
import { PALETTE } from "./PALETTE";
import { part } from "./part";
import { rect } from "./rect";
import { slab } from "./slab";
import { STOREYS } from "./STOREYS";
import { CEILING_RESERVATION } from "./CEILING_RESERVATION";
import { CEILING_FINISH } from "./CEILING_FINISH";

/** Emit the garage ceiling base above the garage finished ceiling. */

export const buildGarageCeiling = (): IHousePart[] => [
  part(
    "garage-ceiling-base",
    GARAGE_OWNER,
    "ceiling",
    PALETTE.ceiling,
    slab({
      outline: rect(GARAGE_OUTLINE.inner.x, GARAGE_OUTLINE.inner.z),
      bottom: STOREYS.garageCeiling + CEILING_FINISH,
      top: STOREYS.garageCeiling + CEILING_RESERVATION,
    })
  ),
];
