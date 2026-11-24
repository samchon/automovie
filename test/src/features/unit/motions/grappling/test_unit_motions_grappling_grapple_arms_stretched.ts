import { HumanRefusal, grappleArms } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A duration refusal whose feasible range starts at a least duration. */
const short = (minimum: number, axis: string = "duration"): HumanRefusal =>
  new HumanRefusal({
    kind: "parameter",
    axis,
    value: 4,
    feasible: { kind: "range", minimum, maximum: 10, unit: "s" },
    reason: "too short",
    fix: "lengthen it",
  });

/**
 * `grappleArms.stretched` reads a duration refusal of the arms' plan as the
 * scene's stretched rest: the release-to-rest window scaled by the least
 * duration over the scene's, `release + (rest - release) minimum / duration`,
 * when that still ends inside the scene.
 *
 * A 4 s scene releases at 3 s and rests at 3.6 s.
 *
 * Scenarios:
 *
 * 1. A refusal asking 5 s stretches the rest to `3 + 0.6 · 5 / 4` = 3.75 s.
 * 2. One asking 8 s would end past the scene: none.
 * 3. One on another axis, one asking no more than the scene, or another error:
 *    none.
 */
export function test_unit_motions_grappling_grapple_arms_stretched(): void {
  TestValidator.equals(
    "the stretched rest, or none",
    [
      grappleArms.stretched(short(5), 4, 3, 3.6),
      grappleArms.stretched(short(8), 4, 3, 3.6),
      grappleArms.stretched(short(5, "reach"), 4, 3, 3.6),
      grappleArms.stretched(short(3), 4, 3, 3.6),
      grappleArms.stretched(new Error("other"), 4, 3, 3.6),
    ],
    [3 + (0.6 * 5) / 4, undefined, undefined, undefined, undefined],
  );
}
