import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanToolWork,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanToolWork } from "./HumanToolWork";
import { useTool } from "./useTool";

/** The record of `IPlanCycleResult`'s site. */
type IPlanCycleResult = {
  grip: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
};

/**
 * The hand at a phase of the work, 0 at a contact and periodic in 1: a hammer's
 * head rising about the wrist and coming down on the work, a saw's teeth
 * running a quarter of the forearm either way of the work point (Starke and
 * Baber 2017, experiment 5), and each other kind's own stroke.
 *
 * Part of `useTool.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `cycle`.
 */
export function useToolCycle(
  prepared: useToolCycle.IPrepared,
): (phase: number) => Pick<useTool.IWork, useToolCycle.PlanCycle> {
  const { kind, turn, pose, m, work, forward, left }: useToolCycle.IPrepared =
    prepared;
  return (phase: number): IPlanCycleResult => {
    switch (kind) {
      case "hammer": {
        // The head rises about the wrist and comes down on the work.
        const c: number = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
        return turn!(-useTool.RAISE * c);
      }
      case "saw":
        // The teeth run a quarter of the forearm either way of the work
        // point, a stroke of half the forearm, about the 14.0 cm median
        // excursion of real sawing (Starke and Baber 2017, experiment 5).
        return {
          grip: Vector3.add(
            pose.grip,
            Vector3.scale(
              pose.axis,
              0.25 * m.forearm * Math.sin(2 * Math.PI * phase),
            ),
          ),
          rotation: pose.rotation,
        };
      case "stir": {
        const r: number = work.radius;
        const a: number = 2 * Math.PI * phase;
        return {
          grip: Vector3.add(
            pose.grip,
            Vector3.add(
              Vector3.scale(forward, -r * Math.cos(a) + r),
              Vector3.scale(left, r * Math.sin(a)),
            ),
          ),
          rotation: pose.rotation,
        };
      }
      case "screwdriver":
        return turn!(useTool.TURN * Math.sin(2 * Math.PI * phase));
    }
  };
}

/** The `cycle` of `useTool.plan`, built from what that plan prepared. */
export namespace useToolCycle {
  /** The alternatives of `PlanCycle`'s site. */
  export type PlanCycle = "grip" | "rotation";

  /** The alternatives of `PlanTurn`'s site. */
  export type PlanTurn = "grip" | "rotation";

  /** What `useTool.plan` prepared for its `cycle`. */
  export interface IPrepared {
    /** The `kind` `useTool.plan` prepared. */
    kind: IAutoMovieMotionHumanToolWork.Kind;

    /** The `turn` `useTool.plan` prepared. */
    turn: ((degrees: number) => Pick<useTool.IWork, PlanTurn>) | undefined;

    /** The `pose` `useTool.plan` prepared. */
    pose: useTool.IWork;

    /** The body's forearm length, metres. */
    m: Pick<IAutoMovieMotionHumanBody["measure"], "forearm">;

    /** The `work` `useTool.plan` prepared. */
    work: HumanToolWork.IWork;

    /** The `forward` `useTool.plan` prepared. */
    forward: IAutoMovieVector3;

    /** The `left` `useTool.plan` prepared. */
    left: IAutoMovieVector3;
  }
}
