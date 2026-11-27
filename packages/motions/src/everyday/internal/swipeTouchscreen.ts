import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanSwipeTouchscreen,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTarget } from "../../compose/internal/AutoMovieMotionHumanTarget";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanGrip } from "../../handling/internal/HumanGrip";
import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { swipeTouchscreenScreen } from "./swipeTouchscreenScreen";
import { swipeTouchscreenStroke } from "./swipeTouchscreenStroke";

/*
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
      any: [{ window: { start: 1, end: 1 }, kind: "inertialize", entry: 0 }],
    },
    plan: planSwipeTouchscreen,
  };

/*
 * Resolve the screen and compose an index fingertip stroke over the held entry
 * stance.
 * Parameter context: Entry posture, prop reader and normalized screen endpoints.
 * Returns: The composed stroke plan and its unloaded hand contact window.
 * On invalid hand, endpoints or duration, a screen
 * without a width, a movable or articulated screen, or a wrist path outside
 * geometric reach.
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
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "hand",
      value: side,
      reason:
        held === undefined
          ? `The ${side} hand is supporting the entry stance`
          : `The ${side} hand already holds ${held}`,
      fix: "release the hand contact before the swipe or choose the other hand",
    });
  const seconds: number = swipeTouchscreenStroke.seconds(params.duration);
  const {
    center,
    first,
    last,
    normal,
    forward,
  }: swipeTouchscreenScreen.IScreen = swipeTouchscreenScreen(
    context.prop(params.prop),
    params,
    start,
  );
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
    throw new AutoMovieMotionHumanRefusal({
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
  const { clock, touchIn, touchOut, point }: swipeTouchscreenStroke.IStroke =
    swipeTouchscreenStroke({
      first,
      last,
      rest,
      seconds,
      start,
      tempo: context.tempo ?? 1,
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
    throw new AutoMovieMotionHumanRefusal({
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
      point: point(progress),
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
