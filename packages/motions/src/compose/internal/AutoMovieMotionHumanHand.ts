import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";

/**
 * Hand primitives: the fingers and the thumb of one hand formed into a shape,
 * on the hand's own channel, whatever its arm does (a fist clenched at the
 * side, a point held while the arm swings, fingers spread in surprise).
 *
 * A hand at weight 0 is the hand as the posture it is shaped over holds it (the
 * relaxed cascade where that posture holds no finger), and at weight 1 the
 * asked shape; between, every segment's flexion is the weighted mean of the
 * two.
 */
export namespace AutoMovieMotionHumanHand {
  /**
   * The finger joints of a hand on its way to a shape.
   *
   * @param side The hand.
   * @param shape The shape at weight 1.
   * @param curl Extra flexion of the fingers over the shape, degrees.
   * @param weight How far from the relaxed cascade to the shape, in [0, 1].
   * @returns Angles for every finger and thumb segment of that hand.
   */
  export function fingers(
    side: AutoMovieHumanSide,
    shape: IAutoMovieMotionHumanHand.Shape,
    curl: number,
    weight: number,
  ): IAutoMovieMotionHumanPosture["joints"] {
    const asked: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
      side,
      shape,
    );
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
      side,
      "relaxed",
    );
    const out: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const bone of Object.keys(asked) as AutoMovieHumanoidBone[])
      out[bone] = interpolated(
        asked[bone]![0],
        relaxed[bone]![0],
        !bone.includes("Thumb"),
        curl,
        weight,
      );
    return out;
  }

  /**
   * Prepare one side's fixed named finger shape for varying curl and weight.
   *
   * @param side The hand whose named fifteen-joint shapes are read.
   * @param shape The unchanged working shape at weight one.
   * @returns Fresh clinical finger triples for each actual curl in degrees and
   *   weight in [0,1]; weight admission remains with the caller.
   */
  export function prepareFingers(
    side: AutoMovieHumanSide,
    shape: IAutoMovieMotionHumanHand.Shape,
  ): (curl: number, weight: number) => IAutoMovieMotionHumanPosture["joints"] {
    const fixed: readonly IFinger[] = entries(side, shape);
    return (
      curl: number,
      weight: number,
    ): IAutoMovieMotionHumanPosture["joints"] => shaped(fixed, curl, weight);
  }

  /**
   * Prepare the same fixed finger interpolation for an owned output joint map.
   *
   * @param side The fixed moving hand.
   * @param shape The fixed named working shape.
   * @returns A writer of fifteen fresh triples into its caller-owned joint
   *   record at the actual curl degrees and weight; unrelated keys remain
   *   untouched and weight admission stays with the caller.
   */
  export function prepareFingerWriter(
    side: AutoMovieHumanSide,
    shape: IAutoMovieMotionHumanHand.Shape,
  ): (
    joints: IAutoMovieMotionHumanPosture["joints"],
    curl: number,
    weight: number,
  ) => void {
    const fixed: readonly IFinger[] = entries(side, shape);
    return (
      joints: IAutoMovieMotionHumanPosture["joints"],
      curl: number,
      weight: number,
    ): void => {
      written(fixed, joints, curl, weight);
    };
  }
  /**
   * A hand shaped by a weight.
   *
   * @param props The hand, the shape, the window and the weight.
   * @returns The primitive, on the hand's channel.
   */
  export function shape(
    props: IAutoMovieMotionHumanHand.IShape,
  ): IAutoMovieMotionHumanPrimitive {
    // Compiled here, so a shape the hand owner refuses is refused when the
    // primitive is made.
    const write: ReturnType<typeof prepareFingerWriter> = prepareFingerWriter(
      props.side,
      props.shape,
    );
    return {
      channels: [`${props.side}Hand`],
      reads: [`${props.side}Hand`],
      from: props.from,
      to: props.to,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const out: IAutoMovieMotionHumanPosture = {
          ...posture,
          joints: { ...posture.joints },
        };
        const weight: number = Math.min(1, Math.max(0, props.weight(seconds)));
        write(out.joints, props.curl ?? 0, weight);
        return out;
      },
    };
  }

  /**
   * A hand formed into a shape and released: the weight rises over one window
   * and falls over another on the clock's envelope, and the hand is written
   * from the first instant to the last.
   *
   * @param clock The action's clock.
   * @param side The hand.
   * @param rise The instants the shape starts forming and is formed at.
   * @param fall The instants the shape starts releasing and is released at.
   * @param asked The shape.
   * @param curl Extra flexion of the fingers over the shape, degrees; 0 by
   *   default.
   * @returns The primitive.
   */
  export function form(
    clock: IAutoMovieMotionClock,
    side: AutoMovieHumanSide,
    rise: readonly [string, string],
    fall: readonly [string, string],
    asked: IAutoMovieMotionHumanHand.Shape,
    curl: number = 0,
  ): IAutoMovieMotionHumanPrimitive {
    return shape({
      side,
      shape: asked,
      curl,
      from: clock.at(rise[0]),
      to: clock.at(fall[1]),
      weight: (seconds: number): number => clock.envelope(rise, fall, seconds),
    });
  }
}

/** Fixed scalar values of one named finger segment, in original shape order. */
interface IFinger {
  bone: AutoMovieHumanoidBone;
  asked: number;
  relaxed: number;
  curls: boolean;
}

/** Compile only unchanged named-shape scalars; every output remains independent. */
function entries(
  side: AutoMovieHumanSide,
  shape: IAutoMovieMotionHumanHand.Shape,
): readonly IFinger[] {
  const asked: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    side,
    shape,
  );
  const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    side,
    "relaxed",
  );
  return (Object.keys(asked) as AutoMovieHumanoidBone[]).map(
    (bone: AutoMovieHumanoidBone): IFinger => ({
      bone,
      asked: asked[bone]![0],
      relaxed: relaxed[bone]![0],
      curls: !bone.includes("Thumb"),
    }),
  );
}

/**
 * The original curl-then-subtract interpolation shared by cold and prepared
 * reads.
 */
function shaped(
  fixed: readonly IFinger[],
  curl: number,
  weight: number,
): IAutoMovieMotionHumanPosture["joints"] {
  const out: IAutoMovieMotionHumanPosture["joints"] = {};
  written(fixed, out, curl, weight);
  return out;
}

/**
 * Populate one owned output record with fresh triples: each segment from the
 * flexion the record already holds for it, the posture the hand is shaped over
 * (a palm the entry laid flat on a thigh, a grip an earlier action closed), to
 * the asked shape; from the relaxed cascade where the record holds none. A hand
 * shaped from a fixed cascade instead dropped the fingers a seated body had
 * laid flat on its thigh into the thigh at the action's first and last
 * instants.
 */
function written(
  fixed: readonly IFinger[],
  joints: IAutoMovieMotionHumanPosture["joints"],
  curl: number,
  weight: number,
): void {
  for (const entry of fixed)
    joints[entry.bone] = interpolated(
      entry.asked,
      joints[entry.bone]?.[0] ?? entry.relaxed,
      entry.curls,
      curl,
      weight,
    );
}

/** Preserve the original curl addition, subtraction and multiplication grouping. */
function interpolated(
  asked: number,
  relaxed: number,
  curls: boolean,
  curl: number,
  weight: number,
): [number, number, number] {
  const a: number = asked + (curls ? curl : 0);
  const r: number = relaxed;
  return [r + (a - r) * weight, 0, 0];
}
