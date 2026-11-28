import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  crossAnkleEntry
} from "../../../../../packages/motions/src/everyday/internal/crossAnkleEntry";
import { strict as assert } from "node:assert";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";

/**
 * An ankle crossing starts on a stationary chair with two grounded soles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Crossing an ankle over a knee requires a stationary chair and two grounded soles.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the crossing admission owner with the same stock body in a seated entry and a standing entry.
 * @evidence contracts/development/testing.md#independent-expectations The seated entry must return its two explicit ground contacts. A standing entry must refuse on the base axis.
 */
export async function test_motions_everyday_cross_ankle_over_knee(): Promise<void> {
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
      error instanceof AutoMovieMotionHumanRefusal && error.axis === "base",
  );
}
