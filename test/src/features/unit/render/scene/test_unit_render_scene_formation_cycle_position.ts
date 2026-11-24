import { formationCyclePosition } from "@automovie/render";
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
 */
export function test_unit_render_scene_formation_cycle_position(): void {
  const cadence: { advance: number; turn: number } = {
    advance: 0.25,
    turn: 0.5,
  };
  TestValidator.equals(
    "positions",
    [
      formationCyclePosition(cadence, 0),
      formationCyclePosition(cadence, 0.5, 1),
      formationCyclePosition(cadence, -0.5),
    ],
    [0.25, 0.25, 0.75],
  );
}
