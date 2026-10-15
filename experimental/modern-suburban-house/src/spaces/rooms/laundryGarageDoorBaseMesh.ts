import type { IAutoMovieMesh } from "@automovie/interface";
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { rect } from "../rect";
import { slab } from "../slab";
import { GROUND_LAYERS } from "../GROUND_LAYERS";
import { LAUNDRY_GARAGE_DOOR } from "./LAUNDRY_GARAGE_DOOR";
import { LAUNDRY_FLOOR } from "./LAUNDRY_FLOOR";

/** One under-door slab supplies disjoint structural and room-owned faces. */

export const laundryGarageDoorBaseMesh = (): IAutoMovieMesh => slab({
  outline: rect(
    [MAIN_OUTLINE.inner.x[1], MAIN_OUTLINE.outer.x[1]],
    [LAUNDRY_GARAGE_DOOR.from, LAUNDRY_GARAGE_DOOR.to]
  ),
  bottom: LAUNDRY_FLOOR - GROUND_LAYERS.finish - GROUND_LAYERS.base,
  top: LAUNDRY_FLOOR - GROUND_LAYERS.finish,
});
