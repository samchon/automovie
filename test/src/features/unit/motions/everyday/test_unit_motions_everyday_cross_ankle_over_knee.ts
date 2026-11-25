import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
} from "@automovie/interface";
import { HumanRefusal, crossAnkleEntry } from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/** An ankle crossing starts on a stationary chair with two grounded soles. */
export async function test_unit_motions_everyday_cross_ankle_over_knee(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanActionContext = motionActionContext(body, {});
  const feet: readonly IAutoMovieMotionHumanEntryState.ISupport[] = [
    { part: "leftFoot", kind: "plant", support: { kind: "ground" } },
    { part: "rightFoot", kind: "plant", support: { kind: "ground" } },
  ];
  const seated: IAutoMovieMotionHumanEntryState = {
    ...standing.entry,
    base: { kind: "seated", seat: { at: { x: 0, y: 0.45, z: 0 }, yaw: 0 } },
    supports: [
      { part: "seat", kind: "seat", support: { kind: "ground" } },
      ...feet,
    ],
  };
  assert.deepEqual(crossAnkleEntry({ ...standing, entry: seated }, "right"), feet);
  assert.throws(
    () => crossAnkleEntry(standing, "right"),
    (error: unknown): boolean =>
      error instanceof HumanRefusal && error.axis === "base",
  );
}
