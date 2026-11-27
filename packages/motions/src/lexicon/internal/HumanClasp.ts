import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanClasp,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatPose } from "./HumanUnseatPose";

/** Seconds a hand takes to reach its hold (provisional). */
const REACH: number = 0.3;

/** Admit the holds, then sample. */
function planHumanClasp(context: Context): IAutoMovieMotionHumanActionPlan {
  return plan(context);
}

/**
 * Hold on with the hands (`IAutoMovieMotionHumanClasp`): the entry posture
 * carried by its own carrier's contact, or standing where it is, while each
 * named hand reaches its hold over `REACH` and follows it: a partner's
 * displayed bone or another prop's moving contact. Register `HumanClasp` to use
 * it.
 *
 * The author gives `seconds`; the hand's reach to its hold is provisional
 * (`HumanClasp`); a handshake, a held hand.
 */
export const HumanClasp: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanClasp> =
  {
    name: "clasp",
    interrupts: { any: [{ window: [0, 1], kind: "inertialize", entry: 0 }] },
    plan: planHumanClasp,
  };

/** Admit and sample. */
function plan(context: Context): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanClasp = context.params;
  HumanBound.above("duration", params.duration, 0, "s");
  const sides: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
    (side: AutoMovieHumanSide): boolean => params[side] !== undefined,
  );
  if (sides.length === 0)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "left",
      value: undefined,
      feasible: null,
      reason: "a clasp holds on with at least one hand",
      fix: "name what the left or the right hand holds",
    });
  for (const side of sides) {
    const hold: IAutoMovieMotionHumanClasp.IHold = params[side]!;
    if ((hold.bone === undefined) === (hold.contact === undefined))
      throw new HumanRefusal({
        kind: "parameter",
        axis: side,
        value: hold,
        feasible: null,
        reason: "a hand holds either a partner's bone or a prop's contact",
        fix: "name one of bone and contact",
      });
  }
  if (params.on !== undefined && params.frame === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "frame",
      value: undefined,
      feasible: null,
      reason: "a body carried by a carrier is carried by one of its contacts",
      fix: "name the carrier contact the body sits on",
    });
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const carrier: HumanMountedFrame.Reader | undefined =
    params.on === undefined
      ? undefined
      : HumanMountedFrame(context.prop(params.on), params.on, params.frame!);
  const origin: IAutoMovieRigidTransform | undefined = carrier?.(context.start);
  const point = (side: AutoMovieHumanSide, film: number): IAutoMovieVector3 => {
    const hold: IAutoMovieMotionHumanClasp.IHold = params[side]!;
    if (hold.contact !== undefined)
      return HumanMountedFrame.contact(
        context.prop(hold.subject),
        hold.contact,
        film,
      );
    // A partner's bone is held on the body's surface (`HumanMountedFrame.partnerHold`).
    return HumanMountedFrame.partnerHold(
      context.performer(hold.subject),
      hold.bone!,
      film,
    );
  };
  const duration: number = params.duration;
  const windows: IAutoMovieMotionHumanContactWindow[] = sides.map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => {
      const hold: IAutoMovieMotionHumanClasp.IHold = params[side]!;
      return {
        part: `${side}Hand`,
        kind: "grip",
        from: Math.min(1, REACH / duration),
        to: 1,
        support:
          hold.contact !== undefined
            ? { kind: "prop", subject: hold.subject }
            : { kind: "person", subject: hold.subject, bone: hold.bone! },
      };
    },
  );
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [{ name: "held", share: Math.min(1, REACH / duration) }],
    contacts: [
      ...windows,
      ...(params.on === undefined
        ? []
        : [
            {
              part: "seat",
              kind: "seat",
              from: 0,
              to: 1,
              support: { kind: "prop", subject: params.on },
            } satisfies IAutoMovieMotionHumanContactWindow,
          ]),
    ],
    base: context.entry.base,
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      const film: number = context.start + t;
      let shown: IAutoMovieMotionHumanPosture =
        carrier === undefined
          ? entry
          : HumanMountedFrame.move(entry, origin!, carrier(film));
      for (const side of sides)
        shown = HumanUnseatPose.reach(shown, side, point(side, film), 1);
      return shown;
    },
  };
  // The arms are laid as planned courses on these holds: the reach over `REACH`, then the hold, so no instant refits them afresh.
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: Math.min(REACH, duration),
    relax: duration,
    end: duration,
  };
  const rest = (side: AutoMovieHumanSide) =>
    AutoMovieMotionHumanArm.angles(context.entry.pose, side);
  const lay = (
    plan: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanActionPlan =>
    courseArmGoal({
      context,
      plan,
      side: sides[0]!,
      rest: rest(sides[0]!),
      span,
      ...(sides.length === 2
        ? { with: [{ side: sides[1]!, rest: rest(sides[1]!), span }] }
        : {}),
    });
  // On a carrier the arms are laid in its frame, where the hold barely moves.
  return carrier === undefined
    ? lay(goals)
    : HumanMountedFrame.coursed(goals, carrier, context.start, lay);
}

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanClasp>;
