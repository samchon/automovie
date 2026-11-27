import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmAngles } from "../../compose/internal/AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmBase } from "../../compose/internal/AutoMovieMotionHumanArmBase";
import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanArmObservation } from "../../compose/internal/AutoMovieMotionHumanArmObservation";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { HumanSegment } from "../../perform/internal/HumanSegment";
import { HumanSegmentPose } from "../../perform/internal/HumanSegmentPose";
import { prepareHumanSegmentPose } from "../../perform/internal/prepareHumanSegmentPose";
import { HumanArmClearance } from "../../posture/internal/HumanArmClearance";
import { HumanArmMirror } from "../../posture/internal/HumanArmMirror";
import { HumanArmTrajectory } from "../../posture/internal/HumanArmTrajectory";
import { HumanArmTrajectoryMirror } from "../../posture/internal/HumanArmTrajectoryMirror";
import { HumanArmTrajectoryTerms } from "../../posture/internal/HumanArmTrajectoryTerms";
import { inspectHumanArmFaceCourse } from "../../posture/internal/inspectHumanArmFaceCourse";

/** The record of `IPrepareToolPlaybackProps`'s site. */
type IPrepareToolPlaybackProps = {
  plan: IAutoMovieMotionHumanActionPlan;
  body: IAutoMovieMotionHumanBody;
  side: AutoMovieHumanSide;
  entry: IAutoMovieMotionHumanPosture;
  base: IAutoMovieMotionHumanActionPlan["posture"];
  clock: IAutoMovieMotionClock;
  fingers: IAutoMovieMotionHumanPosture["joints"];
  ready: number;
  recover: number;
  target: (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanArmTarget.ITarget;
  compose: (
    target: IAutoMovieMotionHumanArmTarget.Frame,
  ) => IAutoMovieMotionHumanActionPlan;
  finish: (
    posture: IAutoMovieMotionHumanPosture,
  ) => IAutoMovieMotionHumanPosture;
  work?: {
    contact: IAutoMovieVector3;
    speed: number;
    face(seconds: number): IAutoMovieVector3;
  };
};

/**
 * Prepare a placed stirring arm from its actual work poses and a free approach
 * and return, with one continuous course through both joins. A tool outside
 * that scope keeps its authored posture phases.
 */
export function prepareToolPlayback(props: IPrepareToolPlaybackProps): void {
  const { plan, body, side, entry, ready, recover, target, compose, finish } =
    props;
  const limb: AutoMovieHumanLimb = `${side}Arm`;
  const root: IAutoMovieVector3 = { ...entry.root };
  const frame: IAutoMovieMotionHumanPosture = { ...entry, root };
  const sameFrame = (posture: IAutoMovieMotionHumanPosture): boolean =>
    Object.is(posture.root.x, root.x) &&
    Object.is(posture.root.y, root.y) &&
    Object.is(posture.root.z, root.z) &&
    Object.is(posture.yaw, frame.yaw) &&
    Object.is(posture.pitch, frame.pitch) &&
    Object.is(posture.roll, frame.roll);

  let fixed: IAutoMovieMotionHumanArmTarget.ITarget | undefined;
  const prepared: IAutoMovieMotionHumanActionPlan = compose(
    (posture, seconds) => {
      if (!sameFrame(posture)) return target(posture, seconds);
      if ((seconds <= ready || seconds >= recover) && fixed !== undefined)
        return {
          ...fixed,
          point: { ...fixed.point },
          rotation: { ...fixed.rotation },
          bend: { ...fixed.bend },
        };
      return target(posture, seconds);
    },
  );
  // The admitted writer supplies the arm after the original display offset.
  // Before that writer is installed the original sample supplies the observed
  // poses the preparation uses.
  const sample: IAutoMovieMotionHumanPlayback.IPhase["sample"] = (
    ...args: Parameters<IAutoMovieMotionHumanPlayback.IPhase["sample"]>
  ): IAutoMovieMotionHumanPlayback.ISample => {
    if (plan.playback?.placed === undefined)
      return {
        posture: finish(prepared.posture(args[0], undefined, args[2], args[3])),
      };
    const posture = props.base(args[0], undefined, args[2], args[3]);
    const limbs = { ...posture.limbs };
    delete limbs[limb];
    return {
      posture: {
        ...posture,
        limbs,
        joints: { ...posture.joints, ...props.fingers },
      },
    };
  };
  HumanPreparedPlayback.attach(plan, body, {
    mode: "posture",
    prepare: (): void => {
      fixed = target(frame, ready);
    },
    ...(props.work === undefined
      ? {}
      : { preparePlaced: (person, segment) => course(props, person, segment) }),
    phases: [
      { from: 0, to: ready, sample },
      { from: ready, to: recover, sample },
      { from: recover, to: plan.duration, sample },
    ],
  });
}

/** One real displayed pose and the work constraint it carries at its second. */
interface IWaypoint {
  pose: IAutoMoviePose;
  goal: IAutoMovieHumanLimbGoal;
  site: HumanArmTrajectory.ISite | undefined;
}

/** Lay the native course and refine only intervals with a measured face miss. */
function course(
  props: IPrepareToolPlaybackProps,
  person: IAutoMovieMotionHumanSegment.IPerson,
  segment: IAutoMovieMotionHumanSegment,
): IAutoMovieMotionHumanPlayback.Placed | undefined {
  const { body, side, ready, recover, clock, plan, work } = props;
  const tool = plan.wields;
  if (
    work === undefined ||
    tool?.side !== side ||
    !HumanSegment.drives(plan, side) ||
    segment.context.carrier !== undefined ||
    segment.entryTime !== segment.start ||
    segment.end !== segment.start + plan.duration ||
    person.layers.length !== 0 ||
    person.overlays.length !== 0 ||
    person.stops.size !== 0 ||
    (segment.transition !== undefined &&
      segment.transition.kind !== "redirect" &&
      segment.transition.cut + segment.transition.blend >
        segment.start + ready) ||
    person.holds.some(
      (hold) =>
        hold.source !== segment &&
        hold.from <= segment.end &&
        segment.entryTime <= hold.until + HumanSegment.FADE &&
        (hold.side !== side || hold.prop !== tool.prop),
    )
  )
    return undefined;
  const prepared = prepareHumanSegmentPose(body);
  const limb: AutoMovieHumanLimb = `${side}Arm`;
  const times = AutoMovieMotionHumanArmCourse.grid({
    start: 0,
    ready,
    relax: recover,
    end: plan.duration,
    knots: clock.instants.map((event) => event.seconds),
  });
  const waypoints = new Map<number, IWaypoint>();
  const at = (seconds: number): IWaypoint => {
    const existing = waypoints.get(seconds);
    if (existing !== undefined) return existing;
    const goal = plan.posture(
      seconds,
      [limb],
      prepared.resolution,
      prepared.clamp,
    ).limbs[limb];
    if (goal === undefined || goal.on !== undefined)
      throw new HumanRefusal({
        kind: "reach",
        axis: "on",
        value: seconds,
        reason: "the tool's working face has no fixed world goal",
        fix: "place the work on a stationary support",
      });
    const pose = HumanSegmentPose(
      person,
      segment,
      segment.start + seconds,
      prepared,
    );
    const target =
      seconds < ready || seconds > recover
        ? undefined
        : AutoMovieMotionHumanArmObservation.site(
            body,
            pose,
            { side, disc: 0 },
            goal,
          );
    const site =
      target === undefined
        ? undefined
        : {
            ...target,
            limits: [
              ...(target.limits ?? []),
              {
                contact: target.contact,
                bound: HumanArmTrajectoryTerms.TOLERANCE / 1000,
              },
            ],
          };
    const point: IWaypoint = { pose, goal, site };
    waypoints.set(seconds, point);
    return point;
  };
  const rest = AutoMovieMotionHumanArmAngles.angles(at(0).pose, side);
  const back = AutoMovieMotionHumanArmAngles.angles(
    at(plan.duration).pose,
    side,
  );
  const lay = (clockTimes: readonly number[]): HumanArmTrajectory.IAdmitted => {
    const knots = clockTimes.map(at);
    const problem: HumanArmTrajectory.IProblem = {
      body,
      times: clockTimes,
      arms: [{ side, rest, back, sites: knots.map(({ site }) => site) }],
      bases: knots.map(({ pose, goal, site }) =>
        AutoMovieMotionHumanArmBase(pose, [goal], [site !== undefined]),
      ),
      share: (seconds) =>
        clock.progress("reaching", "ready", seconds) -
        clock.progress("recover", "end", seconds),
    };
    const laid = HumanArmTrajectory.admitted(problem, [
      knots.map(({ pose, site }) =>
        site === undefined
          ? undefined
          : AutoMovieMotionHumanArmAngles.angles(pose, side),
      ),
    ]);
    if (!laid.admitted) {
      const worst = laid.read.evaluation!.worst;
      const refusal = new HumanRefusal({
        kind: "reach",
        axis: worst.axis,
        value: worst.value,
        reason: worst.what,
        fix: "put the work where the tool can reach and leave it with the arm clear",
      });
      throw side === "left"
        ? HumanArmTrajectoryMirror.refusal(refusal)
        : refusal;
    }
    return laid;
  };
  const mirrored = side === "left";
  const contact = mirrored ? HumanArmMirror.flip(work.contact) : work.contact;
  const face = mirrored
    ? (seconds: number): IAutoMovieVector3 =>
        HumanArmMirror.flip(work.face(seconds))
    : work.face;
  const inspect = (
    laid: HumanArmTrajectory.IAdmitted,
  ): ReturnType<typeof inspectHumanArmFaceCourse> =>
    inspectHumanArmFaceCourse({
      course: laid,
      rates: laid.read.rates!,
      ready,
      recover,
      contact,
      target: face,
      targetSpeed: work.speed,
    });
  let knots: readonly number[] = times;
  let laid = lay(knots);
  let checked = inspect(laid);
  while (checked.misses.length !== 0) {
    knots = [...knots, ...checked.misses].sort((a, b) => a - b);
    // Inserting a position changes the shared derivatives, so reread every
    // contact and swept constraint on the rebuilt course.
    laid = lay(knots);
    checked = inspect(laid);
  }
  if (checked.unsupported === true) return undefined;
  const unresolved = checked.uncertain;
  if (unresolved !== undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "on",
      value: unresolved.time,
      reason:
        unresolved.metres === undefined
          ? `the prepared tool face could not be certified within ${HumanArmTrajectoryTerms.TOLERANCE} mm of its work throughout the stroke`
          : `the prepared tool face misses its work by ${(unresolved.metres * 1000).toFixed(2)} mm at ${unresolved.time.toFixed(3)} s`,
      fix: "put the work within the arm's continuous reach",
    });
  const read = laid.trajectories[0]!;
  const owned = new Set<AutoMovieHumanoidBone>([
    `${side}UpperArm`,
    `${side}LowerArm`,
    `${side}Hand`,
  ]);
  return (seconds, pose, demanded): IAutoMoviePose => {
    if (
      demanded !== undefined &&
      ![...demanded].some(
        (bone) => owned.has(bone) || props.fingers[bone] !== undefined,
      )
    )
      return pose;
    const arm: IAutoMovieMotionHumanArmClearance.IArm = read(seconds);
    return HumanArmClearance.posed(pose, side, arm);
  };
}
