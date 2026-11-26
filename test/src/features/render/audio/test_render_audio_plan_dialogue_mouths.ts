import { AutoMovieRenderAudio } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderAudio.planDialogueMouths` plans the mouth of each bound dialogue line on
 * the film's frame rate.
 *
 * Scenarios:
 *
 * 1. With no lines the plan has no mouths, and its rate is the numerator over
 *    the denominator: 30000/1001 frames per second.
 */
export function test_render_audio_plan_dialogue_mouths(): void {
  const plan = AutoMovieRenderAudio.planDialogueMouths({
    lines: [],
    speakers: [],
    frameRate: { numerator: 30000, denominator: 1001 },
  });
  TestValidator.equals("lines", plan.lines, []);
  TestValidator.equals("fps", plan.fps, 30000 / 1001);
}