import type { IAutoMovieMotionHumanEntryState } from "@automovie/interface";
import { HumanRefusal, seatedHeelBounce } from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

/** Four beats at 2 Hz take two seconds and need a seat and two flat feet. */
export function test_unit_motions_everyday_seated_heel_bounce(): void {
  assert.equal(seatedHeelBounce.beatDuration(4, 2), 2);
  const seat: IAutoMovieMotionHumanEntryState.ISupport = {
    part: "seat",
    kind: "seat",
    support: { kind: "prop", subject: "chair" },
  };
  seatedHeelBounce.admitBase("seated", seat, true);
  assert.throws(() => seatedHeelBounce.beatDuration(0, 2), refuses("count"));
  assert.throws(() => seatedHeelBounce.beatDuration(4, 0), refuses("cadence"));
  assert.throws(
    () => seatedHeelBounce.admitBase("standing", seat, true),
    refuses("base"),
  );
  assert.throws(
    () => seatedHeelBounce.admitBase("seated", seat, false),
    refuses("base"),
  );
  assert.throws(
    () => seatedHeelBounce.admitBase("seated", undefined, true),
    refuses("base"),
  );
}

/** Match the refused input at the primitive's boundary. */
function refuses(axis: string): (error: unknown) => boolean {
  return (error: unknown): boolean =>
    error instanceof HumanRefusal && error.axis === axis;
}
