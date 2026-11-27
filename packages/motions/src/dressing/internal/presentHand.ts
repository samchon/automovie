import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPresentHand,
  IAutoMovieVector3,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";
import { AutoMovieMotionHumanArmPhrase } from "../../compose/internal/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { motionHumanTiming } from "../../compose/internal/motionHumanTiming";
import { composeMotionHumanAction } from "../../compose/internal/composeMotionHumanAction";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { presentHandPlace } from "./presentHandPlace";

/*
 * Present a hand to a partner. The palm goes, palm down and fingers forward, to
 * the place the arm reaches with the upper arm hanging and the forearm level
 * ahead (`presentHandPlace`): inward of the shoulder's half width, the upper
 * arm's length below it, the forearm and half the hand ahead of it, all from
 * the body's own measure; it stays the authored seconds and returns. The arm is
 * laid as one course (`courseArmGoal`). Events: `ready` once presented, `relax`
 * as it starts back.
 */
export const presentHand: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPresentHand> =
  {
    name: "presentHand",
    interrupts: {},
    plan: planPresentHand,
  };

/*
 * Present a hand to a partner. The palm goes, palm down and fingers forward, to
 * the place the arm reaches with the upper arm hanging and the forearm level
 * ahead (`presentHandPlace`): inward of the shoulder's half width, the upper
 * arm's length below it, the forearm and half the hand ahead of it, all from
 * the body's own measure; it stays the authored seconds and returns. The arm is
 * laid as one course (`courseArmGoal`). Events: `ready` once presented, `relax`
 * as it starts back.
 */
function planPresentHand(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPresentHand>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanPresentHand = context.params;
  HumanBound.above("hold", p.hold, 0, "s");
  const body: IAutoMovieMotionHumanBody = context.body;
  const side: AutoMovieHumanSide = p.side ?? "left";
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  // The upper arm hanging and the forearm level ahead: the palm's place.
  const place: IAutoMovieVector3 = presentHandPlace(body.measure, side, {
    origin: entry.root,
    yaw: entry.yaw,
  });
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
    undefined,
    HumanHand.frameBones(body, side, "palm"),
  );
  const origin: IAutoMovieMotionHumanArmTarget.IOrigin =
    AutoMovieMotionHumanArmTarget.origin(
      body,
      bones,
      { origin: entry.root, yaw: entry.yaw },
      side,
      "palm",
    );
  const target: IAutoMovieMotionHumanArmTarget.ITarget =
    AutoMovieMotionHumanArmTarget.prepareTarget(
      body,
      side,
      "palm",
      "flat",
    )({
      point: place,
      rotation: HumanHand.facing(side, entry.yaw, {
        fingers: "forward",
        palm: "down",
      }),
      bend: AutoMovieMotionHumanBend.hang(body, entry, side),
    });
  const travel: number = motionHumanTiming.transport(
    Math.hypot(
      place.x - AutoMovieMotionHumanArmTarget.point(entry, origin).x,
      place.y - AutoMovieMotionHumanArmTarget.point(entry, origin).y,
      place.z - AutoMovieMotionHumanArmTarget.point(entry, origin).z,
    ),
  );
  const clock: IAutoMovieMotionClock = motionClock.phrase({
    prepare: travel,
    attack: 0,
    hold: p.hold,
    retract: travel,
  });
  const plan: IAutoMovieMotionHumanActionPlan =
    composeMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives: [
        {
          ...AutoMovieMotionHumanArmPhrase.visit({
            body,
            clock,
            side,
            origin,
            target: (): IAutoMovieMotionHumanArmTarget.ITarget => target,
          }),
          reads: ["root", `${side}Arm`, `${side}Hand`],
        },
      ],
      contact: "stroke",
    });
  return courseArmGoal({
    context,
    plan,
    side,
    span: {
      start: 0,
      ready: clock.at("ready"),
      relax: clock.at("relax"),
      end: clock.duration,
    },
  });
}
