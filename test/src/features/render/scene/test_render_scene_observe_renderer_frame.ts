import { observeAutoMovieRendererFrame } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `observeAutoMovieRendererFrame` counts the submissions of one drawn frame.
 *
 * Scenarios:
 *
 * 1. After one reset, two draws of 2 and 1 calls and 14 triangles are counted
 *    together, the output is passed on, and the reset policy is restored.
 * 2. A draw that throws still restores the reset policy.
 */
export function test_render_scene_observe_renderer_frame(): void {
  const render: { calls: number; triangles: number } = {
    calls: 41,
    triangles: 99,
  };
  const info: {
    autoReset: boolean;
    render: { calls: number; triangles: number };
    reset: () => void;
  } = {
    autoReset: true,
    render,
    reset: (): void => {
      render.calls = 0;
      render.triangles = 0;
    },
  };
  const seen: boolean[] = [];
  const result = observeAutoMovieRendererFrame({ info }, (): string => {
    seen.push(info.autoReset);
    render.calls += 2;
    render.triangles += 10;
    render.calls += 1;
    render.triangles += 4;
    return "done";
  });
  TestValidator.equals("output", result.output, "done");
  TestValidator.equals(
    "counts",
    [result.observed.drawCalls, result.observed.triangles],
    [3, 14],
  );
  TestValidator.equals("reset disabled while drawing", seen, [false]);
  TestValidator.equals("restored", info.autoReset, true);
  TestValidator.error("throwing draw", (): void => {
    observeAutoMovieRendererFrame({ info }, (): void => {
      throw new Error("draw failed");
    });
  });
  TestValidator.equals("restored after throw", info.autoReset, true);
}