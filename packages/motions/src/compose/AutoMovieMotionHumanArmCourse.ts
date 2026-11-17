import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  hingedArmSwivel,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { HumanArmSwivelClearance } from "../posture/HumanArmSwivelClearance";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanLimbFitFrame } from "../posture/HumanLimbFitFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";

/**
 * An arm group's action laid as an animation system lays a reach, an
 * effector course and an analytic limb solve at every frame, without
 * trajectory optimisation: kept when it meets every bound a solved
 * trajectory meets (`HumanArmTrajectory.admitted`), else the optimiser's
 * seed (`HumanArmTrajectory.solve`).
 *
 * On the frame grid of the span (and its `ready` and `relax`):
 *
 * - the hold: every arm's goal at the instant, each arm fitted alone on the
 *   base the planner already solved (`resolveHumanPosture.limbSeeded`), the
 *   riding arm after the one it rides, on the pose that one placed;
 * - the reach and the return: the wrist on a course from one end's wrist to
 *   the other's, laid in the trunk's frame (from the shoulder, in the
 *   chest's axes, so a trunk that travels or turns under the arm, as a
 *   walk's counter-rotation does, carries the course with it), its share
 *   minimum jerk in time (Flash and Hogan 1985), the hand's rotation from
 *   the chest's slerped on the same share, and the elbow hinted between the
 *   two ends' elbows, then moved to the nearest swivel at which the upper
 *   arm and the forearm clear the body's colliders, in closed form
 *   (`HumanArmSwivelClearance`). Where the straight course would
 *   come within `HumanArmTrajectoryTerms.REACH` (the reach the model reads
 *   a shape against a probe within) of the body without the group's arms,
 *   it bends through one via-point that reach off the nearest surface point
 *   along its outward normal (`HumanColliders.nearest`), passed at half the
 *   share by a quadratic Bezier.
 *
 * Every instant's arms are the two-bone fit of the rig (Tolani, Goswami and
 * Badler 2000, the engine's hinged articulation with its swivel kept inside
 * the joints' ranges and the forearm off the body), each fit after a
 * phase's first continuing the swivel and branch the instant before chose
 * (`IAutoMovieSwivelNear`), the per-frame coherence a game's IK keeps.
 * Timing is the law's span: a course too fast for the speed bound is not
 * admitted and goes to the optimiser, whose refusal names the time needed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the instants, the hold, the effector course with its frame, share, via-point and elbow, the fit, the admission and the fallback.
 * @evidence contracts/development/design.md#principled-representation The course is the arms' clinical triples at the planner's instants, read through the same playback as a solved trajectory.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One input record and one function, read by `AutoMovieMotionHumanArmPlanned.planned`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No bound is the course's own: the admission is the trajectory model's reading, and the via-point's reach is the model's own constant.
 */
export namespace AutoMovieMotionHumanArmCourse {
  /**
   * What the planner lends the course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and owner.
   * @evidence contracts/development/design.md#principled-representation The planner's own readers of one group over one span.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members the course reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reader is the planner's, so the course and the optimiser read one problem.
   */
  export interface IProps {
    /** The body. */
    body: IHumanBody;

    /** The span's instants, seconds. */
    span: { start: number; ready: number; relax: number; end: number };

    /** Each arm's side, rest, return and the bone of another arm its grip rides, in the group's order. */
    arms: readonly {
      side: "left" | "right";
      rest: AutoMovieMotionHumanArmAngles.IAngles;
      back?: AutoMovieMotionHumanArmAngles.IAngles;
      on?: string;
    }[];

    /** The posture so far and its pose with the group's arms left out, at an instant. */
    at: (seconds: number) => { posture: IHumanPosture; pose: IAutoMoviePose };

    /** An arm's goal at an instant, as the plan perceives it. */
    aimed: (arm: number, seconds: number) => IHumanPosture.IGoal;

    /** The trajectory problem on given waypoints, the optimiser's own. */
    problem: (times: readonly number[]) => HumanArmTrajectory.IProblem;

    /** The plan's exact FK reader. */
    resolution: ReturnType<typeof prepareHumanPoseResolution>;
  }

  /**
   * The group's course: its trajectories and whether the model admits them;
   * none when the span holds no instant on the hold.
   *
   * @param props The planner's readers.
   * @returns The trajectories in the group's order and the admission; none without a hold instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instants, the phases, the result and when there is none.
   * @evidence contracts/development/implementation.md#principled-implementation An effector course with minimum-jerk timing and a closed-form via-point, solved per instant by the rig's analytic two-bone fit continued from the last instant, admitted by the trajectory model's own feasibility reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The instants, the hold, the two transports, the admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is admitted that the model refuses; a refused course only seeds the optimiser, every requirement intact.
   * @evidence contracts/development/implementation.md#efficient-algorithms One two-bone limb fit per arm per instant on the planner's solved base (a golden refinement about the last instant's swivel after each phase's first, no posture solve), one collider query per transport arm, one FK, one sphere cover of the body and its closed-form clearance arcs per transport instant (`HumanArmSwivelClearance`), one model evaluation and the admission counters, in place of the optimiser's penalty rounds of convexified programmes and its sampling planner. Unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the planner's cached postures, bases and goals, and the trajectory's playback.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Per-instant arms live until the admission; the readers returned keep only the trajectory's playback data.
   */
  export function course(
    props: IProps,
  ): ReturnType<typeof HumanArmTrajectory.admitted> | undefined {
    const { span, arms } = props;

    // The frame grid over the span, with the hold's two ends.
    const times: number[] = [span.start];
    for (let j: number = 1; span.start + j * STEP < span.end - 1e-9; ++j)
      times.push(span.start + j * STEP);
    times.push(span.end);
    for (const t of [span.ready, span.relax])
      if (!times.some((s: number): boolean => Math.abs(s - t) <= 1e-9))
        times.push(t);
    times.sort((p: number, q: number): number => p - q);
    const holding: (t: number) => boolean = (t: number): boolean =>
      t >= span.ready - 1e-9 && t <= span.relax + 1e-9;
    const course: Map<number, HumanArmClearance.IArm[]> = new Map();
    const fit: (t: number, goals: readonly IHumanPosture.IGoal[], near: resolveHumanPosture.INear)
      => { arms: HumanArmClearance.IArm[]; near: resolveHumanPosture.INear } = solver(props);

    const first: number | undefined = times.find(holding);
    const last: number | undefined = [...times].reverse().find(holding);
    if (first === undefined || last === undefined) return undefined;

    // One chain of fits from the rest to the return, each instant continuing
    // the swivel and branch the one before chose, so the elbow never changes
    // its side between two frames: the reach toward the hold's first goal,
    // the hold on every arm's own goal, the return from the hold's last arm.
    const rest: HumanArmClearance.IArm[] = arms.map(
      (arm: IProps["arms"][number]): HumanArmClearance.IArm => arm.rest,
    );
    course.set(span.start, rest);
    let near: resolveHumanPosture.INear = transport(props, times, fit, course, span.start, first, rest,
      arms.map((_: IProps["arms"][number], a: number): IHumanPosture.IGoal => props.aimed(a, first)), {});
    for (const t of times) {
      if (!holding(t)) continue;
      const solved: ReturnType<typeof fit> = fit(t,
        arms.map((_: IProps["arms"][number], a: number): IHumanPosture.IGoal => props.aimed(a, t)), near);
      course.set(t, solved.arms);
      near = solved.near;
    }
    if (span.relax < span.end - 1e-9) {
      const back: HumanArmClearance.IArm[] = arms.map(
        (arm: IProps["arms"][number]): HumanArmClearance.IArm => arm.back ?? arm.rest,
      );
      transport(props, times, fit, course, last, span.end, course.get(last)!, back, near);
      course.set(span.end, back);
    }
    if (times.some((t: number): boolean => !course.has(t))) return undefined;
    const read: ReturnType<typeof HumanArmTrajectory.admitted> = HumanArmTrajectory.admitted(
      props.problem(times),
      arms.map((_: IProps["arms"][number], a: number): HumanArmClearance.IArm[] =>
        times.map((t: number): HumanArmClearance.IArm => course.get(t)![a]!),
      ),
    );

    // How often a course is admitted, and which term refuses the others.
    HumanLimbFitFrame.work(props.body, read.admitted ? "courseAdmitted" : "courseFallbacks");
    const term: Parameters<typeof HumanLimbFitFrame.work>[1] | undefined = REFUSED[read.refused];
    if (!read.admitted && term !== undefined) HumanLimbFitFrame.work(props.body, term);
    return read;
  }
}

/** The frame grid, seconds: the finest the optimiser's waypoints are spaced (`HumanArmTrajectory`). */
const STEP: number = 1 / 30;

/** The counter of each model term that refuses a laid course (`HumanArmTrajectory.admitted`'s `refused`). */
const REFUSED: Readonly<Record<string, Parameters<typeof HumanLimbFitFrame.work>[1]>> = {
  speed: "courseRefusedSpeed",
  swept: "courseRefusedSwept",
  site: "courseRefusedSite",
  lift: "courseRefusedLift",
  limit: "courseRefusedLimit",
  probe: "courseRefusedProbe",
  embedded: "courseRefusedEmbedded",
  crossing: "courseRefusedCrossing",
};

/** The posture solve of every arm's goal at an instant, continued from the seeds the last instant chose. */
function solver(props: AutoMovieMotionHumanArmCourse.IProps): (
  t: number,
  goals: readonly IHumanPosture.IGoal[],
  near: resolveHumanPosture.INear,
) => { arms: HumanArmClearance.IArm[]; near: resolveHumanPosture.INear } {
  // An arm that rides another is fitted after it, on the pose it placed.
  const order: number[] = props.arms
    .map((_: AutoMovieMotionHumanArmCourse.IProps["arms"][number], a: number): number => a)
    .sort((p: number, q: number): number =>
      Number(props.arms[p]!.on !== undefined) - Number(props.arms[q]!.on !== undefined) || p - q);
  return (t: number, goals: readonly IHumanPosture.IGoal[], near: resolveHumanPosture.INear):
    { arms: HumanArmClearance.IArm[]; near: resolveHumanPosture.INear } => {
    // Each arm alone on the base the planner already solved, the rest of
    // the body as it stands: one two-bone fit per arm, no posture solve.
    let pose: IAutoMoviePose = props.at(t).pose;
    const next: Partial<Record<IHumanPosture.Limb, NonNullable<resolveHumanPosture.INear[IHumanPosture.Limb]>>> = {};
    for (const a of order) {
      const limb: IHumanPosture.Limb = `${props.arms[a]!.side}Arm`;
      const fitted: ReturnType<typeof resolveHumanPosture.limbSeeded> =
        resolveHumanPosture.limbSeeded(props.body, pose, limb, goals[a]!, near[limb], props.resolution);
      pose = fitted.pose;

      // Refined to the cold sweep's own resolution, so a continued fit
      // resolves its swivel as finely as a cold one.
      // A fit that names no seed (another candidate won) leaves the last one,
      // so the next instant still continues rather than sweeping afresh.
      if (fitted.seed !== undefined && fitted.seed !== null)
        next[limb] = { ...fitted.seed, tolerance: hingedArmSwivel.RESOLUTION };
      else if (near[limb] !== undefined) next[limb] = near[limb]!;
    }
    return {
      arms: props.arms.map((arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number]): HumanArmClearance.IArm =>
        AutoMovieMotionHumanArmAngles.angles(pose, arm.side)),
      near: next,
    };
  };
}

/** Where a transport's course stands at a share, in the trunk's frame: the wrist and the elbow from the shoulder in the chest's axes, and the hand's rotation from the chest's. */
interface IOn {
  /** The wrist from the shoulder, metres, chest axes. */
  wrist: IAutoMovieVector3;

  /** The hand's rotation from the chest's. */
  rotation: IAutoMovieQuaternion;

  /** The elbow from the shoulder, metres, chest axes: the fit's bend hint before its clearance. */
  elbow: IAutoMovieVector3;
}

/** The trunk frame a course is laid in at an instant: the shoulder's place and the chest's world rotation. */
interface ITrunk {
  /** The shoulder, world metres. */
  shoulder: IAutoMovieVector3;

  /** The chest's world rotation; the pelvis's where the rig has no chest. */
  turn: IAutoMovieQuaternion;
}

/** One end of a transport, read on the base it stands on: its course point and the trunk frame it is laid in. */
interface IEnd extends IOn, ITrunk {}

/**
 * Lay one transport's instants between two ends into the course (the module
 * documentation states the course), each end an arm as posed or a goal the
 * arm is to meet, the fits continued from `near` and on from instant to
 * instant; returns the seeds the last instant leaves, which the next phase
 * continues.
 */
function transport(
  props: AutoMovieMotionHumanArmCourse.IProps,
  times: readonly number[],
  fit: ReturnType<typeof solver>,
  course: Map<number, HumanArmClearance.IArm[]>,
  from: number,
  to: number,
  start: readonly (HumanArmClearance.IArm | IHumanPosture.IGoal)[],
  end: readonly (HumanArmClearance.IArm | IHumanPosture.IGoal)[],
  near: resolveHumanPosture.INear,
): resolveHumanPosture.INear {
  const { body, arms } = props;

  // The trunk frame at an instant: the shoulder's place and the chest's
  // turn, so a course rides a trunk that turns under it (a walk's
  // counter-rotation) as well as one that travels.
  const trunk: (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>, side: "left" | "right") => ITrunk = (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
  ): ITrunk => ({
    shoulder: bones.get(`${side}UpperArm`)!.worldPosition,
    turn: (bones.get("chest") ?? bones.get("hips"))?.worldRotation ?? Quaternion.identity(),
  });
  // An end in the trunk frame: an arm read by its forward kinematics on
  // the base, or a goal by its wrist, its rotation and its bend hint.
  const read: (t: number, side: "left" | "right", end: HumanArmClearance.IArm | IHumanPosture.IGoal) => IEnd = (
    t: number,
    side: "left" | "right",
    end: HumanArmClearance.IArm | IHumanPosture.IGoal,
  ): IEnd => {
    const posed: boolean = "upper" in end;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body,
      posed ? HumanArmClearance.posed(props.at(t).pose, side, end as HumanArmClearance.IArm) : props.at(t).pose,
      props.resolution(),
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`, "chest", "hips"]));
    const frame: ITrunk = trunk(bones, side);
    const into: IAutoMovieQuaternion = Quaternion.inverse(frame.turn);
    const local: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(into, Vector3.subtract(point, frame.shoulder));
    if (posed)
      return {
        ...frame,
        wrist: local(bones.get(`${side}Hand`)!.worldPosition),
        rotation: Quaternion.multiply(into, bones.get(`${side}Hand`)!.worldRotation),
        elbow: local(bones.get(`${side}LowerArm`)!.worldPosition),
      };
    const goal: IHumanPosture.IGoal = end as IHumanPosture.IGoal;
    return {
      ...frame,
      wrist: local(goal.point),
      rotation: Quaternion.multiply(into, goal.rotation ?? bones.get(`${side}Hand`)!.worldRotation),
      elbow: local(goal.bend),
    };
  };

  // The moving arms are not the body a course keeps clear of.
  const moving: RegExp = new RegExp(`^(${arms.map((arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number]): string =>
    arm.side).join("|")})(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)`);
  const spared: (bone: AutoMovieHumanoidBone) => boolean = (bone: AutoMovieHumanoidBone): boolean => moving.test(bone);
  const body0: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body,
    props.at(from).pose, props.resolution());
  const still: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const [bone, frame] of body0) if (!spared(bone)) still.set(bone, frame);

  // Each arm's two lengths from the rig's rest, and its own radius, the
  // greatest of its upper arm's and forearm's colliders.
  const lengths: [number, number][] = arms.map(
    (arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number]): [number, number] => {
      const at: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        body.rest.get(bone) ?? { x: 0, y: 0, z: 0 };
      return [
        Vector3.length(Vector3.subtract(at(`${arm.side}LowerArm`), at(`${arm.side}UpperArm`))),
        Vector3.length(Vector3.subtract(at(`${arm.side}Hand`), at(`${arm.side}LowerArm`))),
      ];
    });
  const radii: number[] = arms.map((arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number]): number => {
    let most: number = 0;
    for (const segment of HumanColliders.placed(body, body0))
      if (segment.bone === `${arm.side}UpperArm` || segment.bone === `${arm.side}LowerArm`)
        for (const shape of segment.shapes)
          if (shape.kind === "capsule" || shape.kind === "sphere") most = Math.max(most, shape.radius);
    return most;
  });

  // Each arm's course between its two ends in the trunk frame, bent through
  // a via-point where the straight course nears the body.
  const courses: ((share: number) => IOn)[] =
    arms.map((arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number], a: number): ((share: number) => IOn) => {
      const p: IEnd = read(from, arm.side, start[a]!);
      const q: IEnd = read(to, arm.side, end[a]!);
      const world: (v: IAutoMovieVector3) => IAutoMovieVector3 = (v: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(p.shoulder, Quaternion.rotateVector(p.turn, v));
      const near: ReturnType<typeof HumanColliders.nearest> = HumanColliders.nearest(body, still,
        world(p.wrist), world(q.wrist));
      const reach: number = HumanArmTrajectoryTerms.REACH;
      const control: IAutoMovieVector3 | undefined = near.distance >= reach
        ? undefined
        : Vector3.subtract(
            Vector3.scale(Quaternion.rotateVector(Quaternion.inverse(p.turn),
              Vector3.subtract(Vector3.add(near.point, Vector3.scale(near.normal, reach)), p.shoulder)), 2),
            Vector3.scale(Vector3.add(p.wrist, q.wrist), 0.5),
          );
      return (share: number): IOn => ({
        wrist: control === undefined
          ? Vector3.lerp(p.wrist, q.wrist, share)
          : Vector3.add(
              Vector3.add(Vector3.scale(p.wrist, (1 - share) ** 2), Vector3.scale(control, 2 * share * (1 - share))),
              Vector3.scale(q.wrist, share * share),
            ),
        rotation: Quaternion.slerp(p.rotation, q.rotation, share),
        elbow: Vector3.lerp(p.elbow, q.elbow, share),
      });
    });
  const clear: IHumanPosture.IGoal["clear"][] = arms.map(
    (_: AutoMovieMotionHumanArmCourse.IProps["arms"][number], a: number): IHumanPosture.IGoal["clear"] =>
      props.aimed(a, props.span.ready).clear,
  );
  let seeds: resolveHumanPosture.INear = near;
  for (const t of times) {
    if (!(t > from + 1e-9 && t < to - 1e-9)) continue;
    const share: number = minimumJerk.share((t - from) / (to - from));

    // The body at this instant, as the spheres the elbow's swivel keeps
    // clear of (`HumanArmSwivelClearance`).
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body,
      props.at(t).pose, props.resolution());
    const spheres: HumanArmSwivelClearance.ISphere[] =
      HumanArmSwivelClearance.spheres(body, bones, spared);
    const goals: IHumanPosture.IGoal[] = arms.map(
      (arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number], a: number): IHumanPosture.IGoal => {
        const frame: ITrunk = trunk(bones, arm.side);
        const on: IOn = courses[a]!(share);
        const world: (v: IAutoMovieVector3) => IAutoMovieVector3 = (v: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(frame.shoulder, Quaternion.rotateVector(frame.turn, v));
        const wrist: IAutoMovieVector3 = world(on.wrist);
        return {
          point: wrist,
          rotation: Quaternion.normalize(Quaternion.multiply(frame.turn, on.rotation)),
          bend: HumanArmSwivelClearance.hint(frame.shoulder, wrist, lengths[a]![0], lengths[a]![1],
            world(on.elbow), spheres, radii[a]!),
          ...(clear[a] === undefined ? {} : { clear: clear[a] }),
        };
      },
    );
    const solved: ReturnType<typeof fit> = fit(t, goals, seeds);
    course.set(t, solved.arms);
    seeds = solved.near;
  }
  return seeds;
}
