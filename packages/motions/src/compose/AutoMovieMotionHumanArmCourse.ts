import {
  type IAutoMovieResolvedBone,
  type IAutoMovieSwivelSeed,
  Quaternion,
  Vector3,
  minimumJerk,
  swivelArcs,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmSwivelClearance } from "../posture/HumanArmSwivelClearance";
import { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryModel } from "../posture/HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanLimbAt } from "../posture/HumanLimbAt";
import { HumanLimbFitFrame } from "../posture/HumanLimbFitFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";

/**
 * An arm group's action laid as an animation system lays a reach, computed
 * rather than fitted: kept when it meets every bound a solved trajectory
 * meets (`HumanArmTrajectory.admitted`), else the optimiser's seed
 * (`HumanArmTrajectory.solve`).
 *
 * Two fits per arm, at the hold's first and last instants (the arm on its
 * goal, solved once). Every other instant of the frame grid (and of `ready`
 * and `relax`) poses the arm in closed form at a swivel the course chooses
 * (`HumanLimbAt.at`, the engine's articulation at a prescribed swivel and
 * branch, Tolani, Goswami and Badler 2000):
 *
 * - the reach and the return: the wrist on a course from one end's wrist to
 *   the other's, laid in the trunk's frame (from the shoulder, in the
 *   chest's axes, so a trunk that travels or turns under the arm carries the
 *   course with it), its share minimum jerk in time (Flash and Hogan 1985),
 *   the hand's rotation from the chest's slerped on the same share, bent
 *   through one via-point where the straight course comes within
 *   `HumanArmTrajectoryTerms.REACH` of the body (off the nearest surface
 *   point along its normal, `HumanColliders.nearest`). The swivel runs on
 *   the same share from the start arm's to the end arm's (each read off its
 *   arm, `HumanLimbAt.seed`) the shorter way, moved to the nearest swivel at
 *   which the upper arm and the forearm clear the body
 *   (`HumanArmSwivelClearance.refused`, Kallmann 2008's closest valid to
 *   preferred), then held to the audit's speed along the plan: no step
 *   turns the swivel faster than carries the elbow at
 *   `HumanArmTrajectoryModel.SPEED_LIMIT`, read forward and back so both
 *   ends keep their own swivels;
 * - the hold: every arm's own goal at the instant, at the swivel run in
 *   time from the first hold arm's to the last's.
 *
 * The ends are the end arms' own swivels and branches, so a transport
 * leaves and joins them with no step. An arm whose two ends lie on
 * different bend branches has no course and goes to the optimiser.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two fits, the closed-form instants, the course, its swivel and its bounds, the hold, the ends and the fallback, with their sources.
 * @evidence contracts/development/design.md#principled-representation The course is the arms' clinical triples at the planner's instants, read through the same playback as a solved trajectory.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One input record and one function, read by `AutoMovieMotionHumanArmPlanned.planned`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No bound is the course's own: the admission is the trajectory model's reading, the via-point's reach and the swivel's speed the model's constants.
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
   * none when the span holds no instant on the hold or an arm's course has no
   * closed form (ends on different branches, a chain the engine cannot pose).
   *
   * @param props The planner's readers.
   * @returns The trajectories in the group's order, the admission and its refusing term; none without a course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instants, the phases, the result and when there is none.
   * @evidence contracts/development/implementation.md#principled-implementation Two fits per arm, every other instant the engine's closed-form articulation at a swivel chosen by minimum-jerk interpolation, exact clearance arcs and the audit's speed, admitted by the trajectory model's own feasibility reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The instants, the two hold fits, the hold, the two transports, the admission and its counters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is admitted that the model refuses; a refused course only seeds the optimiser, every requirement intact.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two limb fits per arm per action; per instant and arm three closed-form poses (the swivel's zero and quarter turn to read the circle, then the chosen swivel), one sphere cover of the body and its exact clearance arcs; one model evaluation. No sweep, score or continuation at an instant. Unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the planner's cached postures, bases and goals, the engine's articulation and the trajectory's playback.
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
    const held: number[] = times.filter(holding);
    if (held.length === 0) return undefined;
    const first: number = held[0]!;
    const last: number = held[held.length - 1]!;
    const course: Map<number, HumanArmClearance.IArm[]> = new Map();
    const rest: HumanArmClearance.IArm[] = arms.map(
      (arm: IProps["arms"][number]): HumanArmClearance.IArm => arm.rest);
    course.set(span.start, rest);

    // The hold's two ends, each fitted once on every arm's own goal.
    const fitted: (t: number) => HumanArmClearance.IArm[] = (t: number): HumanArmClearance.IArm[] => {
      let pose: IAutoMoviePose = props.at(t).pose;
      for (const a of order(props))
        pose = resolveHumanPosture.limbSeeded(props.body, pose, `${arms[a]!.side}Arm`,
          props.aimed(a, t), undefined, props.resolution).pose;
      return arms.map((arm: IProps["arms"][number]): HumanArmClearance.IArm =>
        AutoMovieMotionHumanArmAngles.angles(pose, arm.side));
    };
    const opening: HumanArmClearance.IArm[] = fitted(first);
    const closing: HumanArmClearance.IArm[] = last === first ? opening : fitted(last);

    // The hold between them, then the reach and the return.
    if (!laid(props, held, course, opening, closing, false)) return undefined;
    if (!laid(props, times.filter((t: number): boolean => t >= span.start && t <= first), course, rest, opening, true))
      return undefined;
    if (span.relax < span.end - 1e-9) {
      const back: HumanArmClearance.IArm[] = arms.map(
        (arm: IProps["arms"][number]): HumanArmClearance.IArm => arm.back ?? arm.rest);
      if (!laid(props, times.filter((t: number): boolean => t >= last && t <= span.end), course, closing, back, true))
        return undefined;
      course.set(span.end, back);
    }
    if (times.some((t: number): boolean => !course.has(t))) return undefined;
    const read: ReturnType<typeof HumanArmTrajectory.admitted> = HumanArmTrajectory.admitted(
      props.problem(times),
      arms.map((_: IProps["arms"][number], a: number): HumanArmClearance.IArm[] =>
        times.map((t: number): HumanArmClearance.IArm => course.get(t)![a]!)),
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

/** The group's arms in the order they are placed: an arm that rides another after it, on the pose it placed. */
function order(props: AutoMovieMotionHumanArmCourse.IProps): number[] {
  return props.arms
    .map((_: AutoMovieMotionHumanArmCourse.IProps["arms"][number], a: number): number => a)
    .sort((p: number, q: number): number =>
      Number(props.arms[p]!.on !== undefined) - Number(props.arms[q]!.on !== undefined) || p - q);
}

/** The trunk frame a course is laid in at an instant: the shoulder's place and the chest's world rotation. */
interface ITrunk {
  /** The shoulder, world metres. */
  shoulder: IAutoMovieVector3;

  /** The chest's world rotation; the pelvis's where the rig has no chest. */
  turn: IAutoMovieQuaternion;
}

/** One end of a phase in the trunk frame: the wrist from the shoulder in the chest's axes, the hand's rotation from the chest's, and the arm's swivel and branch. */
interface IEnd {
  /** The wrist from the shoulder, metres, chest axes. */
  wrist: IAutoMovieVector3;

  /** The hand's rotation from the chest's. */
  rotation: IAutoMovieQuaternion;

  /** The arm's swivel and branch (`HumanLimbAt.seed`). */
  seed: IAutoMovieSwivelSeed;
}

/**
 * Lay one phase's instants between two end arms into the course, each
 * instant posed in closed form (the module documentation states the
 * course): a transport's wrist on its trunk-frame course, a hold's on every
 * arm's own goal. False when an arm has no closed form here.
 */
function laid(
  props: AutoMovieMotionHumanArmCourse.IProps,
  times: readonly number[],
  course: Map<number, HumanArmClearance.IArm[]>,
  start: readonly HumanArmClearance.IArm[],
  end: readonly HumanArmClearance.IArm[],
  transport: boolean,
): boolean {
  const { body, arms } = props;
  if (times.length === 0) return true;
  const from: number = times[0]!;
  const to: number = times[times.length - 1]!;
  const trunk: (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>, side: "left" | "right") => ITrunk = (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
  ): ITrunk => ({
    shoulder: bones.get(`${side}UpperArm`)!.worldPosition,
    turn: (bones.get("chest") ?? bones.get("hips"))?.worldRotation ?? Quaternion.identity(),
  });
  const read: (t: number, a: number, arm: HumanArmClearance.IArm) => IEnd | null = (
    t: number,
    a: number,
    arm: HumanArmClearance.IArm,
  ): IEnd | null => {
    const side: "left" | "right" = arms[a]!.side;
    const pose: IAutoMoviePose = HumanArmClearance.posed(props.at(t).pose, side, arm);
    const seed: IAutoMovieSwivelSeed | null = HumanLimbAt.seed(body, pose, `${side}Arm`);
    if (seed === null) return null;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, pose, props.resolution(),
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`, `${side}Hand`, "chest", "hips"]));
    const frame: ITrunk = trunk(bones, side);
    const into: IAutoMovieQuaternion = Quaternion.inverse(frame.turn);
    return {
      wrist: Quaternion.rotateVector(into, Vector3.subtract(bones.get(`${side}Hand`)!.worldPosition, frame.shoulder)),
      rotation: Quaternion.multiply(into, bones.get(`${side}Hand`)!.worldRotation),
      seed,
    };
  };
  const ends: [IEnd, IEnd][] = [];
  for (let a: number = 0; a < arms.length; ++a) {
    const p: IEnd | null = read(from, a, start[a]!);
    const q: IEnd | null = read(to, a, end[a]!);
    if (p === null || q === null || p.seed.branch !== q.seed.branch) return false;
    ends.push([p, q]);
  }

  // A transport's wrist course in the trunk frame, bent through a via-point
  // where the straight course nears the body without the group's arms.
  const moving: RegExp = new RegExp(`^(${arms.map((arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number]): string =>
    arm.side).join("|")})(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)`);
  const spared: (bone: AutoMovieHumanoidBone) => boolean = (bone: AutoMovieHumanoidBone): boolean => moving.test(bone);
  const base: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, props.at(from).pose, props.resolution());
  const still: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const [bone, frame] of base) if (!spared(bone)) still.set(bone, frame);
  const wrists: ((share: number, frame: ITrunk) => IAutoMovieVector3)[] = ends.map(
    ([p, q]: [IEnd, IEnd], a: number): ((share: number, frame: ITrunk) => IAutoMovieVector3) => {
      const frame: ITrunk = trunk(base, arms[a]!.side);
      const world: (v: IAutoMovieVector3) => IAutoMovieVector3 = (v: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(frame.shoulder, Quaternion.rotateVector(frame.turn, v));
      const near: ReturnType<typeof HumanColliders.nearest> = HumanColliders.nearest(body, still, world(p.wrist), world(q.wrist));
      const reach: number = HumanArmTrajectoryTerms.REACH;
      const control: IAutoMovieVector3 | undefined = !transport || near.distance >= reach ? undefined
        : Vector3.subtract(
            Vector3.scale(Quaternion.rotateVector(Quaternion.inverse(frame.turn),
              Vector3.subtract(Vector3.add(near.point, Vector3.scale(near.normal, reach)), frame.shoulder)), 2),
            Vector3.scale(Vector3.add(p.wrist, q.wrist), 0.5));
      return (share: number, at: ITrunk): IAutoMovieVector3 => Vector3.add(at.shoulder, Quaternion.rotateVector(at.turn,
        control === undefined ? Vector3.lerp(p.wrist, q.wrist, share)
          : Vector3.add(Vector3.add(Vector3.scale(p.wrist, (1 - share) ** 2), Vector3.scale(control, 2 * share * (1 - share))),
              Vector3.scale(q.wrist, share * share))));
    });

  // Each instant: the arms' goals, the circle each elbow keeps (read off
  // the engine's own poses at swivels 0 and 90), the swivel wanted on the
  // shared share and the nearest clear one.
  const inner: number[] = times.filter((t: number): boolean => t > from + 1e-9 && t < to - 1e-9);
  const goals: IHumanPosture.IGoal[][] = [];
  const swivels: number[][] = [];
  const radii: number[][] = [];
  for (const t of inner) {
    const share: number = transport
      ? minimumJerk.share((t - from) / (to - from)) : (t - from) / (to - from);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, props.at(t).pose, props.resolution());
    const spheres: HumanArmSwivelClearance.ISphere[] = HumanArmSwivelClearance.spheres(body, bones, spared);
    const here: IHumanPosture.IGoal[] = [];
    const wanted: number[] = [];
    const circles: number[] = [];
    arms.forEach((arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number], a: number): void => {
      const [p, q]: [IEnd, IEnd] = ends[a]!;
      const frame: ITrunk = trunk(bones, arm.side);
      const goal: IHumanPosture.IGoal = transport
        ? { point: wrists[a]!(share, frame), bend: frame.shoulder,
            rotation: Quaternion.normalize(Quaternion.multiply(frame.turn,
              Quaternion.slerp(p.rotation, q.rotation, share))) }
        : props.aimed(a, t);
      here.push(goal);
      const turn: number = ((((q.seed.swivel - p.seed.swivel) % 360) + 540) % 360) - 180;
      const desired: number = p.seed.swivel + turn * share;
      const elbow: (swivel: number) => IAutoMovieVector3 | undefined = (swivel: number): IAutoMovieVector3 | undefined => {
        const posed: ReturnType<typeof HumanLimbAt.at> =
          HumanLimbAt.at(body, props.at(t).pose, `${arm.side}Arm`, goal, swivel, p.seed.branch);
        return posed === null ? undefined : poseBones(body, posed.pose, props.resolution(),
          new Set<AutoMovieHumanoidBone>([`${arm.side}LowerArm`])).get(`${arm.side}LowerArm`)?.worldPosition;
      };
      const zero: IAutoMovieVector3 | undefined = elbow(0);
      const quarter: IAutoMovieVector3 | undefined = elbow(90);
      let chosen: number = desired;
      let circle: number = 0;
      if (zero !== undefined && quarter !== undefined) {
        const line: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(goal.point, frame.shoulder));
        const centre: IAutoMovieVector3 = Vector3.add(frame.shoulder,
          Vector3.scale(line, Vector3.dot(Vector3.subtract(zero, frame.shoulder), line)));
        circle = Vector3.length(Vector3.subtract(zero, centre));
        if (circle > 1e-9) {
          const refused: swivelArcs.IArc[] | "all" = HumanArmSwivelClearance.refused(frame.shoulder, goal.point,
            centre, circle, Vector3.scale(Vector3.subtract(zero, centre), 1 / circle),
            Vector3.scale(Vector3.subtract(quarter, centre), 1 / circle), spheres, armRadius(body, bones, arm.side));
          chosen = swivelArcs.nearest(refused, desired) ?? desired;
          chosen = desired + ((((chosen - desired) % 360) + 540) % 360) - 180;
        }
      }
      wanted.push(chosen);
      circles.push(circle);
    });
    goals.push(here);
    swivels.push(wanted);
    radii.push(circles);
  }

  // The swivel held to the audit's speed along the plan, forward from the
  // start arm's and back from the end arm's, so both ends keep their own.
  arms.forEach((_: AutoMovieMotionHumanArmCourse.IProps["arms"][number], a: number): void => {
    const limit: (k: number, dt: number) => number = (k: number, dt: number): number =>
      radii[k]![a]! > 1e-9 ? (HumanArmTrajectoryModel.SPEED_LIMIT * dt / radii[k]![a]!) * (180 / Math.PI) : Infinity;
    let prior: number = ends[a]![0].seed.swivel;
    let then: number = from;
    inner.forEach((t: number, k: number): void => {
      const most: number = limit(k, t - then);
      swivels[k]![a] = Math.min(prior + most, Math.max(prior - most, swivels[k]![a]!));
      prior = swivels[k]![a]!;
      then = t;
    });
    let next: number = ends[a]![0].seed.swivel + (((((ends[a]![1].seed.swivel - ends[a]![0].seed.swivel) % 360) + 540) % 360) - 180);
    then = to;
    for (let k: number = inner.length - 1; k >= 0; --k) {
      const most: number = limit(k, then - inner[k]!);
      swivels[k]![a] = Math.min(next + most, Math.max(next - most, swivels[k]![a]!));
      next = swivels[k]![a]!;
      then = inner[k]!;
    }
  });

  // Each instant posed at its swivels, the riding arm on the pose the other placed.
  course.set(from, [...start]);
  course.set(to, [...end]);
  for (let k: number = 0; k < inner.length; ++k) {
    let pose: IAutoMoviePose = props.at(inner[k]!).pose;
    for (const a of order(props)) {
      const posed: ReturnType<typeof HumanLimbAt.at> = HumanLimbAt.at(body, pose, `${arms[a]!.side}Arm`,
        goals[k]![a]!, swivels[k]![a]!, ends[a]![0].seed.branch);
      if (posed === null) return false;
      pose = posed.pose;
    }
    course.set(inner[k]!, arms.map((arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number]): HumanArmClearance.IArm =>
      AutoMovieMotionHumanArmAngles.angles(pose, arm.side)));
  }
  return true;
}

/** The arm's own radius: the greatest of its upper arm's and forearm's collider radii, metres. */
function armRadius(
  body: IHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: "left" | "right",
): number {
  let most: number = 0;
  for (const segment of HumanColliders.placed(body, bones))
    if (segment.bone === `${side}UpperArm` || segment.bone === `${side}LowerArm`)
      for (const shape of segment.shapes)
        if (shape.kind === "capsule" || shape.kind === "sphere") most = Math.max(most, shape.radius);
  return most;
}
