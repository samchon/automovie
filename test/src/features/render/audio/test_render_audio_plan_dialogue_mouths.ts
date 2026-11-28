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
 *
 * @evidence contracts/development/common.md#meaningful-documentation An empty film produces no dialogue mouths while retaining the exact commissioned frame rate.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the mouth planner on a film with no dialogue at the rational 30000/1001 rate.
 * @evidence contracts/development/testing.md#independent-expectations The two explicit expectations require an empty line list and the numeric quotient of the independently authored numerator and denominator.
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