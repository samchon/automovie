import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRise,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRise
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanRise";
import {
  HumanFoot
} from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a pivot, metres or degrees. */
const ROUNDING: number = 1e-9;

/**
 * `AutoMovieMotionHumanRise` rises a body onto its toes: each foot turns heel
 * up about its toes' joint, which stays where it stands, on the foot's heading;
 * the root lifts by the mean of the two ankles' travel; and each leg's row
 * plants its foot on the raised placement with the toes bent back by the heel's
 * angle.
 *
 * The body is built whole (`humanFixtureBody`) for the feet's sockets.
 *
 * Scenarios, the average man standing flat, his feet 0.2 m apart and facing +Z,
 * the right one turned out 10 degrees:
 *
 * 1. Raised 35 degrees, each toes' joint is where it stood, the foot's pitch is
 *    −35 and its heading kept, the ankle up.
 * 2. The lift is the mean of the ankles' travel, up by several centimetres.
 * 3. A leg row at a second writes its toes at the heel's angle and a planted goal
 *    at the raised ankle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the pivoted toes, ankle lift and the planted leg row, including its toe angle and foot heading.
 * @evidence contracts/development/testing.md#behavioral-verification Calls HumanRise foot, lift and rows using the stored feet and sampled postures, then reads world sockets, ankle shifts and written leg fields.
 * @evidence contracts/development/testing.md#independent-expectations Rotation about the toes fixes their world point and raises the heel without changing heading. The root lift is the arithmetic mean of both measured ankle displacements. The sampled row must claim the right leg and set ten degrees on its toes.
 */
export async function test_motions_compose_human_rise(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const flat = (
    x: number,
    heading: number,
  ): IAutoMovieMotionHumanFoot.IPlacement => ({
    ankle: { x, y: 0.08, z: 0 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, heading),
  });
  const stance: IAutoMovieMotionHumanRise.Stance = {
    left: flat(0.1, 0),
    right: flat(-0.1, -10),
  };

  // 1. A raised foot.
  const raised: IAutoMovieMotionHumanFoot.IPlacement =
    AutoMovieMotionHumanRise.foot(body, "right", stance.right, 35);
  TestValidator.predicate(
    "turned about the toes' joint",
    vclose(
      HumanFoot.point(body, "right", "mtp", raised),
      HumanFoot.point(body, "right", "mtp", stance.right),
      ROUNDING,
    ) &&
      nclose(HumanFoot.pitch(raised.rotation), -35, 1e-6) &&
      nclose(HumanFoot.heading(raised.rotation), -10, 1e-6) &&
      raised.ankle.y > stance.right.ankle.y,
  );

  // 2. The lift.
  const travel = (
    side: "left" | "right",
  ): IAutoMovieMotionHumanFoot.IPlacement =>
    AutoMovieMotionHumanRise.foot(body, side, stance[side], 35);
  TestValidator.predicate(
    "the mean of the ankles' travel",
    vclose(
      AutoMovieMotionHumanRise.lift(body, stance, 35),
      AutoMovieEngineVector3.scale(
        AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.subtract(travel("left").ankle, stance.left.ankle),
          AutoMovieEngineVector3.subtract(travel("right").ankle, stance.right.ankle),
        ),
        0.5,
      ),
      ROUNDING,
    ) && AutoMovieMotionHumanRise.lift(body, stance, 35).y > 0.03,
  );

  // 3. The legs.
  const rows: IAutoMovieMotionHumanPrimitive[] = AutoMovieMotionHumanRise.legs({
    body,
    stance,
    from: 0,
    to: 1,
    degrees: (seconds: number): number => 20 * seconds,
  });
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const written: IAutoMovieMotionHumanPosture = rows[1]!.write(posture, 0.5);
  TestValidator.predicate(
    "the right row's toes and planted goal",
    rows[1]!.channels.join() === "rightLeg" &&
      written.joints.rightToes![0] === 10 &&
      written.limbs.rightLeg!.planted === true &&
      vclose(
        written.limbs.rightLeg!.point,
        AutoMovieMotionHumanRise.foot(body, "right", stance.right, 10).ankle,
        ROUNDING,
      ),
  );
}
