import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSwipeTouchscreen,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanGrip } from "../handling/HumanGrip";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";

/**
 * The mean touch-in to touch-out time in seconds for a single-finger swipe
 * (Jeong, Table 2.6).
 */
const SWIPE_SECONDS: number = 0.2851;
/**
 * The normalized endpoint tolerance used by HumanSegmentEntry and
 * HumanSegmentCut.
 */
const CONTACT_SHARE_TOLERANCE: number = 1e-9;

/**
 * Resolve the screen and compose an index fingertip stroke over the held entry
 * stance.
 *
 * @param context Entry posture, prop reader and normalized screen endpoints.
 * @returns The composed stroke plan and its unloaded hand contact window.
 * @throws {HumanRefusal} On invalid hand, endpoints or duration, a screen
 *   without a width, a movable or articulated screen, or a wrist path outside
 *   geometric reach.
 */
function planSwipeTouchscreen(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSwipeTouchscreen>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params, start } = context;
  const side: AutoMovieHumanSide = params.hand ?? "right";
  const held: string | undefined = entry.holds[side];
  if (
    held !== undefined ||
    entry.supports.some((support): boolean => support.part === `${side}Hand`)
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "hand",
      value: side,
      reason:
        held === undefined
          ? `The ${side} hand is supporting the entry stance`
          : `The ${side} hand already holds ${held}`,
      fix: "release the hand contact before the swipe or choose the other hand",
    });
  const from: number = HumanBound.within("from", params.from, -0.5, 0.5);
  const to: number = HumanBound.within("to", params.to, -0.5, 0.5);
  HumanBound.above("swipe distance", Math.abs(from - to), 0, "width");
  const seconds: number = HumanBound.above(
    "duration",
    params.duration ?? SWIPE_SECONDS,
    0,
    "s",
  );
  const read: IAutoMovieMotionHumanPropReader = context.prop(params.prop);
  const screen: IAutoMovieAffordance | undefined = read.prop.affordances?.find(
    (a: IAutoMovieAffordance): boolean => a.id === params.screen,
  );
  if (
    screen?.kind !== "surface" ||
    screen.width === undefined ||
    !Number.isFinite(screen.width) ||
    screen.width <= 0 ||
    screen.rides !== undefined ||
    screen.frame.scale.x !== 1 ||
    screen.frame.scale.y !== 1 ||
    screen.frame.scale.z !== 1 ||
    read.prop.fixed !== true ||
    read.prop.motion !== undefined ||
    read.prop.soft !== undefined ||
    read.prop.worn !== undefined ||
    read.prop.mounted !== undefined
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "screen",
      value: `${params.prop}.${params.screen}`,
      reason:
        "a swipe needs a stationary fixture with an unscaled rigid surface of positive width",
      fix: "stage a fixed touchscreen with a unit-scale surface affordance and width",
    });

  const width: number = screen.width;
  const frame: IAutoMovieRigidTransform = read.frame(start);
  const screenRotation: IAutoMovieQuaternion = Quaternion.multiply(
    frame.rotation,
    screen.frame.rotation,
  );
  const center: IAutoMovieVector3 = world(frame, screen.frame.translation);
  const site = (share: number): IAutoMovieVector3 =>
    Vector3.add(
      center,
      Quaternion.rotateVector(screenRotation, {
        x: share * width,
        y: 0,
        z: 0,
      }),
    );
  const first: IAutoMovieVector3 = site(from);
  const last: IAutoMovieVector3 = site(to);
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(screenRotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(screenRotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  const bones: ReturnType<typeof poseBones> = poseBones(body, entry.pose);
  const tip: IAutoMovieVector3 = HumanHand.frame(
    body,
    bones,
    side,
    "indexTip",
  ).point;
  const entryWrist: IAutoMovieVector3 = bones.get(`${side}Hand`)!.worldPosition;
  if (
    Vector3.dot(Vector3.subtract(tip, center), normal) <= 0 ||
    Vector3.dot(Vector3.subtract(entryWrist, center), normal) <= 0
  )
    throw new HumanRefusal({
      kind: "reach",
      axis: "screen",
      value: `${params.prop}.${params.screen}`,
      reason: "the hand must start on the outward side of the screen",
      fix: "stage the performer in front of the display",
    });
  const handOrigin: IAutoMovieMotionHumanArmTarget.IOrigin =
    AutoMovieMotionHumanArm.origin(
      body,
      bones,
      { origin: entry.posture.root, yaw: entry.posture.yaw },
      side,
      "wrist",
    );

  // The stroke's goal is evaluated with the point shape. Its zero-weight
  // origin therefore needs that shape's tip offset from the entry wrist.
  const origin: IAutoMovieMotionHumanArmTarget.IOrigin = {
    ...handOrigin,
    point: Vector3.add(
      handOrigin.point,
      Quaternion.rotateVector(
        handOrigin.rotation,
        HumanHand.offset(body, side, "indexTip", "point").point,
      ),
    ),
  };
  const rest: IAutoMovieVector3 = AutoMovieMotionHumanArm.point(
    entry.posture,
    origin,
  );
  const tempo: number = context.tempo ?? 1;
  const travel = (point: IAutoMovieVector3): number =>
    tempo *
    AutoMovieMotionHumanTiming.transport(
      Vector3.length(Vector3.subtract(point, rest)),
    );
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: travel(first),
    attack: (tempo * seconds) / 2,
    follow: (tempo * seconds) / 2,
    retract: travel(last),
  });
  const touchIn: number = clock.at("strokeStart");
  const touchOut: number = clock.at("strokeEnd");
  const moves = (from: string, to: string): boolean => {
    const a: number = start + clock.at(from);
    const b: number = start + clock.at(to);
    const middle: number = a + (b - a) / 2;
    const progress: number = clock.progress(from, to, middle - start);
    return a < middle && middle < b && 0 < progress && progress < 1;
  };
  if (
    !(
      moves("start", "ready") &&
      moves("strokeStart", "strokeEnd") &&
      moves("relax", "end") &&
      touchOut / clock.duration < 1 - CONTACT_SHARE_TOLERANCE
    )
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "duration",
      value: seconds,
      reason:
        "the clock must distinguish reach, screen contact and complete withdrawal",
      fix: "choose a contact duration that preserves the reach and withdrawal on the film clock",
    });
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    clock.duration,
  );
  const target: IAutoMovieMotionHumanArmTarget.ITarget =
    AutoMovieMotionHumanTarget.hand(
      body,
      entry.posture,
      side,
      { point: Vector3.lerp(first, last, 0.5), normal },
      { surface: "indexTip", shape: "point", forward },
    );

  // With a fixed hand rotation, the wrist runs the same line as the tip.
  const wrist: IAutoMovieVector3 = HumanHand.place(
    body,
    side,
    target.surface,
    first,
    target.rotation,
    target.shape,
  ).point;
  const shoulder: IAutoMovieVector3 = bones.get(
    `${side}UpperArm`,
  )!.worldPosition;
  const nearStart: IAutoMovieVector3 = Vector3.subtract(wrist, shoulder);
  const run: IAutoMovieVector3 = Vector3.subtract(last, first);
  const length: number = Vector3.length(run);
  HumanBound.above("swipe distance", length, 0, "m");
  const axis: IAutoMovieVector3 = Vector3.normalize(run);
  const nearest: number = Math.max(
    0,
    Math.min(length, -Vector3.dot(nearStart, axis)),
  );
  const closest: number = Vector3.length(
    Vector3.add(nearStart, Vector3.scale(axis, nearest)),
  );
  const farthest: number = Math.max(
    Vector3.length(nearStart),
    Vector3.length(Vector3.add(nearStart, run)),
  );
  const { upperArm, forearm } = body.measure;
  if (farthest > upperArm + forearm || closest < Math.abs(upperArm - forearm))
    throw new HumanRefusal({
      kind: "reach",
      axis: "screen",
      value: `${params.prop}.${params.screen}`,
      reason: `The ${side} wrist needs ${Math.round(closest * 1000)} to ${Math.round(farthest * 1000)} mm of reach from its shoulder for this swipe`,
      fix: "place the screen and stance so the acting hand can reach the full swipe",
    });

  const elbow: IAutoMovieVector3 = bones.get(`${side}LowerArm`)!.worldPosition;
  const weight = (seconds: number): number =>
    clock.envelope(["start", "ready"], ["relax", "end"], seconds);
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.stroke({
    body,
    clock,
    side,
    origin,
    path: (
      _: IAutoMovieMotionHumanPosture,
      elapsed: number,
      progress: number,
    ): IAutoMovieMotionHumanArmTarget.ITarget => ({
      ...target,
      point: Vector3.lerp(first, last, progress),
      bend: Vector3.lerp(elbow, target.bend, weight(elapsed)),
    }),
  });
  const entryFingers: IAutoMovieMotionHumanPosture["joints"] =
    HumanGrip.fingers(entry.pose, side);
  const pointing: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    side,
    "point",
  );
  const digits: AutoMovieHumanoidBone[] = Object.keys(
    pointing,
  ) as AutoMovieHumanoidBone[];
  const swipe: IAutoMovieMotionHumanPrimitive = {
    ...arm,
    write: (
      posture: IAutoMovieMotionHumanPosture,
      elapsed: number,
      before?: (seconds: number) => IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => {
      const share: number = weight(elapsed);
      if (share === 0) return posture;
      const moved: IAutoMovieMotionHumanPosture = arm.write(
        posture,
        elapsed,
        before,
      );
      if (share === 1) return moved;
      for (const digit of digits) {
        const flexed: readonly [number, number, number] = entryFingers[
          digit
        ] ?? [0, 0, 0];
        const pointed: readonly [number, number, number] = pointing[digit]!;
        moved.joints[digit] = [
          flexed[0] + (pointed[0] - flexed[0]) * share,
          flexed[1] + (pointed[1] - flexed[1]) * share,
          flexed[2] + (pointed[2] - flexed[2]) * share,
        ];
      }
      return moved;
    },
  };
  const plan: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      contact: "stroke",
      primitives: [swipe],
    });
  return {
    ...plan,
    contacts: [
      ...plan.contacts,
      {
        kind: "bear",
        part: `${side}Hand`,
        region: side === "left" ? "indexTipLeft" : "indexTipRight",
        load: 0,
        support: { kind: "prop", subject: params.prop },
        from: touchIn / clock.duration,
        to: touchOut / clock.duration,
      },
    ],
  };
}

/**
 * One fingertip reaches a named touchscreen, swipes in its local X direction
 * and withdraws. `strokeStart` is touch-in, `strokeEnd` (also `relax`) is
 * touch-out. The hand returns to its entry pose at full duration. The stroke
 * takes 285.1 ms by default, the mean touch-in to touch-out duration from Jeong
 * and Liu (2017, doi:10.1080/00140139.2017.1313457). Jeong reports the measured
 * mean in Table 2.6 of his dissertation. The shared transport rule times the
 * reach and withdrawal. The contact carries no weight. The screen belongs to a
 * stationary fixture and the body keeps its entry stance. Stage a free hand in
 * front of the glass and within reach of the entire stroke. The next action can
 * cut in once the hand has withdrawn.
 */
export const swipeTouchscreen: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSwipeTouchscreen> =
  {
    name: "swipeTouchscreen",
    interrupts: {
      any: [{ window: [1, 1], kind: "inertialize", entry: 0 }],
    },
    plan: planSwipeTouchscreen,
  };

/** Put a prop-local point, in metres, into its displayed world frame. */
function world(
  frame: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, point),
  );
}
