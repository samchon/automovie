import {
  assertAutoMovieInspectorRaster
} from "../../../../../packages/viewer/src/inspector/internal/assertAutoMovieInspectorRaster";
import { TestValidator } from "@nestia/e2e";

/**
 * `assertAutoMovieInspectorRaster` refuses a subject whose clock or picture is
 * not positive, naming the subject and the field.
 *
 * Scenarios:
 *
 * 1. A subject of 2 s, 24 fps and 64 by 32 passes.
 * 2. A zero duration, rate, width or height is refused with the subject's name
 *    and the field in the message.
 */
export function test_viewer_inspector_assert_raster(): void {
  const scene = (
    patch: Partial<{
      durationSeconds: number;
      fps: number;
      width: number;
      height: number;
    }>,
  ): { durationSeconds: number; fps: number; width: number; height: number } => ({
    durationSeconds: 2,
    fps: 24,
    width: 64,
    height: 32,
    ...patch,
  });
  assertAutoMovieInspectorRaster("hero", scene({}));
  for (const [field, patch] of [
    ["duration", { durationSeconds: 0 }],
    ["fps", { fps: 0 }],
    ["width", { width: 0 }],
    ["height", { height: 0 }],
  ] as const) {
    let message: string = "";
    try {
      assertAutoMovieInspectorRaster("hero", scene(patch));
    } catch (error) {
      message = error instanceof Error ? error.message : "";
    }
    TestValidator.equals(
      field,
      message.includes('"hero"') && message.includes(field),
      true,
    );
  }
}