
import { GARAGE_OUTLINE } from "./GARAGE_OUTLINE";
import type { IAutoMovieMesh } from "@automovie/interface";
import { slab } from "./slab";
import { GARAGE_FRONT_DOOR } from "./envelope/GARAGE_FRONT_DOOR";
import {
  STOREYS,
} from "./STOREYS";
import { GROUND_LAYERS } from "./GROUND_LAYERS";

/** One garage floor solid supplies disjoint structural and visible faces. */
export const garageFloorMesh = (): IAutoMovieMesh => slab({
  outline: [
    { x: GARAGE_OUTLINE.inner.x[0], z: GARAGE_OUTLINE.inner.z[0] },
    { x: GARAGE_OUTLINE.inner.x[1], z: GARAGE_OUTLINE.inner.z[0] },
    { x: GARAGE_OUTLINE.inner.x[1], z: GARAGE_OUTLINE.inner.z[1] },
    { x: GARAGE_FRONT_DOOR.to, z: GARAGE_OUTLINE.inner.z[1] },
    { x: GARAGE_FRONT_DOOR.to, z: GARAGE_OUTLINE.outer.z[1] },
    { x: GARAGE_FRONT_DOOR.from, z: GARAGE_OUTLINE.outer.z[1] },
    { x: GARAGE_FRONT_DOOR.from, z: GARAGE_OUTLINE.inner.z[1] },
    { x: GARAGE_OUTLINE.inner.x[0], z: GARAGE_OUTLINE.inner.z[1] },
  ],
  bottom: STOREYS.garageFloor - GROUND_LAYERS.garageBase,
  top: STOREYS.garageFloor,
});

