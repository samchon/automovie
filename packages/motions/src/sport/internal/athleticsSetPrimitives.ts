import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../../posture/humanPostureHeading";
import { sprintStartSet } from "./sprintStartSet";

/**
 * The sprint start's root and trunk primitive: the pelvis and the spine's share
 * of the trunk's tilt brought in by the into-set share and pushed forward by
 * the square of the drive, the root placed under the hips' course.
 *
 * Part of `athletics.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `primitives`.
 */
export function athleticsSetPrimitives(
  prepared: athleticsSetPrimitives.IPrepared,
): IAutoMovieMotionHumanPrimitive[] {
  const {
    clock,
    into,
    drive,
    pitchDelta,
    target,
    flexed,
    hipsAt,
    push,
    hipsRest,
  }: athleticsSetPrimitives.IPrepared = prepared;
  return [
    {
      channels: ["root", "trunk"],
      reads: ["root", "trunk"],
      from: 0,
      to: clock.duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const w: number = into(seconds);
        const t: number = drive(seconds);
        // The spine's share of the trunk's tilt comes in with the pelvis's.
        const pitched: IAutoMovieMotionHumanPosture = {
          ...posture,
          pitch: posture.pitch + pitchDelta * w - 0.25 * target.pitch * t * t,
          joints: {
            ...posture.joints,
            spine: flexed(posture.joints, "spine", w - 0.2 * t * t),
            chest: flexed(posture.joints, "chest", w - 0.2 * t * t),
          },
        };
        const hips: IAutoMovieVector3 = Vector3.add(
          hipsAt(w),
          Vector3.scale(push, t * t),
        );
        return {
          ...pitched,
          root: Vector3.subtract(
            hips,
            Quaternion.rotateVector(humanPostureHeading(pitched), hipsRest),
          ),
        };
      },
    },
  ];
}

/** The `primitives` of `athletics.plan`, built from what that plan prepared. */
export namespace athleticsSetPrimitives {
  /** The alternatives of `PlanFlexedBone`'s site. */
  export type PlanFlexedBone = "spine" | "chest";

  /** What `athletics.plan` prepared for its `primitives`. */
  export interface IPrepared {
    /** The `clock` `athletics.plan` prepared. */
    clock: IAutoMovieMotionClock;

    /** The `into` `athletics.plan` prepared. */
    into: (seconds: number) => number;

    /** The `drive` `athletics.plan` prepared. */
    drive: (seconds: number) => number;

    /** The `pitchDelta` `athletics.plan` prepared. */
    pitchDelta: number;

    /** The `target` `athletics.plan` prepared. */
    target: ReturnType<typeof sprintStartSet>;

    /** The `flexed` `athletics.plan` prepared. */
    flexed: (
      joints: IAutoMovieMotionHumanPosture["joints"],
      bone: PlanFlexedBone,
      share: number,
    ) => readonly [number, number, number];

    /** The `hipsAt` `athletics.plan` prepared. */
    hipsAt: ReturnType<typeof Vector3.prepareLerp>;

    /** The `push` `athletics.plan` prepared. */
    push: IAutoMovieVector3;

    /** The `hipsRest` `athletics.plan` prepared. */
    hipsRest: IAutoMovieVector3;
  }
}
