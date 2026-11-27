import type {
  IAutoMovieMesh,
  IAutoMovieMeshMorphTarget,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { resolveMorphTargetWeights as resolveMorphTargetWeightsImplementation } from "./internal/resolveMorphTargetWeights";
import { skinMesh as skinMeshImplementation } from "./internal/skinMesh";

/** Public pose-driven mesh deformation operations. */
export namespace AutoMovieEngineSkinning {
  /** Resolve pose-driven morph target weights for one pose. */
  export function resolveMorphTargetWeights(
    targets: readonly Pick<IAutoMovieMeshMorphTarget, "name" | "driver">[],
    pose: IAutoMoviePose,
  ): Map<string, number> {
    return resolveMorphTargetWeightsImplementation(targets, pose);
  }

  /** Skin admitted mesh vertices from rest bones into the posed bones. */
  export function skinMesh(
    mesh: IAutoMovieMesh,
    rest: readonly IAutoMovieResolvedBone[],
    posed: readonly IAutoMovieResolvedBone[],
    morphWeights?: ReadonlyMap<string, number>,
  ): number[] {
    return skinMeshImplementation(mesh, rest, posed, morphWeights);
  }
}