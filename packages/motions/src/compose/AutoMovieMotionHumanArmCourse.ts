import { hingedArmSwivel, minimumJerk } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import type { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";

/**
 * An arm group's action laid as an animation system lays a reach, without
 * trajectory optimisation, and admitted only when it meets every bound a
 * solved trajectory meets (`HumanArmTrajectory.admitted`); a group it does
 * not meet is solved by the optimiser instead (`HumanArmTrajectory.solve`).
 *
 * On the frame grid of the span (and its `ready` and `relax`):
 *
 * - the hold: every arm fitted to its goal at each instant in one posture
 *   solve, the riding arm after the one it rides (`resolveHumanPosture`),
 *   each fit after the first continuing the last one's swivel and branch
 *   (`IAutoMovieSwivelNear`), the temporal coherence of an analytic
 *   two-bone solve (Tolani, Goswami and Badler 2000) that a game's per-frame
 *   IK keeps;
 * - the reach and the return: each joint blended between the rest and the
 *   hold's end on a minimum-jerk share (Flash and Hogan 1985), since free
 *   arm movements are smooth in joint space (Soechting and Lacquaniti 1981),
 *   and kept clear of the trunk, the thighs, the other arm and the bodies
 *   the goal names by the shoulder's abduction and the elbow's flexion
 *   (`HumanArmClearance.cleared`), each end keeping its room, as the joint
 *   carry does.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two phases, their sources, the admission and the fallback.
 * @evidence contracts/development/design.md#principled-representation The course is the arms' clinical triples at the planner's instants, read through the same playback as a solved trajectory.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One input record and one function, read by `AutoMovieMotionHumanArmPlanned.planned`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No bound is the course's own: the admission is the trajectory model's reading.
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

    /** Each arm's side, rest and return, in the group's order. */
    arms: readonly {
      side: "left" | "right";
      rest: AutoMovieMotionHumanArmAngles.IAngles;
      back?: AutoMovieMotionHumanArmAngles.IAngles;
    }[];

    /** The posture so far and its pose with the group's arms left out, at an instant. */
    at: (seconds: number) => { posture: IHumanPosture; pose: IAutoMoviePose };

    /** An arm's goal at an instant, as the plan perceives it. */
    aimed: (arm: number, seconds: number) => IHumanPosture.IGoal;

    /** The trajectory problem on given waypoints, the optimiser's own. */
    problem: (times: readonly number[]) => HumanArmTrajectory.IProblem;

    /** The plan's exact FK reader. */
    resolution: ReturnType<typeof prepareHumanPoseResolution>;

    /** The plan's ROM projector. */
    projection: ReturnType<typeof prepareHumanPostureProjection>;
  }

  /**
   * The group's trajectories laid and admitted, or none when the laid course
   * misses a bound and the optimiser must solve it.
   *
   * @param props The planner's readers.
   * @returns Each arm's trajectory, in the group's order; none when not admitted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instants, the phases, the admission and the absent result.
   * @evidence contracts/development/implementation.md#principled-implementation Per-instant analytic fits on the hold continued from the last instant, joint-space minimum-jerk transport with closed-form clearance off it, and the trajectory model's own feasibility reading as the admission.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The instants, the hold, the two transports, the admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is admitted that the model refuses; a missed bound hands the group to the optimiser with every requirement intact.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per hold instant (continued fits after the first), constant joint blends and one clearance reading per arm per transport instant, and one model evaluation, in place of the optimiser's penalty rounds of convexified programmes. Unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the planner's cached postures, bases and goals, and the trajectory's playback.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Per-instant arms live until the admission; the readers returned keep only the trajectory's playback data.
   */
  export function course(
    props: IProps,
  ): HumanArmTrajectory.Trajectory[] | undefined {
    const { body, span, arms } = props;

    // The frame grid over the span, with the hold's two ends.
    const times: number[] = [span.start];
    for (let j: number = 1; span.start + j * STEP < span.end - 1e-9; ++j)
      times.push(span.start + j * STEP);
    times.push(span.end);
    for (const t of [span.ready, span.relax])
      if (!times.some((s: number): boolean => Math.abs(s - t) <= 1e-9))
        times.push(t);
    times.sort((p: number, q: number): number => p - q);
    const holding = (t: number): boolean =>
      t >= span.ready - 1e-9 && t <= span.relax + 1e-9;

    // The hold: one posture solve of every arm's goal per instant, each
    // continuing the swivel the instant before chose.
    const course: Map<number, HumanArmClearance.IArm[]> = new Map();
    let near: resolveHumanPosture.INear = {};
    for (const t of times) {
      if (!holding(t)) continue;
      const posture: IHumanPosture = props.at(t).posture;
      const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
      arms.forEach((arm: IProps["arms"][number], a: number): void => {
        limbs[`${arm.side}Arm`] = props.aimed(a, t);
      });
      const seeded: resolveHumanPosture.ISeeded = resolveHumanPosture.seeded(
        body, { ...posture, limbs }, undefined, near,
        props.resolution, undefined, props.projection,
      );
      course.set(t, arms.map(
        (arm: IProps["arms"][number]): HumanArmClearance.IArm =>
          AutoMovieMotionHumanArmAngles.angles(seeded.pose, arm.side),
      ));
      const next: Partial<Record<IHumanPosture.Limb, ReturnType<typeof continued>>> = {};
      for (const arm of arms) {
        const seed: resolveHumanPosture.ISeeded["seeds"][IHumanPosture.Limb] =
          seeded.seeds[`${arm.side}Arm`];
        if (seed !== undefined && seed !== null)
          next[`${arm.side}Arm`] = continued(seed);
      }
      near = next;
    }
    const first: HumanArmClearance.IArm[] | undefined = course.get(
      times.find(holding) ?? NaN,
    );
    const last: HumanArmClearance.IArm[] | undefined = course.get(
      [...times].reverse().find(holding) ?? NaN,
    );
    if (first === undefined || last === undefined) return undefined;

    // A transport: each joint blended on a minimum-jerk share between its
    // two ends and kept clear of the body, each arm in the pose the others
    // take at the same share (an earlier arm cleared, a later one plain).
    const transport = (
      from: number,
      to: number,
      start: readonly HumanArmClearance.IArm[],
      end: readonly HumanArmClearance.IArm[],
    ): void => {
      const blends: ((share: number) => HumanArmClearance.IArm)[] = arms.map(
        (arm: IProps["arms"][number], a: number): ((share: number) => HumanArmClearance.IArm) => {
          const upper: (share: number) => readonly [number, number, number] =
            blendHumanJoint.between(body, `${arm.side}UpperArm`, start[a]!.upper, end[a]!.upper);
          const lower: (share: number) => readonly [number, number, number] =
            blendHumanJoint.between(body, `${arm.side}LowerArm`, start[a]!.lower, end[a]!.lower);
          const hand: (share: number) => readonly [number, number, number] =
            blendHumanJoint.between(body, `${arm.side}Hand`, start[a]!.hand, end[a]!.hand);
          return (share: number): HumanArmClearance.IArm => ({
            upper: upper(share), lower: lower(share), hand: hand(share),
          });
        },
      );
      const others: HumanColliders.IPlaced[][] = arms.map(
        (_: IProps["arms"][number], a: number): HumanColliders.IPlaced[] =>
          [...(props.aimed(a, span.ready).clear ?? [])],
      );

      // Each end keeps the room it holds, so the transport leaves and joins
      // it without a step.
      const rooms: HumanArmClearance.IBaseline[][] = arms.map(
        (arm: IProps["arms"][number], a: number): HumanArmClearance.IBaseline[] => [
          HumanArmClearance.baseline(body, props.at(from).pose, arm.side,
            start[a]!, others[a]!, props.resolution()),
          HumanArmClearance.baseline(body, props.at(to).pose, arm.side,
            end[a]!, others[a]!, props.resolution()),
        ],
      );
      for (const t of times) {
        if (!(t > from + 1e-9 && t < to - 1e-9)) continue;
        const share: number = minimumJerk.share((t - from) / (to - from));
        const plain: HumanArmClearance.IArm[] = blends.map(
          (blend: (share: number) => HumanArmClearance.IArm): HumanArmClearance.IArm =>
            blend(share),
        );
        const cleared: HumanArmClearance.IArm[] = [];
        arms.forEach((arm: IProps["arms"][number], a: number): void => {
          let pose: IAutoMoviePose = props.at(t).pose;
          arms.forEach((other: IProps["arms"][number], o: number): void => {
            if (o !== a)
              pose = HumanArmClearance.posed(pose, other.side,
                o < a ? cleared[o]! : plain[o]!);
          });
          const room: HumanArmClearance.IBaseline[] = rooms[a]!;
          cleared[a] = HumanArmClearance.cleared(body, pose, arm.side,
            plain[a]!, 0, others[a]!, {
              forearm: room[0]!.forearm * (1 - share) + room[1]!.forearm * share,
              segments: room[0]!.segments * (1 - share) + room[1]!.segments * share,
            }, props.resolution);
        });
        course.set(t, cleared);
      }
    };
    const rest: HumanArmClearance.IArm[] = arms.map(
      (arm: IProps["arms"][number]): HumanArmClearance.IArm => arm.rest,
    );
    transport(span.start, span.ready, rest, first);

    // The ends are the problem's own (`HumanArmTrajectory.admitted`); every
    // other instant is the course's.
    course.set(span.start, rest);
    if (span.relax < span.end - 1e-9) {
      const back: HumanArmClearance.IArm[] = arms.map(
        (arm: IProps["arms"][number]): HumanArmClearance.IArm => arm.back ?? arm.rest,
      );
      transport(span.relax, span.end, last, back);
      course.set(span.end, back);
    }
    if (times.some((t: number): boolean => !course.has(t))) return undefined;
    return HumanArmTrajectory.admitted(
      props.problem(times),
      arms.map((_: IProps["arms"][number], a: number): HumanArmClearance.IArm[] =>
        times.map((t: number): HumanArmClearance.IArm => course.get(t)![a]!),
      ),
    );
  }
}

/** The frame grid, seconds: the finest the optimiser's waypoints are spaced (`HumanArmTrajectory`). */
const STEP: number = 1 / 30;

/** A fit continued from the last instant's seed, refined to the cold sweep's own resolution. */
function continued(
  seed: NonNullable<resolveHumanPosture.ISeeded["seeds"][IHumanPosture.Limb]>,
): NonNullable<resolveHumanPosture.INear[IHumanPosture.Limb]> {
  return { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
}
