import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStageBladeFootwork,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionInterval } from "../../compose/internal/AutoMovieMotionInterval";
import { HumanPostureRaw } from "../../posture/internal/HumanPostureRaw";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { StrikingStance } from "../../striking/internal/StrikingStance";
import { stageBladeFootworkSchedule } from "./stageBladeFootworkSchedule";

/*
 * Shift a performer's stance between two floor marks on a blade set. A fenced
 * stage uses lifted steps, the kendo profile moves the travelling foot along
 * the floor, and an armoured cast can use a deliberate cadence. These are
 * screen-blocking profiles. A prop cue belongs to the editor's clock
 * independently of footholds. Props remain attached by the normal grip owner.
 */
export const stageBladeFootwork: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStageBladeFootwork.IParams> =
  {
    name: "stageBladeFootwork",
    interrupts: {
      any: [{ window: [0.92, 1], kind: "inertialize", entry: 0, blend: 0.12 }],
    },
    plan,
  };

/*
 * A stage foot selected in the leading or following path.
 */
type Side = AutoMovieHumanSide;

/*
 * Resolve the parameters once and transport the carried upper posture over the
 * same floor frame as the two foot paths.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStageBladeFootwork.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const params: IAutoMovieMotionHumanStageBladeFootwork.IParams =
    context.params;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const feet: typeof context.entry.feet = context.entry.feet;
  const stature: number = body.measure.stature;
  const schedule: stageBladeFootworkSchedule.ISchedule =
    stageBladeFootworkSchedule(params, body.measure, entry.yaw, feet);
  const { profile, duration, first, travel, clock } = schedule;
  const firstPath: AutoMovieMotionInterval.IPrepared =
    AutoMovieMotionClock.prepare(clock, "firstLift", "firstSettle");
  const followingPath: AutoMovieMotionInterval.IPrepared =
    AutoMovieMotionClock.prepare(clock, "followLift", "followSettle");
  return {
    duration,
    events: clock.events(),
    contacts: schedule.contacts,
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const initial: number = firstPath.progress(seconds);
      const next: number = followingPath.progress(seconds);
      const left: number = first === "left" ? initial : next;
      const right: number = first === "right" ? initial : next;
      const placed: Record<Side, IAutoMovieMotionHumanFoot.IPlacement> = {
        left: placement(feet.left, travel, left, profile.lift * stature),
        right: placement(feet.right, travel, right, profile.lift * stature),
      };
      const root: IAutoMovieVector3 = Vector3.add(
        entry.root,
        Vector3.scale(travel, (left + right) / 2),
      );

      // Fit the root height against both placements to keep their reach
      // limit continuous as a travelling foot becomes a plant.
      const lower: IAutoMovieMotionHumanPosture = lowerHumanPosture(body, {
        ...entry,
        root,
        limbs: StrikingStance.legs(body, placed),
      });
      const upper: IAutoMovieMotionHumanPosture = HumanPostureRaw.translated(
        entry,
        lower.root,
      );
      const [flexion, abduction, twist] = upper.joints.spine ?? [0, 0, 0];
      const travelFlexion: number =
        profile.follow * (pulse(initial) + pulse(next));
      return {
        ...upper,
        joints: {
          ...upper.joints,
          spine: [flexion + travelFlexion, abduction, twist],
        },
        limbs: {
          ...upper.limbs,
          ...StrikingStance.legs(body, placed, {
            left: settled(left),
            right: settled(right),
          }),
        },
      };
    },
  };
}

/*
 * The lifted swing or low glide from a displayed entry footprint.
 */
function placement(
  foot: IAutoMovieMotionHumanFoot.IPlacement,
  travel: IAutoMovieVector3,
  progress: number,
  lift: number,
): IAutoMovieMotionHumanFoot.IPlacement {
  const ankle: IAutoMovieVector3 = Vector3.add(
    foot.ankle,
    Vector3.scale(travel, progress),
  );
  return {
    ankle: { ...ankle, y: ankle.y + lift * pulse(progress) },
    rotation: foot.rotation,
  };
}

/*
 * A travel envelope that starts and settles at zero.
 */
function pulse(progress: number): number {
  return 4 * progress * (1 - progress);
}

/*
 * A clamped travel progress is at its plant before or after its moving phase.
 */
function settled(progress: number): boolean {
  return progress === 0 || progress === 1;
}
