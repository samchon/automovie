import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { stand } from "../actions/stand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Prepare the two feet drawn beneath a seated body before rising. Each
 * foot has its original fixed swing interval, minimum-jerk travel and sine
 * clearance; the current root still determines its planted leg goal.
 *
 * @param props Fixed entry/drawn ankles in world metres, swing seconds,
 *   positive draw seconds, lift metres and the standing law's leg builder.
 * @returns Fresh leg goals at a root and second, with swinging feet unplanted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed ankle/time geometry, units, positive duration premise and returned bearing flags.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the same endpoint comparisons, minimum-jerk horizontal interpolation and sine clearance as rise's original draw; the prepared standing owner still writes each current-root knee goal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One foot-course reader supplies both ankle positions and their contact flags to a single leg-goal write.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains both exact swing intervals, the original draw/lift values and all planted endpoint rules; no motion or contact is approximated.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two foot courses are read once per second instead of rereading each for bearing flags. Each actual swinging side lazily prepares fixed ankle deltas once, and its owned fresh vector receives the original sine lift without a discarded copy; standing rotations/contacts remain shared by the native builder.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed entry/drawn points, schedule and standing metadata alone prove equivalence; native Vector3.prepareLerp copies only endpoint coefficients on the first interior read. Every current progress/root/goal remains independently evaluated.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The rise plan owns entry/drawn points, at most two swing intervals and at most two fixed six-scalar interpolation readers until release; no current point, FK workspace, queried time or result history is retained.
 */
export function prepareRiseFeet(props: {
  /** The entry's ankle points, world metres. */
  feet: Record<"left" | "right", IAutoMovieVector3>;

  /** The ankles drawn beneath the pelvis, world metres. */
  drawn: Record<"left" | "right", IAutoMovieVector3>;

  /** Liftoff/touchdown seconds of each moving foot; absent feet stay planted. */
  swings: Partial<Record<"left" | "right", readonly [number, number]>>;

  /** Positive seconds of each swing. */
  draw: number;

  /** The sine clearance's height, metres. */
  lift: number;

  /** Fixed-yaw standing geometry with current-root knee goals. */
  legged: ReturnType<typeof stand.prepareLegs>;
}): (root: IAutoMovieVector3, seconds: number) => IHumanPosture["limbs"] {
  const straight: Partial<
    Record<"left" | "right", ReturnType<typeof Vector3.prepareLerp>>
  > = {};
  /** Read one original foot swing together with its planted endpoint rule. */
  function footAt(
    side: "left" | "right",
    t: number,
  ): { ankle: IAutoMovieVector3; planted: boolean } {
    const swing: readonly [number, number] | undefined = props.swings[side];
    if (swing === undefined || t <= swing[0])
      return { ankle: props.feet[side], planted: true };
    if (t >= swing[1]) return { ankle: props.drawn[side], planted: true };
    const u: number = (t - swing[0]) / props.draw;
    const line: ReturnType<typeof Vector3.prepareLerp> = (straight[side] ??=
      Vector3.prepareLerp(props.feet[side], props.drawn[side]));
    const ankle: IAutoMovieVector3 = line(minimumJerk.share(u));

    // This interpolation vector belongs only to this foot read.
    ankle.y = ankle.y + props.lift * Math.sin(Math.PI * u);
    return { ankle, planted: false };
  }
  return (root: IAutoMovieVector3, seconds: number): IHumanPosture["limbs"] => {
    const placed: Record<"left" | "right", ReturnType<typeof footAt>> = {
      left: footAt("left", seconds),
      right: footAt("right", seconds),
    };
    const legs: IHumanPosture["limbs"] = props.legged(root, {
      left: placed.left.ankle,
      right: placed.right.ankle,
    });
    for (const side of ["left", "right"] as const) {
      const limb: "leftLeg" | "rightLeg" = `${side}Leg`;
      if (!placed[side].planted)
        legs[limb] = { ...legs[limb]!, planted: false };
    }
    return legs;
  };
}
