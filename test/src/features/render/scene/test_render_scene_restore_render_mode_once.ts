import { AutoMovieSceneRenderMode } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `restoreAutoMovieRenderModeOnce` runs a restore on its first call only; a
 * restore that failed throws the same error on every later call.
 *
 * Scenarios:
 *
 * 1. Called twice, a restore runs once.
 * 2. A failing restore runs once and both calls throw its error.
 */
export function test_render_scene_restore_render_mode_once(): void {
  let runs: number = 0;
  const restore: () => void = AutoMovieSceneRenderMode.restoreOnce((): void => {
    runs++;
  });
  restore();
  restore();
  TestValidator.equals("runs once", runs, 1);
  const failure: Error = new Error("restore failed");
  let failing: number = 0;
  const broken: () => void = AutoMovieSceneRenderMode.restoreOnce((): void => {
    failing++;
    throw failure;
  });
  const thrown: unknown[] = [];
  for (let call: number = 0; call < 2; call++)
    try {
      broken();
    } catch (error) {
      thrown.push(error);
    }
  TestValidator.predicate(
    "fails once, rethrows",
    failing === 1 &&
      thrown.length === 2 &&
      thrown.every((error: unknown): boolean => error === failure),
  );
}
