import type { IAutoMovieAffordance } from "@automovie/interface";
import { AutoMovieMotionHumanRefusal, writeAdmission } from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

/** A carried tool keeps its working point against a separate stable surface. */
export function test_motions_handling_write(): void {
  const nib: Pick<IAutoMovieAffordance, "id" | "kind"> = {
    id: "nib",
    kind: "socket",
  };
  writeAdmission.surface("pen", "paper", {}, () => true);
  writeAdmission.tip({}, nib);
  assert.throws(
    () => writeAdmission.surface("pen", "pen", {}, () => true),
    refused("on"),
  );
  assert.throws(
    () => writeAdmission.surface("pen", "paper", { fixed: true }, () => true),
    refused("on"),
  );
  assert.throws(
    () => writeAdmission.surface("pen", "paper", {}, () => false),
    refused("on"),
  );
  const tool = { articulate: (): { affordances: [] } => ({ affordances: [] }) };
  writeAdmission.tip(tool, nib);
  assert.throws(
    () => writeAdmission.tip(tool, { ...nib, rides: "slider" }),
    refused("tip"),
  );
}

/** Match the item that would move away from the writing target. */
function refused(axis: string): (error: unknown) => boolean {
  return (error: unknown): boolean =>
    error instanceof AutoMovieMotionHumanRefusal && error.kind === "affordance" && error.axis === axis;
}
