import { type IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshAssembly } from "@automovie/engine";
import { IAutoMovieMeshPart } from "@automovie/engine";
import { mergeAutoMovieMeshParts } from "@automovie/engine";
import { slab } from "./slab";
import { yaw } from "./yaw";

/**
 * Compose two box members per step, with tread thickness 0.2*rise and riser depth 0.15*run, preserving the architecture case's authored stock proportions. Zero turn places a straight flight; nonzero turn places centres at radius innerRadius+width/2 and rotates members about +Y. Distances are metres and turnDeg is degrees.
 *
 * Callers supply the tested positive integral step count and dimensions; this is a composition fixture, not a stair-code, connection or traversal validator. The parent derives volume from box dimensions and checks straight extents plus the turning twin.
 *
 * The two slab meshes are reused for every step, then merged into caller-owned buffers/groups. Work/output grow with step count; temporary placements and parts release after the merge and no host or persistent fixture cache exists.
 */
export const stair: (props: {
  steps: number;
  rise: number;
  run: number;
  width: number;
  turnDeg: number;
  innerRadius: number;
}) => IAutoMovieMeshAssembly = (props: {
  steps: number;
  rise: number;
  run: number;
  width: number;
  turnDeg: number;
  innerRadius: number;
}): IAutoMovieMeshAssembly => {
  const treadThickness: number = props.rise * 0.2;
  const riserHeight: number = props.rise - treadThickness;
  const riserDepth: number = props.run * 0.15;
  const tread: IAutoMovieMesh = slab(props.width, treadThickness, props.run);
  const riser: IAutoMovieMesh = slab(props.width, riserHeight, riserDepth);
  const parts: IAutoMovieMeshPart[] = [];
  for (let step: number = 0; step < props.steps; ++step) {
    const angle: number =
      ((props.turnDeg * step) / props.steps) * (Math.PI / 180);
    const radius: number = props.innerRadius + props.width / 2;
    const centre: { x: number; z: number } =
      props.turnDeg === 0
        ? { x: 0, z: (step + 0.5) * props.run }
        : {
            x: Math.sin(angle) * radius,
            z: Math.cos(angle) * radius - radius,
          };
    const top: number = (step + 1) * props.rise;
    parts.push({
      id: `tread-${step + 1}`,
      mesh: tread,
      transform: {
        translation: { x: centre.x, y: top - treadThickness / 2, z: centre.z },
        rotation: yaw(angle),
      },
    });
    parts.push({
      id: `riser-${step + 1}`,
      mesh: riser,
      transform: {
        translation: {
          x: centre.x,
          y: top - treadThickness - riserHeight / 2,
          z: centre.z - props.run / 2,
        },
        rotation: yaw(angle),
      },
    });
  }
  return mergeAutoMovieMeshParts(parts);
};
