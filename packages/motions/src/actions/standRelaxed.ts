import {
  type IAutoMovieResolvedBone,
  ROM_TOLERANCE,
  getConstraint,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanDigitFit } from "../posture/HumanDigitFit";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { stand } from "./stand";

/**
 * The relaxed arm's least shoulder abduction that leaves its digits clear
 * of the body in a quiet stance. The elbow stays at the standing law's
 * 12 degrees and the digits in the relaxed shape; wider bodies need wider
 * hanging arms. The depth is measured before any digit clearing changes
 * that shape. Bisection ends at the engine's joint-angle resolution.
 *
 * @param body The body.
 * @returns The two arms' and hands' clinical angles, cached for this body.
 * @throws {Error} When the shoulder has no abduction range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the posture, the measured clearance, the search resolution and the cache's identity.
 * @evidence contracts/development/implementation.md#principled-implementation Bisects the abduction range on the digit capsules' signed penetration in the quiet stance. It assumes that swinging the hanging arm outward clears its digits; the model's shoulder range is the bracket.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Shape, signed-depth predicate, range bracket, bisection, cached answer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the existing hand shape, shoulder range, quiet stance, digit depth and angle resolution; no body-specific angle is chosen.
 * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve and two hands' depth queries per bisection step, logarithmic in the abduction span divided by ROM_TOLERANCE; later calls return the cached record.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body identity determines the skeleton, profile and measurements; a WeakMap stores one relaxed record per body.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The weak cache retains no body; its record is released with that body, and the search holds no external resource.
 */
export function standRelaxed(
  body: IHumanBody,
): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
  const known:
    | Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    | undefined = HUNG.get(body);
  if (known !== undefined) return known;
  const hanging = (
    abduction: number,
  ): Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > => {
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    for (const side of ["left", "right"] as const) {
      Object.assign(out, HumanHand.shape(side, "relaxed"));
      out[`${side}UpperArm`] = [0, abduction, 0];
      out[`${side}LowerArm`] = [12, 0, 0];
    }
    return out;
  };

  // Read the stated shape before the posture resolver's digit clearing.
  const sinks = (abduction: number): boolean => {
    const joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = hanging(abduction);
    const resolved: IAutoMoviePose = resolveHumanPosture(
      body,
      stand.stance(body, { x: 0, y: 0, z: 0 }, 0, joints),
    );
    const shaped: IAutoMoviePose = {
      ...resolved,
      joints: resolved.joints.map(
        (j: IAutoMovieJointPose): IAutoMovieJointPose => {
          const a: readonly [number, number, number] | undefined =
            joints[j.bone];
          return a === undefined || !DIGIT.test(j.bone)
            ? j
            : { bone: j.bone, flexion: a[0], abduction: a[1], twist: a[2] };
        },
      ),
    };
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, shaped);
    return (
      Math.max(
        HumanDigitFit.depth(body, bones, "left"),
        HumanDigitFit.depth(body, bones, "right"),
      ) > 0
    );
  };
  const range: IAutoMovieAngleRange | null | undefined = getConstraint(
    "leftUpperArm",
    body.skeleton.bones.find(
      (b: IAutoMovieBone): boolean => b.bone === "leftUpperArm",
    )?.constraint ?? null,
  )?.abduction;
  if (range === null || range === undefined)
    throw new Error("The shoulder has no abduction range to hang the arm in");
  let lo: number = 0;
  let hi: number = range.max;
  if (sinks(lo))
    while (hi - lo > ROM_TOLERANCE) {
      const mid: number = (lo + hi) / 2;
      if (sinks(mid)) lo = mid;
      else hi = mid;
    }
  else hi = lo;
  const out: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > = hanging(hi);
  HUNG.set(body, out);
  return out;
}

/** Each body's relaxed hanging arms, solved once. */
const HUNG: WeakMap<
  IHumanBody,
  Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
> = new WeakMap();

/** A digit's bone. */
const DIGIT: RegExp = /(Thumb|Index|Middle|Ring|Little)/;
