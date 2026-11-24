import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHeld,
} from "@automovie/interface";
import { HumanHand, HumanWornItem } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a quaternion product, metres. */
const ROUNDING: number = 1e-12;

/**
 * `HumanWornItem.holding` targets the hand that holds an item so the item lands
 * on a frame: the hand turns by the frame's rotation times the inverse held
 * rotation, and its grip socket lies the held offset, so turned, short of the
 * frame's origin; the target is the relaxed grip with the elbow's hint.
 *
 * Scenario: a hat held 0.1 m along the grip frame's +Y, unturned in the hand,
 * asked onto a frame at (0, 1.7, 0) turned 90 degrees about +Y: the hand turns
 * 90 degrees, its grip socket lies at (0, 1.6, 0), and the offset is the body's
 * grip socket.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_dressing_human_worn_item_holding(): Promise<void> {
  // Reads the hand's grip socket (`HumanHand.offset`); the parameter is the whole body record, which has no stored or partial typed form without a cast.
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
  const frame = {
    position: { x: 0, y: 1.7, z: 0 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
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
}
