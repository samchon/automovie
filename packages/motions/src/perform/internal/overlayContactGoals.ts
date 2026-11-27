import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanLimbFit } from "../../posture/HumanLimbFit";
import { poseBones } from "../../posture/internal/poseBones";
import { turnHumanPosture } from "../../posture/internal/turnHumanPosture";

/**
 * The active limb contacts of one overlay before its fade moves them: a
 * joint-only path contributes its complete displayed limb frame while fading
 * and none at full weight.
 *
 * Moved unchanged from `HumanSegmentOverlay` to keep that file under the
 * repository's 500-line limit; its caller and behaviour are unchanged.
 */
export function overlayContactGoals(
  overlay: IAutoMovieMotionHumanSegment.IOverlay,
  written: IAutoMovieMotionHumanPosture,
  over: IAutoMoviePose,
  seconds: number,
  person: IAutoMovieMotionHumanSegment.IPerson,
  weight: number,
  resolution?: () => ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
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
      reference: HumanLimbFit.reference(over, limb),
      planted: true,
    };
  }
  return contacts;
}

/** The limb carrying a contact part, if the part belongs to a limb. */
function limbOf(
  part: IAutoMovieMotionHumanContactWindow["part"],
): AutoMovieHumanLimb | undefined {
  if (part === "seat" || part === "back" || part === "head" || part === "chest")
    return undefined;
  const side: AutoMovieHumanSide = part.startsWith("left") ? "left" : "right";
  return `${side}${/(Hand|Arm)$/.test(part) ? "Arm" : "Leg"}`;
}
