
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { slab } from "../slab";
import {
  STOREYS,
} from "../STOREYS";
import { CEILING_FINISH } from "../CEILING_FINISH";
import { INTERSTOREY_FLOOR_FINISH } from "../INTERSTOREY_FLOOR_FINISH";
import { STAIR_OPENING } from "../STAIR_OPENING";
import { UPPER_FLOOR_OWNER } from "./UPPER_FLOOR_OWNER";

/** Stair-owned edge finish the structure recedes from at the opening (08 interstorey-edge-junctions), metres. */
const OPENING_EDGE = CEILING_FINISH;

/** Emit the 0.270 m interstorey structure between the two finish layers, with the receded stair notch. */
export const buildInterstorey = (): IHousePart[] => {
  const [x0, x1] = MAIN_OUTLINE.inner.x;
  const [z0, z1] = MAIN_OUTLINE.inner.z;
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
      UPPER_FLOOR_OWNER,
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

