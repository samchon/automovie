import { HumanRefusal, admitLapSupport } from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

/** With a 0.4 m thigh, lap support admits knee drops up to 0.2 m. */
export function test_motions_touch_sit_on_lap(): void {
  admitLapSupport("partner", 0, 0.4);
  admitLapSupport("partner", 0.2, 0.4);
  assert.throws(
    () => admitLapSupport("partner", 0.201, 0.4),
    (error: unknown): boolean =>
      error instanceof HumanRefusal &&
      error.kind === "base" &&
      error.axis === "partner" &&
      error.value === "partner",
  );
  admitLapSupport("partner", 0.201, 0.5);
}
