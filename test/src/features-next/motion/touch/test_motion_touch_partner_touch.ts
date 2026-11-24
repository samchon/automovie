import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanTouch,
} from "@automovie/motions";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanArm,
  resolveHumanPosture,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { vclose } from "../../../features/internal/vclose";

/**
 * Sample a touch's authored goal path relative to its moving surface. The
 * face is a vertical plane moving through world space, with +Z normal and
 * +Y up. Reconstruct the hand point with the wrist transform from each goal.
 *
 * Scenarios:
 * 1. Two taps touch at shares 0, 1/2 and 1. Both intervening centres lift
 *    exactly one quarter of a hand along the normal.
 * 2. Two strokes remain in the surface plane. The four sine peaks travel
 *    up and down in a 1/2, -1, 1, -1/2 pattern as the half-cycle ramps fade.
 * 3. The hold moves only with the carrier and shares those contact points
 *    at the stroke's endpoints. Retaking earlier samples gives the same
 *    actual target, and no inactive time is read from the carrier callback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the carrier frame and exact contact and extrema of the three trajectory branches.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the ordinary touch-goal seam in arbitrary time order, placing its wrist-local skin point in world space. Losing the surface's movement, exchanging tangent and lift, or using the wrong repetition or end ramp fails.
 * @evidence contracts/development/testing.md#independent-expectations The extrema of sin squared and sine give the sampled times and signs. The Flash and Hogan quintic has half amplitude at half its length. Subtracting the stated carrier and starting point cancels its rigid standoff without reading the law's output as a target.
 * @evidence contracts/development/testing.md#distinguishing-cases One representative each for normal lift, tangent travel and a still hold. The dedicated form-table test checks the different kinds' parameter assignments, and the law tests own the displayed arm and contact admission.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory test uses a polygon body, public goal closure and a defined moving frame; no trajectory optimization or host is needed to check these target curves.
 */
export function test_motion_touch_partner_touch(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: 1,
    attack: 2,
    hold: 1,
    retract: 1,
  });
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const posture: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, origin, 0);
  const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
  const arm: number = body.measure.upperArm + body.measure.forearm;
  const start: number = clock.at("strokeStart");
  const span: number = clock.at("strokeEnd") - start;
  const hand: number = body.measure.hand;
  const count: number = 2;
  /** A plane that moves one arm length along X in the stroke's duration. */
  const carrier: (seconds: number) => IAutoMovieVector3 = (
    seconds: number,
  ): IAutoMovieVector3 => ({
    x: shoulder.x + (arm * (seconds - start)) / span,
    y: shoulder.y,
    z: shoulder.z + arm / 2,
  });
  let reads: number = 0;
  /** Watch actual target demand and furnish its independently known frame. */
  const region: IAutoMovieMotionHumanTouch.ITouch["region"] = (
    _posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): ReturnType<IAutoMovieMotionHumanTouch.ITouch["region"]> => {
    ++reads;
    return { point: carrier(seconds), normal: { x: 0, y: 0, z: 1 } };
  };
  const fixed: IAutoMovieMotionHumanTouch.ITouch = {
    body,
    clock,
    side: "right",
    rest: AutoMovieMotionHumanArm.angles(
      resolveHumanPosture(body, posture),
      "right",
    ),
    effector: { surface: "palm", shape: "flat" },
    region,
    kind: "hold",
    count,
    bend: shoulder,
    entry: posture,
  };
  const offset: IAutoMovieVector3 = body.surfaces.sockets.palmRight.point;
  /** Read the actual generated effector relative to the same world carrier. */
  type Goal = IAutoMovieMotionHumanArmCarry.ICarry["goal"];
  const relative: (read: Goal, share: number) => IAutoMovieVector3 = (
    read: IAutoMovieMotionHumanArmCarry.ICarry["goal"],
    share: number,
  ): IAutoMovieVector3 => {
    const seconds: number = start + span * share;
    const wrist: IAutoMovieHumanLimbGoal = read(posture, seconds);
    const world: IAutoMovieVector3 = Vector3.add(
      wrist.point,
      Quaternion.rotateVector(wrist.rotation!, offset),
    );
    return Vector3.subtract(world, carrier(seconds));
  };

  const tap: IAutoMovieMotionHumanArmCarry.ICarry["goal"] =
    AutoMovieMotionHumanTouch.goal({ ...fixed, kind: "tap" });
  const stroke: IAutoMovieMotionHumanArmCarry.ICarry["goal"] =
    AutoMovieMotionHumanTouch.goal({ ...fixed, kind: "stroke" });
  const hold: IAutoMovieMotionHumanArmCarry.ICarry["goal"] =
    AutoMovieMotionHumanTouch.goal(fixed);
  all.check("preparing the goal reads no surface", reads === 0);
  const contact: IAutoMovieVector3 = relative(hold, 0);
  /** Check a directional excursion, using the same anatomical contact origin. */
  const at: (
    kind: IAutoMovieMotionHumanTouchForm.Kind,
    read: Goal,
    share: number,
    expected: IAutoMovieVector3,
  ) => void = (
    kind: IAutoMovieMotionHumanTouchForm.Kind,
    read: IAutoMovieMotionHumanArmCarry.ICarry["goal"],
    share: number,
    expected: IAutoMovieVector3,
  ): void => {
    const actual: IAutoMovieVector3 = Vector3.subtract(
      relative(read, share),
      contact,
    );
    all.check(
      `${kind} at ${share}: ${JSON.stringify(actual)} must follow ${JSON.stringify(expected)}`,
      vclose(actual, expected),
    );
  };
  // The authored tap amplitude is a quarter hand and the stroke amplitude
  // a fifth, as specified in the touch form contract. These coefficients
  // describe different motion quantities, normal lift and tangent travel.
  for (const share of [1 / 4, 3 / 4, 1 / 4])
    at("tap", tap, share, { x: 0, y: 0, z: hand / 4 });
  for (const share of [1, 1 / 2, 0]) at("tap", tap, share, origin);
  for (const [share, wave] of [
    [7 / 8, -1 / 2],
    [3 / 8, -1],
    [5 / 8, 1],
    [1 / 8, 1 / 2],
  ] as const)
    at("stroke", stroke, share, { x: 0, y: (wave * hand) / 5, z: 0 });
  at("stroke", stroke, 0, origin);
  at("stroke", stroke, 1, origin);
  at("hold", hold, 1, origin);
  at("hold", hold, 1 / 4, origin);
  all.check(
    "each of the 15 actual queries reads its current surface once",
    reads === 15,
  );
  // Mirror the carrier itself, independently of the hand pose. A palm hold
  // must take its translation from that frame at this actual query time.
  const mirrored = AutoMovieMotionHumanTouch.goal({
    ...fixed,
    region: (_p, t) => {
      const world = carrier(t);
      return { point: { ...world, x: -world.x }, normal: { x: 0, y: 0, z: 1 } };
    },
  });
  const t = start + span / 2;
  const mirrorWrist = mirrored(posture, t);
  const mirrorPalm = Vector3.add(
    mirrorWrist.point,
    Quaternion.rotateVector(mirrorWrist.rotation!, offset),
  );
  const ordinary = hold(posture, t);
  const ordinaryPalm = Vector3.add(
    ordinary.point,
    Quaternion.rotateVector(ordinary.rotation!, offset),
  );
  all.check(
    "a reflected carrier reflects only the target coordinate",
    Math.abs(mirrorPalm.x + ordinaryPalm.x) <= 1e-9 &&
      Math.abs(mirrorPalm.y - ordinaryPalm.y) <= 1e-9 &&
      Math.abs(mirrorPalm.z - ordinaryPalm.z) <= 1e-9,
  );
  all.assert(
    "touch paths use only the requested sample of their moving surface",
  );
}
