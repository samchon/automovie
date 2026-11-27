import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingBlade,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";

/**
 * The tool's frame at a progress along its path at a second, carried with the
 * advance and a followed target: a followed target moves the landing with it,
 * and on an advancing stroke the hand is carried by what the shoulder is ahead
 * of or behind the advance's own progress, so a lunge never drives the body
 * through its own hand.
 *
 * Part of `StrikingBlade.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `onPath`.
 */
export function StrikingBladeOnPath(
  prepared: StrikingBladeOnPath.IPrepared,
): (
  posture: IAutoMovieMotionHumanPosture,
  seconds: number,
  read: (() => ReturnType<typeof HumanTrunk.resolve>) | undefined,
  progress: number,
) => IAutoMovieMotionHumanStrikingHeld.IHandFrame {
  const { stroke, shoulderOf, borne }: StrikingBladeOnPath.IPrepared = prepared;
  return (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    read: (() => ReturnType<typeof HumanTrunk.resolve>) | undefined,
    progress: number,
  ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
    const laid: IAutoMovieMotionHumanStrikingHeld.IHandFrame = stroke.path(
      stroke.stop < 1 ? Math.min(stroke.stop, progress) : progress,
      seconds,
    );

    // A followed target moves the landing with it; the arm's reference
    // stays planned on the path alone.
    const sought: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
      stroke.follow === undefined
        ? laid
        : { ...laid, point: Vector3.add(laid.point, stroke.follow(seconds)) };

    // A path is laid from the shoulder as it stands to the shoulder the
    // advance brings, as if the body advanced with the stroke's own
    // progress. The body advances on its own time, so the hand is carried
    // by what the shoulder is ahead of or behind that: otherwise a lunge
    // drives the body through its own hand and folds the arm to its limit.
    const at: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
      stroke.advance === "none" || !(stroke.stop > 0)
        ? sought
        : {
            ...sought,
            point: Vector3.add(
              sought.point,
              Vector3.subtract(
                shoulderOf(posture, read),
                Vector3.lerp(
                  borne()[0],
                  borne()[1],
                  Math.min(1, Math.max(0, progress / stroke.stop)),
                ),
              ),
            ),
          };
    return at;
  };
}

/** The `onPath` of `StrikingBlade.plan`, built from what that plan prepared. */
export namespace StrikingBladeOnPath {
  /** What `StrikingBlade.plan` prepared for its `onPath`. */
  export interface IPrepared {
    /** The `stroke` `StrikingBlade.plan` prepared. */
    stroke: Pick<
      IAutoMovieMotionHumanStrikingBlade.IStroke,
      "path" | "stop" | "follow" | "advance"
    >;

    /** The `shoulderOf` `StrikingBlade.plan` prepared. */
    shoulderOf: (
      posture: IAutoMovieMotionHumanPosture,
      read?: () => ReturnType<typeof HumanTrunk.resolve>,
    ) => IAutoMovieVector3;

    /** The `borne` `StrikingBlade.plan` prepared. */
    borne: () => readonly [IAutoMovieVector3, IAutoMovieVector3];
  }
}
