import { AutoMovieMotionHumanRefusal, requireOtherPerformer } from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

/** Each partner-only contact requires two distinct performers. */
export function test_motions_touch_partner_touch(): void {
  const reason: string = "a performer embraces another performer";
  requireOtherPerformer("a", "b", reason);
  assert.throws(
    () => requireOtherPerformer("a", "a", reason),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal &&
      error.kind === "parameter" &&
      error.axis === "partner" &&
      error.value === "a" &&
      error.reason === reason,
  );
}
