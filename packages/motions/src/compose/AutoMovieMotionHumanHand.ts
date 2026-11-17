import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";

/**
 * Hand primitives: the fingers and the thumb of one hand formed into a shape,
 * on the hand's own channel, whatever its arm does (a fist clenched at the
 * side, a point held while the arm swings, fingers spread in surprise).
 *
 * A hand at weight 0 is the hand as the posture it is shaped over holds it
 * (the relaxed cascade where that posture holds no finger), and at weight 1
 * the asked shape; between, every segment's flexion is the weighted mean of
 * the two.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the primitives write, on which channel, and what the weight's two ends and its middle are.
 * @evidence contracts/development/design.md#principled-representation A hand shape is a set of segment flexions, so a hand on its way to a shape is their weighted mean with the resting hand.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The interpolation and its fixed-shape preparation, one primitive (`shape`) and one named time course (`form`); arm and hand primitives share one finger interpolation owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the hand owner's shape vocabulary and angles; no shape is defined here.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and range and what the result covers.
   * @evidence contracts/development/implementation.md#principled-implementation Each segment's flexion is the weighted mean of the relaxed cascade's and the asked shape's; the curl is added to the fingers of the asked shape.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop reads the current named shapes and delegates each unchanged scalar interpolation to the owner shared with prepareFingers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The curl is not added to the thumb, whose flexion axis closes across the palm and not with the fingers.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the hand's fifteen segments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads both shapes from `HumanHand.shape`, their owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function fingers(
    side: AutoMovieHumanSide,
    shape: IAutoMovieMotionHumanHand.Shape,
    curl: number,
    weight: number,
  ): IAutoMovieMotionHumanPosture["joints"] {
    const asked: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(side, shape);
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(side, "relaxed");
    const out: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const bone of Object.keys(asked) as AutoMovieHumanoidBone[])
      out[bone] = interpolated(asked[bone]![0], relaxed[bone]![0], !bone.includes("Thumb"), curl, weight);
    return out;
  }

  /**
   * Prepare one side's fixed named finger shape for varying curl and weight.
   *
   * @param side The hand whose named fifteen-joint shapes are read.
   * @param shape The unchanged working shape at weight one.
   * @returns Fresh clinical finger triples for each actual curl in degrees and weight in [0,1]; weight admission remains with the caller.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed side/shape, varying curl degrees/weight, unchanged thumb exclusion and fresh output ownership without adding a weight clamp.
   * @evidence contracts/development/implementation.md#principled-implementation Reads both named shapes from HumanHand once and applies the same relaxed-plus-weighted-difference scalar interpolation as fingers, retaining curl addition before subtraction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered scalar-entry producer feeds one interpolation owner used by cold fingers and the returned reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves all fifteen named bones, their order, thumb curl exclusion, zero abduction/twist and exact arithmetic; no clamping, sample, result or altered shape is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Prepares fifteen scalar entries once, avoiding two shape maps, thirty temporary angle triples and repeated key/thumb scans per query; each actual read still writes fifteen fresh triples in O(15) work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed side and named shape determine the same asked/relaxed scalar entries; curl and weight remain current inputs of every interpolation and no completed finger result is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller retains one bounded fifteen-entry array and reader until its primitive ends; returned joint maps/triples are fresh and no body, posture or time history is retained.
   */
  export function prepareFingers(
    side: AutoMovieHumanSide,
    shape: IAutoMovieMotionHumanHand.Shape,
  ): (curl: number, weight: number) => IAutoMovieMotionHumanPosture["joints"] {
    const fixed: readonly IFinger[] = entries(side, shape);
    return (curl: number, weight: number): IAutoMovieMotionHumanPosture["joints"] => shaped(fixed, curl, weight);
  }

  /**
   * Prepare the same fixed finger interpolation for an owned output joint map.
   *
   * @param side The fixed moving hand.
   * @param shape The fixed named working shape.
   * @returns A writer of fifteen fresh triples into its caller-owned joint record at the actual curl degrees and weight; unrelated keys remain untouched and weight admission stays with the caller.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed named geometry, caller-owned mutable output, actual degree curl/share inputs, unchanged thumb policy and fresh output triple ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Uses prepareFingers' same named scalar entries and the same weighted-difference interpolation, from the flexion the output record already holds for each segment (the relaxed cascade where it holds none), adding curl before subtraction and excluding thumbs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bounded entry producer supplies the shared written owner; the fresh-map reader creates its own target while this explicit writer receives its caller's owned target.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no bone/order, degree arithmetic, zero abduction/twist, thumb exclusion, callback or weight policy. It reads the output record's own finger flexions as the weight's zero, never caller-supplied derived finger values or a completed posture.
   * @evidence contracts/development/implementation.md#efficient-algorithms Compiles fifteen scalar entries once and writes fifteen fresh triples per query, removing the intermediate joint-map allocation and second property-copy pass for actual hand/arm writers; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same fixed side/shape determines immutable asked/relaxed prerequisites. Curl, weight and the owned output target are current inputs; neither map nor completed triple is retained or reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning primitive retains one fifteen-entry array and writer until release. Every call retains no output map, posture, angle result, body, callback context or time history.
   */
  export function prepareFingerWriter(side: AutoMovieHumanSide, shape: IAutoMovieMotionHumanHand.Shape):
    (joints: IAutoMovieMotionHumanPosture["joints"], curl: number, weight: number) => void {
    const fixed: readonly IFinger[] = entries(side, shape);
    return (joints: IAutoMovieMotionHumanPosture["joints"], curl: number, weight: number): void => {
      written(fixed, joints, curl, weight);
    };
  }

  /**
   * A hand shaped by a weight.
   *
   * @param props The hand, the shape, the window and the weight.
   * @returns The primitive, on the hand's channel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is shaped, by what, and the channel claimed.
   * @evidence contracts/development/implementation.md#principled-implementation Each finger joint goes by the weight from the flexion the posture holds for it (the relaxed cascade where it holds none) to the shape's, so the hand leaves and returns to the hand it was given.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Copy the posture/joints, read this second's weight and configuration, then use one fixed-shape reader for the joint update.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weight is clamped to [0, 1], so an overshooting time course cannot bend a finger past its shape.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed shape scalars are compiled only on first use or changed side/shape; each written second reads the actual weight and writes fifteen fresh triples directly into its owned joint copy, without temporary named-shape or interpolated-joint maps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work prepareFingerWriter shares prepareFingers/fingers' same scalar interpolation. Exact current side/shape keys guard one last preparation, preserving live props and recomputing changed configurations without a growing cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive holds props and at most one fixed fifteen-entry reader until release, retaining no per-second posture, weight, curl, result or time history.
   */
  export function shape(props: IAutoMovieMotionHumanHand.IShape): IAutoMovieMotionHumanPrimitive {
    let fixed: { side: AutoMovieHumanSide; shape: IAutoMovieMotionHumanHand.Shape; write: ReturnType<typeof prepareFingerWriter> } | undefined;
    return {
      channels: [`${props.side}Hand`],
      reads: [`${props.side}Hand`],
      from: props.from,
      to: props.to,
      write: (posture: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture => {
        const out: IAutoMovieMotionHumanPosture = { ...posture, joints: { ...posture.joints } };
        const side: AutoMovieHumanSide = props.side;
        const asked: IAutoMovieMotionHumanHand.Shape = props.shape;
        const curl: number = props.curl ?? 0;
        const weight: number = Math.min(1, Math.max(0, props.weight(seconds)));
        if (fixed === undefined || fixed.side !== side || fixed.shape !== asked)
          fixed = { side, shape: asked, write: prepareFingerWriter(side, asked) };
        fixed.write(out.joints, curl, weight);
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
   * @param curl Extra flexion of the fingers over the shape, degrees; 0 by default.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two windows, the span written and the default curl.
   * @evidence contracts/development/implementation.md#principled-implementation A shape formed and released is the clock's envelope over a rise and a fall.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `shape` with the envelope as the weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The windows are named instants of the clock, so no time is written twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `shape` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned shape primitive retains these fixed arguments, its clock and the one bounded named-shape reader documented by shape, without time or joint-result history.
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
function entries(side: AutoMovieHumanSide, shape: IAutoMovieMotionHumanHand.Shape): readonly IFinger[] {
  const asked: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(side, shape);
  const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(side, "relaxed");
  return (Object.keys(asked) as AutoMovieHumanoidBone[]).map(
    (bone: AutoMovieHumanoidBone): IFinger => ({
      bone, asked: asked[bone]![0], relaxed: relaxed[bone]![0], curls: !bone.includes("Thumb"),
    }),
  );
}

/** The original curl-then-subtract interpolation shared by cold and prepared reads. */
function shaped(fixed: readonly IFinger[], curl: number, weight: number): IAutoMovieMotionHumanPosture["joints"] {
  const out: IAutoMovieMotionHumanPosture["joints"] = {};
  written(fixed, out, curl, weight);
  return out;
}

/**
 * Populate one owned output record with fresh triples: each segment from the
 * flexion the record already holds for it, the posture the hand is shaped
 * over (a palm the entry laid flat on a thigh, a grip an earlier action
 * closed), to the asked shape; from the relaxed cascade where the record
 * holds none. A hand shaped from a fixed cascade instead dropped the fingers
 * a seated body had laid flat on its thigh into the thigh at the action's
 * first and last instants.
 */
function written(fixed: readonly IFinger[], joints: IAutoMovieMotionHumanPosture["joints"], curl: number, weight: number): void {
  for (const entry of fixed)
    joints[entry.bone] = interpolated(entry.asked, joints[entry.bone]?.[0] ?? entry.relaxed, entry.curls, curl, weight);
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
