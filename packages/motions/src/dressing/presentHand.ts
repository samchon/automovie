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

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArmPhrase } from "../compose/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanBound } from "../law/HumanBound";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";

/**
 * How far out from the midline the presented hand comes, as a share of the
 * shoulder's half width (provisional: the forearm turned in, the hand before
 * the body's middle, where either of a partner's hands takes it).
 */
const INWARD: number = 0.3;

/**
 * Present a hand to a partner. The palm goes, palm down and fingers forward, to
 * the place the arm reaches with the upper arm hanging and the forearm level
 * ahead: `INWARD` of the shoulder's half width out from the midline, the upper
 * arm's length below it, the forearm and half the hand ahead of it, all from
 * the body's own measure; it stays the authored seconds and returns. The arm is
 * laid as one course (`courseArmGoal`). Events: `ready` once presented, `relax`
 * as it starts back.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the place, the hand's turn, the timing, the course and the events.
 * @evidence contracts/development/design.md#principled-representation A visit of the arm phrase to a place in the performer's own frame, laid as one course.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds only the place and the hold; transport, phrase and course are their owners'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The place is the body's measure, never a typed point.
 */
export const presentHand: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPresentHand> =
  {
    name: "presentHand",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPresentHand>,
    ): IAutoMovieMotionHumanActionPlan => {
      const p: IAutoMovieMotionHumanPresentHand = context.params;
      HumanBound.above("hold", p.hold, 0, "s");
      const body: IAutoMovieMotionHumanBody = context.body;
      const side: AutoMovieHumanSide = p.side ?? "left";
      const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
      const m: IAutoMovieMotionHumanBody["measure"] = body.measure;

      // Toward the midline (`+X` is the performer's left), the upper arm
      // hanging and the forearm level ahead: the palm's place.
      const place: IAutoMovieVector3 = HumanFrame.point(
        { origin: entry.root, yaw: entry.yaw },
        {
          x: (side === "left" ? 1 : -1) * INWARD * m.shoulderHalfWidth,
          y: m.shoulderHeight - m.upperArm - entry.root.y,
          z: m.forearm + m.hand / 2,
        },
      );
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
      const travel: number = AutoMovieMotionHumanTiming.transport(
        Math.hypot(
          place.x - AutoMovieMotionHumanArmTarget.point(entry, origin).x,
          place.y - AutoMovieMotionHumanArmTarget.point(entry, origin).y,
          place.z - AutoMovieMotionHumanArmTarget.point(entry, origin).z,
        ),
      );
      const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
        prepare: travel,
        attack: 0,
        hold: p.hold,
        retract: travel,
      });
      const plan: IAutoMovieMotionHumanActionPlan =
        composeAutoMovieMotionHumanAction({
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
    },
  };
