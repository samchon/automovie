import type { IAutoMovieCamera, IAutoMovieSceneNode, IAutoMovieScene, IAutoMovieVector3 } from "@automovie/interface";


/**
 * Build the staged positional-target table from camera translations followed by node translations, in world metres. Node entries win an illegally repeated camera/node id; values are borrowed from the scene and the map belongs to the caller.
 *
 * @evidence contracts/common.md#principled-implementation An insertion-ordered Map joins all things with a staged world position so performShot validation and reference synthesis resolve positional targets from one convention.
 * @evidence contracts/common.md#clear-and-simple-design One table owner admits both cameras and nodes without teaching each target consumer separate scene traversal rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Node precedence preserves the existing duplicate-id behavior while scene validation owns refusal; no camera is turned into a performing actor by being a positional target.
 * @evidence contracts/common.md#meaningful-documentation States world coordinates, camera inclusion, duplicate precedence, map ownership and borrowed translation values.
 * @evidence contracts/performance.md#efficient-algorithms For C cameras and N nodes, O(C+N) time and storage build the lookup; each staged id must be visited once.
 * @evidence contracts/performance.md#reuse-equivalent-work The shot gate and reference synthesizer share the completed table; translated vectors are borrowed rather than copied or recalculated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the map for the shot; scene translations remain scene-owned and no static scene cache or external handle persists.
 */
export const scenePlacements: (scene: IAutoMovieScene) => Map < string , IAutoMovieVector3 > = (
  scene: IAutoMovieScene,
): Map<string, IAutoMovieVector3> =>
  new Map<string, IAutoMovieVector3>([
    ...scene.cameras.map(
      (camera: IAutoMovieCamera) : readonly [string, IAutoMovieVector3] => [camera.id, camera.transform.translation] as const,
    ),
    ...scene.nodes.map(
      (node: IAutoMovieSceneNode) : readonly [string, IAutoMovieVector3] => [node.id, node.transform.translation] as const,
    ),
  ]);
