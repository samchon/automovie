import { TakeClient } from "../takes/TakeClient";
import { SCENE_FPS } from "./SCENE_FPS";
import { SceneTake } from "./SceneTake";
import type { IScene } from "./structures/IScene";

/**
 * Compute one take of a scene in the take worker, or read it from the page's
 * cache, at the scenes' rate. Every view of the take and the scene page's
 * timeline share the one computation.
 *
 * @param scene The scene's record; its composition must not be null.
 * @param take The take's index.
 * @param signal Aborted when the caller stops waiting.
 * @returns The take or the packages' refusal.
 * @throws {Error} When the scene has no composition or no such take, or the worker fails.
 */
export function computeSceneTake(
  scene: IScene,
  take: number,
  signal?: AbortSignal,
): Promise<TakeClient.Result> {
  const chosen: IScene.ITake | undefined = scene.takes[take];
  if (scene.composition === null || chosen === undefined)
    return Promise.reject(
      new Error(`The scene ${scene.id} has no composed take ${take}`),
    );
  return TakeClient.take(
    SceneTake.apply(scene.composition, chosen),
    SCENE_FPS,
    signal,
  );
}
