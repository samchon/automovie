import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanDigitFit } from "./HumanDigitFit";
import { IHumanPosture } from "./IHumanPosture";

/**
 * Select independent world digit goals that can change requested bone frames.
 * Attached, malformed or unsupported goals keep the complete original request.
 * The body is the unchanged canonical producer's rig/surface snapshot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines observational frame demand, independent world-goal domain, canonical body premise and full fallback.
 * @evidence contracts/development/implementation.md#principled-implementation Digit fitting writes only its named three clinical joints after all limbs; an observation depends on it only when one of those joints is an actual skeleton ancestor. World goals introduce no other digit dependency.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This selector owns only dependency/eligibility decisions; HumanDigitFit preserves ordered authored admission before omission and the existing engine solver handles every retained goal unchanged.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown/attached/nonfinite goals, missing chain/surface data and unsupported fields return the complete request; no raw goal, coupling, soft-IK rate, sample or physical acceptance bound changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds O(B) parent metadata, visits requested ancestors and scans at most ten three-joint goals; independent unobserved digits require no iterative fit, while a reduced request still receives ordered authored FK admission.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads current goals and actual canonical ancestry, borrowing retained goal records unchanged; no pose, target, previous digit solution or numerical callback is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary parent/ancestor sets end with selection; the at-most-ten-entry output borrows original goals and no body, reader, solve result or query history is retained.
 */
export function selectHumanDigitGoals(
  body: IHumanBody,
  digits: NonNullable<IHumanPosture["digits"]>,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
): NonNullable<IHumanPosture["digits"]> {
  try {
    if (Object.keys(digits).some((name: string): boolean => !NAMES.has(name))) return digits;
    const byName: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map();
    for (const bone of body.skeleton.bones) byName.set(bone.bone, bone);
    const ancestors: Set<AutoMovieHumanoidBone> = new Set();
    for (const bone of requested) {
      let current: AutoMovieHumanoidBone | null | undefined = bone;
      while (current !== undefined && current !== null && !ancestors.has(current)) {
        ancestors.add(current);
        current = byName.get(current)?.parent;
      }
    }
    const selected: NonNullable<IHumanPosture["digits"]> = {};
    let omitted: boolean = false;
    for (const digit of IHumanPosture.DIGITS) {
      const goal: IHumanPosture.IDigitGoal | undefined = digits[digit];
      if (goal === undefined) continue;
      if (
        !Object.keys(goal).every((key: string): boolean => FIELDS.has(key)) ||
        (goal.surface !== "tip" && goal.surface !== "pad") || !finite(goal.point) ||
        (goal.normal !== undefined && (!finite(goal.normal) ||
          Math.hypot(goal.normal.x, goal.normal.y, goal.normal.z) === 0))
      ) return digits;
      const side: "left" | "right" = digit.startsWith("left") ? "left" : "right";
      const name: string = digit.slice(side.length);
      const chain: readonly AutoMovieHumanoidBone[] = HumanDigitFit.bones(side, name);
      if (chain.some((bone: AutoMovieHumanoidBone): boolean => !body.topology.reachableBones.has(bone))) return digits;

      // The same closed digit/surface/side product HumanDigitFit uses names its canonical region.
      const key: AutoMovieHumanoidRegion = `${name.toLowerCase()}${goal.surface === "tip" ? "Tip" : "Pad"}${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion;
      const region: IHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] = body.surfaces.regions[key];
      if (region === undefined || !body.topology.reachableBones.has(region.bone) ||
        !finite(region.point) || !finite(region.normal)) return digits;
      if (chain.some((bone: AutoMovieHumanoidBone): boolean => ancestors.has(bone))) selected[digit] = goal;
      else omitted = true;
    }
    return omitted ? selected : digits;
  } catch {
    return digits;
  }
}

/** Finite scalar world/local geometry is required before omitting a numerical fit. */
function finite(point: IAutoMovieVector3): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
}

/** Unknown raw names conservatively preserve the original full digit reader. */
const NAMES: ReadonlySet<string> = new Set(IHumanPosture.DIGITS);

/** An on attachment can depend on another fitted digit and therefore keeps the original order. */
const FIELDS: ReadonlySet<string> = new Set(["point", "normal", "surface"]);
