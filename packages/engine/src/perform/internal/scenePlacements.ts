import type {
  IAutoMovieCamera,
  IAutoMovieScene,
  IAutoMovieSceneNode,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Build the staged positional-target table from camera translations followed by
 * node translations, in world metres. Node entries win an illegally repeated
 * camera/node id; values are borrowed from the scene and the map belongs to the
 * caller.
 */
export function scenePlacements(
  scene: IAutoMovieScene,
): Map<string, IAutoMovieVector3> {
  return new Map<string, IAutoMovieVector3>([
    ...scene.cameras.map(
      (camera: IAutoMovieCamera): readonly [string, IAutoMovieVector3] =>
        [camera.id, camera.transform.translation] as const,
    ),
    ...scene.nodes.map(
      (node: IAutoMovieSceneNode): readonly [string, IAutoMovieVector3] =>
        [node.id, node.transform.translation] as const,
    ),
  ]);
}
