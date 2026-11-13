import type { IScene } from "./structures/IScene";
import type { ISceneManifest } from "./structures/ISceneManifest";
import type { IScenePlayer } from "./structures/IScenePlayer";

/**
 * Load a baked take, importing the drawing packages only when a page first
 * draws a scene, so they never weigh on a page that does not.
 *
 * @param scene The scene's record.
 * @param take The take's index.
 * @returns The player.
 */
export async function loadScenePlayer(
  scene: IScene,
  take: number,
): Promise<IScenePlayer> {
  const { ScenePlayer } = await import("./package/ScenePlayer");
  return ScenePlayer.load(scene, take);
}

/**
 * The bake's manifest, which says which scenes and takes were baked.
 *
 * @returns The manifest.
 */
export async function loadSceneManifest(): Promise<ISceneManifest> {
  const { ScenePlayer } = await import("./package/ScenePlayer");
  return ScenePlayer.index();
}
