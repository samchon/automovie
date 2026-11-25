import { HumanRefusal, admitButtonMotion } from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

/** A button stroke has signed travel, positive dimensions and positive time. */
export function test_motions_handling_button(): void {
  const motion = { travel: 0.05, radius: 0.01, thickness: 0.004, duration: 0.45 };
  admitButtonMotion(motion);
  admitButtonMotion({ ...motion, travel: -motion.travel });
  const fields: readonly (keyof typeof motion)[] = [
    "travel", "radius", "thickness", "duration",
  ];
  for (const key of fields)
    assert.throws(
      () => admitButtonMotion({ ...motion, [key]: 0 }),
      (error: unknown): boolean =>
        error instanceof HumanRefusal && error.kind === "parameter" && error.axis === "travel",
    );
}
