import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
} from "@automovie/interface";
import { HumanSupportFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";

/** Rounding of a forward-kinematics chain, metres. */
const ROUNDING: number = 1e-9;

/**
 * `HumanSupportFrame`'s entry readings: `contact` is what an entry part bears
 * on, the ground when it declares none; `floor` is the height of the floor the
 * planted feet touch, the lowest of their sole sockets, the ground's 0 with no
 * foot planted; `at` reads a ground support as a still frame at its height.
 *
 * The body is built whole (`humanFixtureBody`): the sole sockets are read from
 * the entry's pose by forward kinematics.
 *
 * Scenarios, the average man standing quiet:
 *
 * 1. His feet bear on the ground, as does a part with no contact; a left foot
 *    planted on a cart bears on the cart.
 * 2. Standing 0.5 m higher raises the floor by 0.5 m; with neither foot planted
 *    the floor is 0.
 * 3. The ground support at 1 s is still, at the origin.
 */
export async function test_unit_motions_carrier_human_support_frame_floor(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const low: IAutoMovieMotionHumanActionContext<object> = motionActionContext(
    body,
    {},
  );
  const high: IAutoMovieMotionHumanActionContext<object> = motionActionContext(
    body,
    {},
    { at: { x: 0, y: 0.5, z: 0 } },
  );
  const onCart: Pick<IAutoMovieMotionHumanActionContext, "entry"> = {
    entry: {
      ...low.entry,
      supports: [
        {
          part: "leftFoot",
          kind: "plant",
          support: { kind: "prop", subject: "cart" },
        },
      ],
    },
  };
  TestValidator.equals(
    "the contacts",
    [
      HumanSupportFrame.contact(low, "leftFoot"),
      HumanSupportFrame.contact(low, "leftHand"),
      HumanSupportFrame.contact(onCart, "leftFoot"),
    ],
    [{ kind: "ground" }, { kind: "ground" }, { kind: "prop", subject: "cart" }],
  );
  const lifted: IAutoMovieMotionHumanEntryState = {
    ...low.entry,
    feet: {
      left: { ...low.entry.feet.left, planted: false },
      right: { ...low.entry.feet.right, planted: false },
    },
  };
  TestValidator.predicate(
    "the floor",
    nclose(
      HumanSupportFrame.floor(body, high.entry),
      HumanSupportFrame.floor(body, low.entry) + 0.5,
      ROUNDING,
    ) && HumanSupportFrame.floor(body, lifted) === 0,
  );
  const frame: ReturnType<typeof HumanSupportFrame.at> = HumanSupportFrame.at(
    low,
    1,
  );
  TestValidator.equals(
    "the ground",
    [frame.support, frame.position, frame.velocity, frame.acceleration],
    [
      { kind: "ground" },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
    ],
  );
}
