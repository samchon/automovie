import { extrudeAutoMovieRegion, transformAutoMovieMesh } from "@automovie/engine";
import type { IWallFace } from "../types/IWallFace";
import type { IWallHole } from "../types/IWallHole";
import type { IWallPoint } from "../types/IWallPoint";
import type { IWallSolid } from "../types/IWallSolid";

/** Quarter turn about world Y: local +X becomes world +Z, local +Z becomes world -X. */
const TO_Z_AXIS = { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
/**
 * Wall solid between two across-coordinates over an outline in wall coordinates, with rectangular
 * holes.
 */
export const wallPanel = (props: {
  axis: "x" | "z";
  across: readonly [number, number];
  outline: readonly IWallPoint[];
  holes?: readonly IWallHole[];
}): IWallSolid => {
  const depth = props.across[1] - props.across[0];
  const center = (props.across[0] + props.across[1]) / 2;
  const outer = props.outline.map((p) => ({ x: p.u, y: p.y }));
  const holes = (props.holes ?? []).map((h) => [
    { x: h.from, y: h.bottom },
    { x: h.to, y: h.bottom },
    { x: h.to, y: h.top },
    { x: h.from, y: h.top },
  ]);
  const local = extrudeAutoMovieRegion({ outer, holes, depth });
  const face: IWallFace = {
    axis: props.axis,
    across: props.across,
    outline: props.outline,
    holes: props.holes ?? [],
  };
  // Along X the region already lies in world X/Y; only its depth moves to Z.
  if (props.axis === "x") return {
    mesh: transformAutoMovieMesh(local, {
      translation: { x: 0, y: 0, z: center },
    }),
    face,
  };
  // Along Z: local X turns into world +Z and the depth axis into world -X.
  return {
    mesh: transformAutoMovieMesh(local, {
      rotation: TO_Z_AXIS,
      translation: { x: center, y: 0, z: 0 },
    }),
    face,
  };
};
