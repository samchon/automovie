import { extrudeAutoMovieRegion, transformAutoMovieMesh } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import type { IPlanPoint } from "../types/IPlanPoint";

/** Quarter turn about world X: local +Y becomes world +Z, local +Z becomes world -Y. */
const TO_PLAN = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
/**
 * A horizontal slab: a plan polygon with optional plan holes between two heights.
 */

export const slab = (props: {
  outline: readonly IPlanPoint[];
  holes?: readonly (readonly IPlanPoint[])[];
  bottom: number;
  top: number;
}): IAutoMovieMesh => {
  // Local (x, y) = world (x, z); after the quarter turn local +Z points to
  // world -Y, so the centred extrusion is moved to the slab's mid height.
  const local = extrudeAutoMovieRegion({
    outer: props.outline.map((p) => ({ x: p.x, y: p.z })),
    holes: (props.holes ?? []).map((ring) => ring.map((p) => ({ x: p.x, y: p.z }))
    ),
    depth: props.top - props.bottom,
  });
  return transformAutoMovieMesh(local, {
    rotation: TO_PLAN,
    translation: { x: 0, y: (props.bottom + props.top) / 2, z: 0 },
  });
};
