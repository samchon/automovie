import type {
  IAutoMovieMotionHumanOperateState,
  IAutoMovieMotionTarget,
} from "@automovie/interface";
import { operateState } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few products and a turn, metres and degrees. */
const ROUNDING: number = 1e-12;

/**
 * `operateState.at` is an operated part's contact at a share of its stroke: a
 * button pressed in against its normal by its travel (5 mm unless given), a
 * knob turned by its turn, a slider drawn out along its normal by its travel, a
 * hinged leaf swung about its line by its swing toward its normal's side, and
 * an insertion driven in by its depth, or in and back out on a cosine when it
 * withdraws.
 *
 * Scenarios, a contact at (0, 1, 0.5) facing +Z, half way through:
 *
 * 1. A button with no travel is 2.5 mm in.
 * 2. A knob of 90 degrees has rolled 45.
 * 3. A slider of 0.3 m is 0.15 m out.
 * 4. A leaf hinged on a vertical line through (0.4, 0, 0.5), swinging 90 degrees,
 *    has turned 45: its handle at `foot + R(45) arm` facing turned.
 * 5. An insertion of 0.2 m is 0.1 m in; withdrawing, it is at its full depth half
 *    way and back out at the end.
 */
export function test_unit_motions_affordance_operate_state(): void {
  const place: IAutoMovieMotionHumanOperateState.IAtPlace = {
    point: { x: 0, y: 1, z: 0.5 },
    normal: { x: 0, y: 0, z: 1 },
  };
  const at: IAutoMovieMotionTarget = {
    kind: "point",
    frame: "world",
    at: place.point,
  };
  TestValidator.predicate(
    "a button",
    vclose(
      operateState.at({ kind: "button", at }, place, undefined, 0.5).point,
      { x: 0, y: 1, z: 0.5 - 0.0025 },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "a knob",
    nclose(
      operateState.at({ kind: "knob", at, turn: 90 }, place, undefined, 0.5)
        .roll,
      45,
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "a slider",
    vclose(
      operateState.at(
        { kind: "slider", at, travel: 0.3 },
        place,
        undefined,
        0.5,
      ).point,
      { x: 0, y: 1, z: 0.65 },
      ROUNDING,
    ),
  );
  const swung: IAutoMovieMotionHumanOperateState.IAtResult = operateState.at(
    { kind: "hinge", at, swing: 90 },
    place,
    { point: { x: 0.4, y: 0, z: 0.5 } },
    0.5,
  );
  const r: number = Math.SQRT1_2;
  // The arm from the line's foot (0.4, 1, 0.5) is -0.4 X; the pull turns it
  // toward +Z, the normal's side, a quarter turn's half.
  TestValidator.predicate(
    "a hinged leaf",
    vclose(
      swung.point,
      { x: 0.4 - 0.4 * r, y: 1, z: 0.5 + 0.4 * r },
      ROUNDING,
    ) &&
      Math.abs(Math.hypot(swung.normal.x, swung.normal.z) - 1) <= ROUNDING &&
      Math.abs(Math.abs(swung.normal.x) - r) <= ROUNDING,
  );
  const insert: (withdraw: boolean, progress: number) => number = (
    withdraw: boolean,
    progress: number,
  ): number =>
    operateState.at(
      { kind: "insert", prop: "rod", into: at, depth: 0.2, withdraw },
      place,
      undefined,
      progress,
    ).point.z;
  TestValidator.predicate(
    "an insertion",
    nclose(insert(false, 0.5), 0.4, ROUNDING) &&
      nclose(insert(true, 0.5), 0.3, ROUNDING) &&
      nclose(insert(true, 1), 0.5, ROUNDING),
  );
}
