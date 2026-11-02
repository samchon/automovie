import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieMeshSkin, IAutoMovieSkeleton } from "@automovie/interface";

import { skinAutoMovieMesh } from "../../../../packages/engine/src/skinning/skinAutoMovieMesh";
import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import type { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";

/** The engine's skinning authority over the clinical placements a Human emits. */
export namespace HumanMouthSkin {
  /** Rest and posed rigid frames, in model metres. */
  export interface IFrames {
    /** The Human rig's bind frames. */
    rest: IAutoMovieResolvedBone[];

    /** The same bones under the evaluated clinical pose. */
    posed: IAutoMovieResolvedBone[];
  }

  /** Adapt clinical frames without an Euler conversion or an invented pose. */
  export function frames(skeleton: IAutoMovieSkeleton, output: AutoMovieHumanSkeleton.IOutput): IFrames {
    const rest: IAutoMovieResolvedBone[] = resolvePose({ skeleton: skeleton.id, root: null, joints: [] }, skeleton);
    const posed: IAutoMovieResolvedBone[] = [];
    const placements: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(
      output.posed.map((placement: AutoMovieHumanSkeleton.IPlacement): [string, AutoMovieHumanSkeleton.IPlacement] => [placement.bone, placement]),
    );
    for (const bone of skeleton.bones) {
      const name: string = bone.bone.endsWith("Toes") ? bone.bone.replace("Toes", "HalluxProximal") : bone.bone;
      const placement: AutoMovieHumanSkeleton.IPlacement | undefined = placements.get(name);
      if (placement === undefined) throw new Error(`The Human pose has no placement for ${bone.bone}`);
      posed.push({
        bone: bone.bone,
        localRotation: { x: 0, y: 0, z: 0, w: 1 },
        worldPosition: { x: placement.position[0], y: placement.position[1], z: placement.position[2] },
        worldRotation: { x: placement.rotation[0], y: placement.rotation[1], z: placement.rotation[2], w: placement.rotation[3] },
      });
    }
    if (rest.length !== posed.length) throw new Error("The Human bind skeleton has unreachable bones");
    return { rest, posed };
  }

  /** Read all vertices in one engine skin call, returning calibration millimetres. */
  export function pose(positions: readonly number[], skin: IAutoMovieMeshSkin, frames: IFrames, scale: number): number[] {
    const mesh: IAutoMovieMesh = {
      positions: positions.map((value: number): number => value * scale),
      normals: null,
      uvs: null,
      indices: null,
      skin,
    };
    return skinAutoMovieMesh(mesh, frames.rest, frames.posed).map((value: number): number => value / scale);
  }
}
