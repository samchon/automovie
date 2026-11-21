import { preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanLimbFit } from "../posture/HumanLimbFit";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { turnHumanPosture } from "../posture/turnHumanPosture";

/**
 * The active limb contacts of one overlay before its fade moves them: a joint-only path contributes its complete displayed limb frame while fading and none at full weight.
 *
 * Moved unchanged from `HumanSegmentOverlay` to keep that file under the
 * repository's 500-line limit; its caller and behaviour are unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the function computes and where it was moved from; the caller's documentation states the method.
 * @evidence contracts/development/implementation.md#principled-implementation The same computation its caller performed inline before the move, with the same inputs and outputs.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function per file; the caller keeps its own decisions and delegates this step.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No value, tolerance or branch changed in the move.
 * @evidence contracts/development/implementation.md#efficient-algorithms The cost is the moved body's, unchanged; the move adds one call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares nothing beyond what the body shared before the move.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond what the body retained before the move.
 */
export function overlayContactGoals(
  overlay: IAutoMovieMotionHumanSegment.IOverlay,
  written: IAutoMovieMotionHumanPosture,
  over: IAutoMoviePose,
  seconds: number,
  person: IAutoMovieMotionHumanSegment.IPerson,
  weight: number,
  resolution?: () => ReturnType<typeof preparePoseResolution>,
): IAutoMovieMotionHumanPosture["limbs"] {
  const share: number = (seconds - overlay.start) / overlay.plan.duration;
  const contacts: IAutoMovieMotionHumanPosture["limbs"] = {};
  const turned: IAutoMovieMotionHumanPosture["limbs"] =
    written.rotation === undefined
      ? written.limbs
      : turnHumanPosture(written).limbs;
  let requested: Set<AutoMovieHumanoidBone> | undefined;
  let selected:
    | Map<AutoMovieHumanLimb, IAutoMovieHumanLimbGoal | undefined>
    | undefined;
  for (const window of overlay.plan.contacts) {
    if (share < window.from || share > window.to) continue;
    const limb: AutoMovieHumanLimb | undefined = limbOf(window.part);
    if (limb === undefined || !overlay.channels.includes(limb)) continue;
    const goal: IAutoMovieHumanLimbGoal | undefined = turned[limb];

    // A joint-only path at full weight is displayed on its own joints.
    if (goal === undefined && weight >= 1) continue;
    (selected ??= new Map()).set(limb, goal);
    if (goal !== undefined) continue;
    const chain: ReturnType<typeof HumanLimbFit.chain> =
      HumanLimbFit.chain(limb);
    (requested ??= new Set()).add(chain.effector);
    requested.add(chain.lower);
  }
  if (selected === undefined) return contacts;
  const placed: ReturnType<typeof poseBones> | undefined =
    requested === undefined
      ? undefined
      : poseBones(person.performer.body, over, resolution?.(), requested);
  for (const [limb, goal] of selected) {
    if (goal !== undefined) {
      contacts[limb] = { ...goal, planted: true };
      continue;
    }
    const chain: ReturnType<typeof HumanLimbFit.chain> =
      HumanLimbFit.chain(limb);
    const end: IAutoMovieResolvedBone = placed!.get(chain.effector)!;
    contacts[limb] = {
      point: end.worldPosition,
      rotation: end.worldRotation,
      bend: placed!.get(chain.lower)!.worldPosition,
      reference: resolveHumanPosture.reference(over, limb),
      planted: true,
    };
  }
  return contacts;
}

/** The limb carrying a contact part, if the part belongs to a limb. */
function limbOf(
  part: IAutoMovieMotionHumanContactWindow["part"],
): AutoMovieHumanLimb | undefined {
  if (part === "seat" || part === "back") return undefined;
  const side: "left" | "right" = part.startsWith("left") ? "left" : "right";
  return `${side}${/(Hand|Arm)$/.test(part) ? "Arm" : "Leg"}`;
}
