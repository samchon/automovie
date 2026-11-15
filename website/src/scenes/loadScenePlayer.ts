import type { IScene } from "./structures/IScene";
import type { IScenePlayer } from "./structures/IScenePlayer";

/**
 * Compute a take in the take worker and build its player, importing the
 * drawing packages only when a page first draws a scene, so they never weigh
 * on a page that does not.
 *
 * @param scene The scene's record.
 * @param take The take's index.
 * @param signal Aborted when the view stops waiting.
 * @returns The player.
 */
export async function loadScenePlayer(
  scene: IScene,
  take: number,
  signal?: AbortSignal,
): Promise<IScenePlayer> {
  const { ScenePlayer }: typeof import("./package/ScenePlayer") =
    await import("./package/ScenePlayer");
  return ScenePlayer.load(scene, take, signal);
}
