import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkReach } from "../../actions/internal/walkReach";
import { AutoMovieMotionHumanLean } from "../../compose/internal/AutoMovieMotionHumanLean";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { StrikingTarget } from "../../striking/internal/StrikingTarget";
import type { StaggerFeet } from "./StaggerFeet";
import { staggerKnots } from "./staggerKnots";
import type { staggerRecover } from "./staggerRecover";

/**
 * Write the recovery's feet, knee poles and trunk on the pose that follows the
 * pendulum. During the reaction the feet turn off the exact entry rocker
 * without lifting its bearing point. An incoming ankle uses the same contact
 * offset at the end of swing as at the first stance instant, and the
 * touchdown's knee solution guides both sides of that join.
 *
 * @param body The body whose knee and rocker geometry the recovery reads.
 * @param entered The displayed entry and its actual feet.
 * @param recovery The admitted landing events and feet.
 * @param landing One scoped reference per actual touchdown, after plan
 *   construction.
 * @returns The current posture writer.
 */
export function staggerRocking(
  body: IAutoMovieMotionHumanActionContext["body"],
  entered: IAutoMovieMotionHumanActionContext["entry"],
  recovery: staggerRecover.IRecovery,
  landing: ReadonlyMap<staggerRecover.IStep, IAutoMovieHumanLimbReference>,
): (frame: IFrame) => IAutoMovieMotionHumanPosture {
  const entry: IAutoMovieMotionHumanPosture = entered.posture;
  const entryLegs: IAutoMovieMotionHumanPosture["limbs"] = entry.limbs;
  const latest: staggerRecover.IStep[] = recovery.steps.slice().reverse();
  const entryFeet: ReturnType<typeof StrikingTarget.feet> =
    StrikingTarget.feet(entered);
  return ({
    posture,
    solved,
    root,
    seconds,
    reacting,
  }: IFrame): IAutoMovieMotionHumanPosture => {
    const {
      feet: scheduled,
      settled,
      reached,
      trunk,
      ease,
    }: ReturnType<StaggerFeet["solve"]> = solved;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    const toe: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number => {
      const angle: number = entry.joints[`${side}Toes`]?.[0] ?? 0;
      return angle + (reached[side].toes - angle) * reacting;
    };
    for (const side of ["left", "right"] as const) {
      const key: AutoMovieHumanLimb = `${side}Leg`;

      // The knee points over the foot's own heading.
      const knee: IAutoMovieVector3 = staggerKnots.kneePole(
        body,
        root,
        settled.yaw,
        side,
        HumanFoot.heading(reached[side].rotation),
      );

      // Keep the exact foot rocker and its matching toe articulation.
      // Only the knee pole can blend from the entry without moving the
      // lowest socket. The fitting branch then follows each landing key.
      const entered: IAutoMovieMotionHumanPosture["limbs"][typeof key] =
        entryLegs[key];
      const step: staggerRecover.IStep | undefined = latest.find(
        (candidate: staggerRecover.IStep): boolean =>
          candidate.side === side && candidate.start < seconds,
      );
      const bearing: boolean = scheduled[side].swing === undefined;
      const socket: IAutoMovieVector3 = settled.contacts[side];
      const proximity: number = walkReach.weight(scheduled[side]);
      const goal: IAutoMovieHumanLimbGoal = {
        point: reached[side].ankle,
        bend:
          step === undefined && ease < 1 && entered?.bend !== undefined
            ? Vector3.lerp(entered.bend, knee, ease)
            : knee,
        rotation: reached[side].rotation,
        ...(bearing ? { planted: true } : {}),
        // Give the landing rocker the same socket on each side of
        // touch-down. Its contact first follows the incoming ankle, then
        // bears in the fixed stance frame at the event.
        ...(proximity === 0
          ? {}
          : { contact: Vector3.scale(socket, proximity) }),
      };
      if (reacting < 1 && bearing) {
        const foot: IAutoMovieMotionHumanFoot.IPlacement = entryFeet[side];
        const at: IAutoMovieVector3 = Vector3.lerp(
          Vector3.add(
            foot.ankle,
            Quaternion.rotateVector(foot.rotation, socket),
          ),
          Vector3.add(
            goal.point,
            Quaternion.rotateVector(reached[side].rotation, socket),
          ),
          reacting,
        );
        goal.rotation = Quaternion.slerp(
          foot.rotation,
          reached[side].rotation,
          reacting,
        );
        goal.point = Vector3.subtract(
          at,
          Quaternion.rotateVector(goal.rotation, socket),
        );
      }
      const reference: IAutoMovieHumanLimbReference | undefined =
        step === undefined ? undefined : landing.get(step);
      if (reference !== undefined && step !== undefined)
        goal.reference = {
          ...reference,
          weight: AutoMovieEngineMotionSampling.minimumJerkShare(
            (seconds - step.start) / (step.land - step.start),
          ),
        };
      limbs[key] = goal;
    }
    // The trunk tilts about the hips against the fall (`staggerLean`),
    // so the legs stay on their feet.
    return AutoMovieMotionHumanLean.pivot(
      body,
      {
        ...posture,
        root,
        yaw: settled.yaw,
        joints: {
          ...posture.joints,
          leftToes: [toe("left"), 0, 0],
          rightToes: [toe("right"), 0, 0],
        },
        limbs,
      },
      trunk,
    );
  };
}

/**
 * The settled recovery and the exact root and phase its legs use for this
 * query.
 */
interface IFrame {
  posture: IAutoMovieMotionHumanPosture;
  solved: ReturnType<StaggerFeet["solve"]>;
  root: IAutoMovieVector3;
  seconds: number;
  reacting: number;
}
