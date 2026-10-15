import type { IHousePart } from "../../types/IHousePart";
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import { rect } from "../rect";
import { slab } from "../slab";
import { STOREYS } from "../STOREYS";
import { CEILING_RESERVATION } from "../CEILING_RESERVATION";
import { CEILING_FINISH } from "../CEILING_FINISH";
import { UPPER_FLOOR_OWNER } from "./UPPER_FLOOR_OWNER";

/** Emit the 0.165 m upper ceiling base over the whole main inner plan, stair hall included, above the room finishes. */

export const buildUpperCeiling = (): IHousePart[] => {
  const bottom = STOREYS.upperCeiling + CEILING_FINISH;
  return [
    part(
      "upper-ceiling-base",
      UPPER_FLOOR_OWNER,
      "ceiling",
      PALETTE.ceiling,
      slab({
        outline: rect(MAIN_OUTLINE.inner.x, MAIN_OUTLINE.inner.z),
        bottom,
        top: STOREYS.upperCeiling + CEILING_RESERVATION,
      })
    ),
  ];
};
