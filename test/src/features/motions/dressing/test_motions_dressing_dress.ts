import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDress,
  IAutoMovieMotionHumanHeld,
} from "@automovie/interface";
import {
  HumanHand,
  HumanRefusal,
  HumanWornItem,
  dress,
  dressTurn,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a quaternion product, metres. */
const ROUNDING: number = 1e-12;

/**
 * The `dress` law's own logic, the rigid carry of a wearable onto its worn
 * frame, without the arm planner:
 *
 * - `HumanWornItem.point` places an item-local point on the item's frame,
 *   `position + rotation * local`.
 * - `HumanWornItem.holding` targets the hand that holds an item so the item lands
 *   on a frame: the hand turned by the frame's rotation times the inverse held
 *   rotation, its grip socket the held offset, so turned, short of the frame's
 *   origin.
 * - `dressTurn.carried` places the carrying hand on a wearable's frame by the
 *   same rule.
 *
 * Scenarios:
 *
 * 1. An item at (0, 1, 0): unturned, its local (0.1, 0, 0.2) lies at (0.1, 1,
 *    0.2); turned 90 degrees about +Y, its local (1, 0, 0) at (0, 1, -1).
 * 2. A hat held 0.1 m along the grip frame's +Y asked onto a frame at (0, 1.7, 0)
 *    turned 90 degrees about +Y: the hand turns 90 degrees, its grip socket at
 *    (0, 1.6, 0), the offset the body's grip socket.
 * 3. A wearable at (0, 1, 0.5) turned 90 degrees about +Y held 0.1 m along +Z:
 *    held unturned the hand turns with it and grips at (-0.1, 1, 0.5); held
 *    turned the same the hand is unturned and grips at (0, 1, 0.4).
 * 4. The right hand must hold the hat. An empty hand and one holding a
 *    different prop refuse before the arm is planned.
 *
 * The body is built whole (`humanFixtureBody`) for the hand's grip socket.
 */
export async function test_motions_dressing_dress(): Promise<void> {
  // 1. Points.
  const quarter = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  TestValidator.predicate(
    "the points",
    vclose(
      HumanWornItem.point(
        { position: { x: 0, y: 1, z: 0 }, rotation: Quaternion.identity() },
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
      rotation: Quaternion.identity(),
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
  const straight = dressTurn.carried(worn, Quaternion.identity(), offset);
  const turned = dressTurn.carried(
    worn,
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -90),
    offset,
  );
  TestValidator.predicate(
    "the carrying hand",
    qclose(straight.rotation, worn.rotation, ROUNDING) &&
      vclose(straight.grip, { x: -0.1, y: 1, z: 0.5 }, ROUNDING) &&
      qclose(turned.rotation, Quaternion.identity(), ROUNDING) &&
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
        error instanceof HumanRefusal &&
        error.kind === "affordance" &&
        error.axis === "prop" &&
        error.value === "hat" &&
        error.reason.includes(
          heldProp === undefined ? "holds nothing" : "holds cup",
        ),
    );
  }
}
