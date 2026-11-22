import type { BakedClient } from "../baked/BakedClient";
import type { IScene } from "./structures/IScene";
import type { IScenePlayer } from "./structures/IScenePlayer";

/**
 * Read a baked take, or compute one in the take worker, and build its
 * player, importing the drawing packages only when a page first draws a
 * scene, so they never weigh on a page that does not.
 *
 * @param scene The scene's record; a motion's trial passes a record of its own.
 * @param take The take's index.
 * @param signal Aborted when the view stops waiting.
 * @param baked Where the first take was baked, when it was.
 * @returns The player.
 */
export async function loadScenePlayer(
  scene: IScene,
  take: number,
  signal?: AbortSignal,
  baked?: BakedClient.Kind,
): Promise<IScenePlayer> {
  const { ScenePlayer }: typeof import("./package/ScenePlayer") =
    await import("./package/ScenePlayer");
  return ScenePlayer.load(scene, take, signal, baked);
}
