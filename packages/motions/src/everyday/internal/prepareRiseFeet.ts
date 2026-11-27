import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";

/*
 * Prepare the two feet drawn beneath a seated body before rising. Each foot has
 * its original fixed swing interval, minimum-jerk travel and sine clearance;
 * the current root still determines its planted leg goal.
 * Parameter props: Fixed entry/drawn ankles in world metres, swing seconds,
 * positive draw seconds, lift metres and the standing law's leg builder.
 * Returns: Fresh leg goals at a root and second, with swinging feet unplanted.
 */
export function prepareRiseFeet(
  props: IPrepareRiseFeetProps,
): (
  root: IAutoMovieVector3,
  seconds: number,
) => IAutoMovieMotionHumanPosture["limbs"] {
  const straight: Record<
    AutoMovieHumanSide,
    ReturnType<typeof Vector3.prepareLerp>
  > = {
    left: Vector3.prepareLerp(props.feet.left, props.drawn.left),
    right: Vector3.prepareLerp(props.feet.right, props.drawn.right),
  };
  /*
   * Read one original foot swing together with its planted endpoint rule.
   */
  function footAt(side: AutoMovieHumanSide, t: number): IFootAtResult {
    const swing: readonly [number, number] | undefined = props.swings[side];
    if (swing === undefined || t <= swing[0])
      return { ankle: props.feet[side], planted: true };
    if (t >= swing[1]) return { ankle: props.drawn[side], planted: true };
    const u: number = (t - swing[0]) / props.draw;
    const line: ReturnType<typeof Vector3.prepareLerp> = straight[side];
    const ankle: IAutoMovieVector3 = line(AutoMovieEngineMotionSampling.minimumJerkShare(u));

    // This interpolation vector belongs only to this foot read.
    ankle.y = ankle.y + props.lift * Math.sin(Math.PI * u);
    return { ankle, planted: false };
  }
  return (
    root: IAutoMovieVector3,
    seconds: number,
  ): IAutoMovieMotionHumanPosture["limbs"] => {
    const placed: Record<AutoMovieHumanSide, ReturnType<typeof footAt>> = {
      left: footAt("left", seconds),
      right: footAt("right", seconds),
    };
    const legs: IAutoMovieMotionHumanPosture["limbs"] = props.legged(root, {
      left: placed.left.ankle,
      right: placed.right.ankle,
    });
    for (const side of ["left", "right"] as const) {
      const limb: PrepareRiseFeetLimb = `${side}Leg`;
      if (!placed[side].planted)
        legs[limb] = { ...legs[limb]!, planted: false };
    }
    return legs;
  };
}

/*
 * The alternatives of `PrepareRiseFeetLimb`'s site.
 */
type PrepareRiseFeetLimb = "leftLeg" | "rightLeg";

/*
 * The record of `IFootAtResult`'s site.
 */
type IFootAtResult = { ankle: IAutoMovieVector3; planted: boolean };

/*
 * The record of `IPrepareRiseFeetProps`'s site.
 */
type IPrepareRiseFeetProps = {
  /*
   * The entry's ankle points, world metres.
   */
  feet: Record<AutoMovieHumanSide, IAutoMovieVector3>;

  /*
   * The ankles drawn beneath the pelvis, world metres.
   */
  drawn: Record<AutoMovieHumanSide, IAutoMovieVector3>;

  /*
   * Liftoff/touchdown seconds of each moving foot; absent feet stay planted.
   */
  swings: Partial<Record<AutoMovieHumanSide, readonly [number, number]>>;

  /*
   * Positive seconds of each swing.
   */
  draw: number;

  /*
   * The sine clearance's height, metres.
   */
  lift: number;

  /*
   * Fixed-yaw standing geometry with current-root knee goals.
   */
  legged: ReturnType<typeof stand.prepareLegs>;
};
