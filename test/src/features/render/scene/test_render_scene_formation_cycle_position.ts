import { AutoMovieRenderFormationCycle } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `formationCyclePosition` is the fractional part of a member's phase plus the
 * cadence's advance and its turn scaled by the member's radius.
 *
 * Scenarios, with advance 0.25 and turn 0.5:
 *
 * 1. Phase 0 at the centre is 0.25.
 * 2. Phase 0.5 at radius 1 is 0.5 + 0.25 + 0.5 = 1.25, wrapped to 0.25.
 * 3. Phase -0.5 at the centre is -0.25, wrapped to 0.75.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names cadence advance, radius-dependent turn and both signs of phase wrapping.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public cycle position with typed cadence and three member phases including a radius and a negative input.
 * @evidence contracts/development/testing.md#independent-expectations Center phase 0 plus advance 0.25 yields 0.25. Phase 0.5, advance 0.25 and turn 0.5 at radius 1 total 1.25 and wrap to 0.25. Center phase −0.5 plus advance wraps from −0.25 to 0.75.
 */
export function test_render_scene_formation_cycle_position(): void {
  const cadence: { advance: number; turn: number } = {
    advance: 0.25,
    turn: 0.5,
  };
  TestValidator.equals(
    "positions",
    [
      AutoMovieRenderFormationCycle.formationCyclePosition(cadence, 0),
      AutoMovieRenderFormationCycle.formationCyclePosition(cadence, 0.5, 1),
      AutoMovieRenderFormationCycle.formationCyclePosition(cadence, -0.5),
    ],
    [0.25, 0.25, 0.75],
  );
}
