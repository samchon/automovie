import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieBone,
  IAutoMovieHumanDigitGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanDigitFit } from "./HumanDigitFit";
import { HumanPosture } from "./HumanPosture";

/**
 * Select independent world digit goals that can change requested bone frames.
 * Attached, malformed or unsupported goals keep the complete original request.
 * The body is the unchanged canonical producer's rig/surface snapshot.
 */
export function selectHumanDigitGoals(
  body: IAutoMovieMotionHumanBody,
  digits: NonNullable<IAutoMovieMotionHumanPosture["digits"]>,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
): NonNullable<IAutoMovieMotionHumanPosture["digits"]> {
  try {
    if (Object.keys(digits).some((name: string): boolean => !NAMES.has(name)))
      return digits;
    const byName: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map();
    for (const bone of body.skeleton.bones) byName.set(bone.bone, bone);
    const ancestors: Set<AutoMovieHumanoidBone> = new Set();
    for (const bone of requested) {
      let current: AutoMovieHumanoidBone | null | undefined = bone;
      while (
        current !== undefined &&
        current !== null &&
        !ancestors.has(current)
      ) {
        ancestors.add(current);
        current = byName.get(current)?.parent;
      }
    }
    const selected: NonNullable<IAutoMovieMotionHumanPosture["digits"]> = {};
    let omitted: boolean = false;
    for (const digit of HumanPosture.DIGITS) {
      const goal: IAutoMovieHumanDigitGoal | undefined = digits[digit];
      if (goal === undefined) continue;
      if (
        !Object.keys(goal).every((key: string): boolean => FIELDS.has(key)) ||
        (goal.surface !== "tip" && goal.surface !== "pad") ||
        !finite(goal.point) ||
        (goal.normal !== undefined &&
          (!finite(goal.normal) ||
            Math.hypot(goal.normal.x, goal.normal.y, goal.normal.z) === 0))
      )
        return digits;
      const side: AutoMovieHumanSide = digit.startsWith("left")
        ? "left"
        : "right";
      const name: string = digit.slice(side.length);
      const chain: readonly AutoMovieHumanoidBone[] = HumanDigitFit.bones(
        side,
        name,
      );
      if (
        chain.some(
          (bone: AutoMovieHumanoidBone): boolean =>
            !body.topology.reachableBones.has(bone),
        )
      )
        return digits;

      // The same closed digit/surface/side product HumanDigitFit uses names its canonical region.
      const key: AutoMovieHumanoidRegion =
        `${name.toLowerCase()}${goal.surface === "tip" ? "Tip" : "Pad"}${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion;
      const region: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
        body.surfaces.regions[key];
      if (
        region === undefined ||
        !body.topology.reachableBones.has(region.bone) ||
        !finite(region.point) ||
        !finite(region.normal)
      )
        return digits;
      if (
        chain.some((bone: AutoMovieHumanoidBone): boolean =>
          ancestors.has(bone),
        )
      )
        selected[digit] = goal;
      else omitted = true;
    }
    return omitted ? selected : digits;
  } catch {
    return digits;
  }
}

/**
 * Finite scalar world/local geometry is required before omitting a numerical
 * fit.
 */
function finite(point: IAutoMovieVector3): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Number.isFinite(point.z)
  );
}

/** Unknown raw names conservatively preserve the original full digit reader. */
const NAMES: ReadonlySet<string> = new Set(HumanPosture.DIGITS);

/**
 * An on attachment can depend on another fitted digit and therefore keeps the
 * original order.
 */
const FIELDS: ReadonlySet<string> = new Set(["point", "normal", "surface"]);
