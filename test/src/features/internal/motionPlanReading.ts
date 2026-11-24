import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFoot,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";

/**
 * Readings of one law's plan for a unit test: its resolved pose and bones at a
 * second, its events' seconds, a knee's flexion, the trunk's inclination and
 * whether a foot bears, each read from the plan's own posture with no
 * performance around it.
 */
export namespace motionPlanReading {
  /**
   * The plan's resolved pose at a second.
   *
   * @param body The body.
   * @param plan The plan.
   * @param seconds Action seconds.
   * @returns The pose.
   */
  export function pose(
    body: IAutoMovieMotionHumanBody,
    plan: IAutoMovieMotionHumanActionPlan,
    seconds: number,
  ): IAutoMoviePose {
    return resolveHumanPosture(body, plan.posture(seconds));
  }

  /**
   * The plan's world bones at a second.
   *
   * @param body The body.
   * @param plan The plan.
   * @param seconds Action seconds.
   * @returns The bones.
   */
  export function bones(
    body: IAutoMovieMotionHumanBody,
    plan: IAutoMovieMotionHumanActionPlan,
    seconds: number,
  ): ReturnType<typeof poseBones> {
    return poseBones(body, pose(body, plan, seconds));
  }

  /**
   * An event's action second.
   *
   * @param plan The plan.
   * @param name The event.
   * @returns Its second, or undefined when the plan has none of that name.
   */
  export function event(
    plan: IAutoMovieMotionHumanActionPlan,
    name: string,
  ): number | undefined {
    const found: IAutoMovieMotionEvent | undefined = plan.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === name,
    );
    return found === undefined ? undefined : found.share * plan.duration;
  }

  /**
   * A knee's clinical flexion in a pose, degrees, its magnitude.
   *
   * @param pose The pose.
   * @param side The knee.
   * @returns Degrees.
   */
  export function knee(pose: IAutoMoviePose, side: AutoMovieHumanSide): number {
    return Math.abs(
      pose.joints.find(
        (joint: IAutoMoviePose["joints"][number]): boolean =>
          joint.bone === `${side}LowerLeg`,
      )?.flexion ?? 0,
    );
  }

  /**
   * The trunk's inclination from vertical, degrees: the angle of the line
   * from the hips to the neck.
   *
   * @param bones The world bones.
   * @returns Degrees.
   */
  export function trunk(bones: ReturnType<typeof poseBones>): number {
    const line: IAutoMovieVector3 = Vector3.subtract(
      bones.get("neck")!.worldPosition,
      bones.get("hips")!.worldPosition,
    );
    return (
      (Math.acos(Math.min(1, line.y / Vector3.length(line))) * 180) / Math.PI
    );
  }

  /**
   * Whether a foot bears at a second: a plant or pivot window of the plan open
   * there, and its lowest sole socket within `floor` of the ground.
   *
   * @param body The body.
   * @param plan The plan.
   * @param seconds Action seconds.
   * @param side The foot.
   * @param floor The greatest height of the lowest socket, metres.
   * @returns Whether it bears.
   */
  export function bears(
    body: IAutoMovieMotionHumanBody,
    plan: IAutoMovieMotionHumanActionPlan,
    seconds: number,
    side: AutoMovieHumanSide,
    floor: number,
  ): boolean {
    const share: number = seconds / plan.duration;
    const open: boolean = plan.contacts.some(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.part === `${side}Foot` &&
        (c.kind === "plant" || c.kind === "pivot" || c.kind === "bear") &&
        c.from <= share &&
        share <= c.to,
    );
    const lowest: number = Math.min(
      ...HumanFoot.sockets(body, bones(body, plan, seconds), side).map(
        (socket: ReturnType<typeof HumanFoot.sockets>[number]): number =>
          socket.point.y,
      ),
    );
    return open && lowest <= floor;
  }
}
