import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDress,
  IAutoMovieMotionHumanHeld,
} from "@automovie/interface";
import {
  HumanHand
} from "../../../../../packages/motions/src/posture/internal/HumanHand";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  HumanWornItem
} from "../../../../../packages/motions/src/dressing/internal/HumanWornItem";
import {
  dress
} from "../../../../../packages/motions/src/dressing/internal/dress";
import {
  dressTurn
} from "../../../../../packages/motions/src/dressing/internal/dressTurn";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a quaternion product, metres. */
const ROUNDING: number = 1e-12;

/**
 * Check rigid wearable placement, carry and required hand custody.
 *
 * Scenarios:
 *
 * 1. Place an item-local point in an unrotated frame and after a 90 degree
 *    yaw about its authored origin.
 * 2. For a hat held 0.1 m up, read the arrival grip socket 0.1 m below the
 *    worn frame. Compare the carried grip when its initial rotation is
 *    identity or already matches the wearable.
 * 3. Refuse an empty right hand and a right hand holding another prop for the
 *    hat request.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases name the offsets and frames used by placement and the two missing-custody conditions.
 * @evidence contracts/development/testing.md#behavioral-verification The fixture exercises forward point conversion, solved grip geometry and the dress law's entry gate.
 * @evidence contracts/development/testing.md#independent-expectations The given local offsets and inverse held rotation determine expected world grip positions by rigid composition.
 */
export async function test_motions_dressing_dress(): Promise<void> {
  // 1. Points.
  const quarter = AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  TestValidator.predicate(
    "the points",
    vclose(
      HumanWornItem.point(
        { position: { x: 0, y: 1, z: 0 }, rotation: AutoMovieEngineQuaternion.identity() },
        { x: 0.1, y: 0, z: 0.2 },
      ),
      { x: 0.1, y: 1, z: 0.2 },
      ROUNDING,
    ) &&
      vclose(
        HumanWornItem.point(
          { position: { x: 0, y: 1, z: 0 }, rotation: quarter },
          { x: 1, y: 0, z: 0 },
        ),
        { x: 0, y: 1, z: -1 },
        ROUNDING,
      ),
  );

  // 2. The holding hand.
  // Reads the hand's grip socket (`HumanHand.offset`); the parameter is the whole body record.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const held: IAutoMovieMotionHumanHeld.IHeld = {
    prop: "hat",
    side: "right",
    frame: {
      position: { x: 0, y: 0.1, z: 0 },
      rotation: AutoMovieEngineQuaternion.identity(),
    },
    affordances: [],
  };
  const frame = { position: { x: 0, y: 1.7, z: 0 }, rotation: quarter };
  const bend = { x: -0.3, y: 1.2, z: 0 };
  const target = HumanWornItem.holding(body, "right", held, frame, bend);
  TestValidator.predicate(
    "the holding hand",
    target.surface === "grip" &&
      target.shape === "relaxed" &&
      target.bend === bend &&
      qclose(target.rotation, frame.rotation, ROUNDING) &&
      vclose(target.point, { x: 0, y: 1.6, z: 0 }, ROUNDING) &&
      vclose(
        target.offset!,
        HumanHand.offset(body, "right", "grip").point,
        ROUNDING,
      ),
  );

  // 3. The carrying hand.
  const worn = { position: { x: 0, y: 1, z: 0.5 }, rotation: quarter };
  const offset = { x: 0, y: 0, z: 0.1 };
  const straight = dressTurn.carried(worn, AutoMovieEngineQuaternion.identity(), offset);
  const turned = dressTurn.carried(
    worn,
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -90),
    offset,
  );
  TestValidator.predicate(
    "the carrying hand",
    qclose(straight.rotation, worn.rotation, ROUNDING) &&
      vclose(straight.grip, { x: -0.1, y: 1, z: 0.5 }, ROUNDING) &&
      qclose(turned.rotation, AutoMovieEngineQuaternion.identity(), ROUNDING) &&
      vclose(turned.grip, { x: 0, y: 1, z: 0.4 }, ROUNDING),
  );

  // 4. Missing possession refuses before any dressing geometry is read.
  const params: IAutoMovieMotionHumanDress.IParams = {
    item: "hat",
    prop: "hat",
    hand: "right",
  };
  const bare: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDress.IParams> =
    motionActionContext(body, params);
  for (const heldProp of [undefined, "cup"] as const) {
    assert.throws(
      () =>
        dress.plan({
          ...bare,
          entry: {
            ...bare.entry,
            holds: heldProp === undefined ? {} : { right: heldProp },
          },
        }),
      (error: unknown): boolean =>
        error instanceof AutoMovieMotionHumanRefusal &&
        error.kind === "affordance" &&
        error.axis === "prop" &&
        error.value === "hat" &&
        error.reason.includes(
          heldProp === undefined ? "holds nothing" : "holds cup",
        ),
    );
  }
}
