
import { MAIN } from "../building";
import { PALETTE } from "../palette";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { rect, slab } from "../solids";
import {
  CEILING_FINISH,
  CEILING_RESERVATION,
  INTERSTOREY_FLOOR_FINISH,
  STOREYS,
} from "../storeys";
import { STAIR_OPENING } from "../stair";

const OWNER = "floors/upper.ts";

/** Stair-owned edge finish the structure recedes from at the opening (08 interstorey-edge-junctions), metres. */
const OPENING_EDGE = CEILING_FINISH;

/** Emit the 0.270 m interstorey structure between the two finish layers, with the receded stair notch. */
export const buildInterstorey = (): IHousePart[] => {
  const [x0, x1] = MAIN.inner.x;
  const [z0, z1] = MAIN.inner.z;
  const e = OPENING_EDGE;
  const outline = [
    { x: x0, z: z0 },
    { x: x1, z: z0 },
    { x: x1, z: z1 },
    { x: STAIR_OPENING.turnX + e, z: z1 },
    { x: STAIR_OPENING.turnX + e, z: STAIR_OPENING.turnZ + e },
    { x: STAIR_OPENING.east + e, z: STAIR_OPENING.turnZ + e },
    { x: STAIR_OPENING.east + e, z: STAIR_OPENING.back - e },
    { x: STAIR_OPENING.west - e, z: STAIR_OPENING.back - e },
    { x: STAIR_OPENING.west - e, z: z1 },
    { x: x0, z: z1 },
  ];
  const bottom = STOREYS.groundCeiling + CEILING_FINISH;
  return [
    part(
      "interstorey-structure",
      OWNER,
      "floor",
      PALETTE.structure,
      slab({
        outline,
        bottom,
        top: STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH,
      }),
    ),
  ];
};

/** Emit the 0.165 m upper ceiling base over the whole main inner plan, stair hall included, above the room finishes. */
export const buildUpperCeiling = (): IHousePart[] => {
  const bottom = STOREYS.upperCeiling + CEILING_FINISH;
  return [
    part(
      "upper-ceiling-base",
      OWNER,
      "ceiling",
      PALETTE.ceiling,
      slab({
        outline: rect(MAIN.inner.x, MAIN.inner.z),
        bottom,
        top: STOREYS.upperCeiling + CEILING_RESERVATION,
      }),
    ),
  ];
};
