import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanLunge,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropHold,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanLungeChange } from "./HumanLungeChange";
import { HumanLungeHands } from "./HumanLungeHands";
import { HumanLungePivot } from "./HumanLungePivot";
import { HumanLungeStance } from "./HumanLungeStance";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRideHands } from "./HumanRideHands";

/*
 * Lunge a horse from the circle's centre (`IAutoMovieMotionHumanLunge`): the
 * handler turns on the spot to face the horse's root as it circles, the line
 * hand on the lunge line where the horse's ride lays it and the whip hand low
 * and aimed at the quarters.
 *
 * The pelvis faces the horse's bearing from the centre between the feet at
 * every second, turning to it from the entry's heading over `transition`; the
 * feet pivot round that centre in steps (`HumanLungePivot`), each foot's ankle
 * and sole turned about the centre on a minimum-jerk share and lifted on a
 * half-sine of `LIFT` of stature while it swings, and the legs reach them
 * through the stance's leg goals (`StrikingStance.legs`). The line hand closes
 * on the horse's line contact as a lead is held (`HumanRideHands`,
 * `HumanMountRider.hold`), the palm on the line; the whip hand holds the whip
 * out to its side at hip height, its shaft turned toward the quarters from the
 * bearing and below level (`HumanLungeHands.whip`). At a change of rein the
 * hands change over (`HumanLungeChange`): the whip hand comes to the line and
 * closes beside the line hand, the line hand takes the whip from it, and each
 * goes out to its new side as the horse's ride carries the line over. Both arms
 * are laid on one planned course (`courseArmGoal`). A pivot step takes two of
 * `step.period`'s swings, one per foot.
 */
export const HumanLunge: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLunge> =
  {
    name: "lungeHorse",
    interrupts: {},
    plan: planHumanLunge,
  };

/*
 * The law's context.
 */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLunge>;

/*
 * Admit the lunge, plan the pivot steps on the horse's bearing, and sample.
 */
function planHumanLunge(context: Context): IAutoMovieMotionHumanActionPlan {
  const {
    on,
    line,
    point = "lead",
    whip,
    change,
    duration: seconds,
    transition,
  } = context.params;
  if (
    !(transition > 0 && 2 * transition < seconds)
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "transition",
      value: transition,
      feasible: null,
      reason: "a lunge needs positive take-up, hold and let-go intervals",
      fix: "Give a transition shorter than half the total seconds.",
    });
  const support: IAutoMovieMotionHumanPropReader = context.prop(on);
  const rope: IAutoMovieAffordance | undefined = support.prop.affordances?.find(
    (contact: IAutoMovieAffordance): boolean => contact.id === point,
  );
  if (
    rope?.kind !== "rein" ||
    rope.symmetry !== "round" ||
    !(rope.aperture! > 0)
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "point",
      value: point,
      feasible: null,
      reason: `${on}.${point} does not describe a round line with an actual aperture`,
      fix: "Name the horse's lunge line contact.",
    });
  HumanLungeChange.admit(change, whip !== undefined, transition, seconds);
  const other: AutoMovieHumanSide = line === "left" ? "right" : "left";
  if (whip !== undefined) context.prop(whip);
  const body: Context["body"] = context.body;
  const {
    centre,
    schedule,
    at: stance,
  }: HumanLungeStance.IStance = HumanLungeStance(
    context,
    support,
    seconds,
    transition,
  );

  const timeline: HumanLungeChange.ITimeline = {
    line,
    other,
    transition,
    seconds,
    ...(change === undefined ? {} : { change }),
  };
  const hands: readonly AutoMovieHumanSide[] =
    whip === undefined ? [line] : [line, other];
  const first: HumanRideHands.IHands = HumanRideHands(
    {
      ...context,
      params: { on, duration: seconds, hands: { [line]: point } },
    },
    on,
    support,
    stance(0),
    support.frame(context.start),
    transition,
  );
  // The other hand takes the line at the change: the side its fingers close over and their closure are read where it takes it, not where the first hand took it.
  const taking: number | undefined =
    change === undefined ? undefined : change + transition;
  const second: HumanRideHands.IHands | undefined =
    taking === undefined
      ? undefined
      : HumanRideHands(
          {
            ...context,
            start: context.start + taking,
            params: {
              on,
              duration: seconds - taking,
              hands: { [other]: point },
            },
          },
          on,
          support,
          stance(taking),
          support.frame(context.start + taking),
          transition,
        );
  const gripsAt = (
    film: number,
    frame: IAutoMovieRigidTransform,
  ): ReturnType<HumanRideHands.IHands["gripsAt"]> => ({
    ...first.gripsAt(film, frame),
    ...(second?.gripsAt(film, frame) ?? {}),
  });
  const closures: HumanRideHands.IHands["closures"] = {
    ...first.closures,
    ...(second?.closures ?? {}),
  };
  const windows: HumanLungeChange.IWindows = HumanLungeChange.windows(
    timeline,
    on,
    whip,
  );
  const onShare: number = transition / seconds;
  const offShare: number = 1 - onShare;
  const events: IAutoMovieMotionEvent[] = [
    { name: "lineOn", share: onShare },
    { name: "lineOff", share: offShare },
    ...(change === undefined
      ? []
      : [
          { name: "changeHands", share: change / seconds },
          {
            name: "whipPassed",
            share: (change + 2 * transition) / seconds,
          },
        ]),
    ...schedule.steps.map(
      (pivot: HumanLungePivot.IStep, k: number): IAutoMovieMotionEvent => ({
        name: `pivot${k + 1}`,
        share: pivot.start / seconds,
      }),
    ),
  ];
  // The law's goals: each hand on the line or aiming the whip as the timeline has it, the fingers closing on the line and opening over the transitions.
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration: seconds,
    events,
    contacts: [
      ...windows.contacts,
      ...HumanLungeHands.plants(schedule, seconds),
    ],
    hands,
    holds: windows.holds.map(
      (hold: IAutoMovieMotionPropHold): IAutoMovieMotionPropHold =>
        hold.side === other
          ? {
              ...hold,
              ...(context.entry.uses[other] === undefined
                ? {}
                : { use: context.entry.uses[other] }),
            }
          : { ...hold, fingers: closures[line] ?? {} },
    ),
    posture(
      at,
      _channels,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture {
      const time: number = Math.max(0, Math.min(seconds, at));
      const shown: IAutoMovieMotionHumanPosture = stance(time);
      const film: number = context.start + time;
      const horse: IAutoMovieRigidTransform = support.frame(film);
      const grips: ReturnType<HumanRideHands.IHands["gripsAt"]> = gripsAt(
        film,
        horse,
      );
      const out: IAutoMovieVector3 = AutoMovieEngineVector3.normalize({
        x: horse.position.x - centre.x,
        y: 0,
        z: horse.position.z - centre.z,
      });
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
        ...shown.limbs,
      };
      const fingers: IAutoMovieMotionHumanPosture["joints"] = {};
      for (const side of hands) {
        const target: HumanLungeChange.ITarget = HumanLungeChange.target(
          timeline,
          side,
          time,
        );
        const aim: HumanRideHands.IMaterialGrip = HumanLungeHands.whip(
          body,
          shown,
          side,
        );
        const onLine: HumanRideHands.IMaterialGrip | undefined = grips[side];
        const grip: HumanRideHands.IMaterialGrip =
          onLine === undefined
            ? aim
            : HumanLungeChange.grip(onLine, aim, target, out);
        const held: IAutoMovieMotionHumanMountRider.IHoldResult =
          HumanMountRider.hold(
            body,
            side,
            shown,
            grip,
            1,
            {},
            resolution,
            projection,
          );
        limbs[`${side}Arm`] = held.arm;
        const share: number = HumanLungeChange.closing(timeline, side, time);
        for (const [bone, closed] of Object.entries(closures[side] ?? {})) {
          const open: readonly [number, number, number] = shown.joints[
            bone as AutoMovieHumanoidBone
          ] ?? [0, 0, 0];
          // The whip hand's own closure is the one it entered with; the first hand keeps the line's on the whip.
          const weight: number = (side === line ? 1 : target.line) * share;
          fingers[bone as AutoMovieHumanoidBone] = [
            open[0] + (closed[0] - open[0]) * weight,
            open[1] + (closed[1] - open[1]) * weight,
            open[2] + (closed[2] - open[2]) * weight,
          ];
        }
      }
      const posture: IAutoMovieMotionHumanPosture = {
        ...shown,
        limbs,
        joints: { ...shown.joints, ...fingers },
      };
      return posture;
    },
  };

  // Both arms reach, hold and let go on one planned course.
  const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    plan: goals,
    side: line,
    span: {
      start: 0,
      ready: transition,
      relax: seconds - transition,
      end: seconds,
    },
    ...(whip === undefined
      ? {}
      : {
          with: [
            {
              side: other,
              rest: AutoMovieMotionHumanArm.angles(context.entry.pose, other),
            },
          ],
        }),
  });

  // The displayed hand, as the course lays it, must lie on the line wherever a hand fully holds it.
  const shown: IAutoMovieMotionHumanActionPlan = {
    ...coursed,
    goals,
    posture(
      at,
      channels,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture {
      const posture: IAutoMovieMotionHumanPosture = coursed.posture(
        at,
        channels,
        resolution,
        projection,
      );
      const time: number = Math.max(0, Math.min(seconds, at));
      const film: number = context.start + time;
      const horse: IAutoMovieRigidTransform = support.frame(film);
      const grips: ReturnType<HumanRideHands.IHands["gripsAt"]> = gripsAt(
        film,
        horse,
      );
      const out: IAutoMovieVector3 = AutoMovieEngineVector3.normalize({
        x: horse.position.x - centre.x,
        y: 0,
        z: horse.position.z - centre.z,
      });
      for (const side of hands) {
        const target: HumanLungeChange.ITarget = HumanLungeChange.target(
          timeline,
          side,
          time,
        );
        const onLine: HumanRideHands.IMaterialGrip | undefined = grips[side];
        if (
          onLine === undefined ||
          target.line < 1 ||
          HumanLungeChange.closing(timeline, side, time) < 1 ||
          !HumanLungeChange.holds(timeline, side, time)
        )
          continue;
        HumanLungeHands.verify(
          body,
          side,
          posture,
          HumanLungeChange.grip(onLine, onLine, target, out),
          `${on}.${point}`,
          film,
          resolution,
          projection,
        );
      }
      return posture;
    },
  };
  return shown;
}
