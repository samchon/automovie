import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../compose/AutoMovieMotionHumanArmCourse";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";

/**
 * The legs' continuation seeds of a displayed second, under every name the
 * read's leaf fits a leg by: the plain leaf's (`leaf::<leg>`) and each leaf
 * under the running overlays, named by their ordinals in placement order
 * (`HumanSegmentOverlay.overlaid`), every subset of them since a fading overlay
 * keeps both the leaf with it and the one without. The seeds are the plan's leg
 * chain at the frame at or before the second (`segment.legSeeds`, prepared by
 * `readHumanSegmentLegs.chain` when the action is placed), for a free leg alone
 * (a goal neither planted nor in contact): a leg is only continued from them,
 * never placed at them, and its fit takes the closed-form root nearest the seed
 * (on another branch where the seed's has no legal one). A planted leg keeps
 * its own fit: where its goal asks no turn of the foot, the chain's swivel
 * would turn the foot about the ankle and move its sole.
 *
 * @param person The person.
 * @param segment The action.
 * @param t Film seconds.
 * @param local The action's plan second of `t`.
 * @param limbs The read's limb goals, which tell a free leg from a planted one.
 * @returns The legs' seeds by fit name.
 */
export function readHumanSegmentLegs(
  person: IAutoMovieMotionHumanSegment.IPerson,
  segment: IAutoMovieMotionHumanSegment,
  t: number,
  local: number,
  limbs: IAutoMovieMotionHumanPosture["limbs"],
): Map<string, IAutoMovieSwivelSeed> {
  // Only a free leg takes a seed (below): with none at this second the
  // plan's chain is not read, so none of its frames is fitted for nothing.
  if (!free(limbs.leftLeg) && !free(limbs.rightLeg)) return new Map();
  const chain: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =
    segment.legSeeds(local);
  const out: Map<string, IAutoMovieSwivelSeed> = new Map();
  if (chain.size === 0) return out;
  const ordinals: number[] =
    person.overlays.length === 0
      ? []
      : HumanSegmentOverlay.running(person, t).map(
          (overlay: IAutoMovieMotionHumanSegment.IOverlay): number =>
            person.overlays.indexOf(overlay),
        );
  for (let mask: number = 0; mask < 1 << ordinals.length; ++mask) {
    const tag: string = ordinals
      .filter((_: number, i: number): boolean => (mask & (1 << i)) !== 0)
      .join(",");
    for (const [limb, seed] of chain)
      // A planted or contact leg keeps its own fit, which sets the foot's
      // turn as authored where the goal asks none of it; the chain's swivel
      // would turn that foot about its ankle.
      if (free(limbs[limb])) out.set(`leaf:${tag}:${limb}`, seed);
  }
  return out;
}

/**
 * Whether a leg goal is free: given, neither planted nor in contact, so the leg
 * continues the chain's seed.
 */
function free(
  goal: IAutoMovieMotionHumanPosture["limbs"][AutoMovieHumanLimb],
): boolean {
  return (
    goal !== undefined && goal.planted !== true && goal.contact === undefined
  );
}

/** The plan-level leg chain the display's legs continue. */
export namespace readHumanSegmentLegs {
  /**
   * A plan's leg chain: the legs' seeds at every frame of the plan's clock
   * (`AutoMovieMotionHumanArmCourse.STEP`), the first frame fitted cold and
   * each later one continuing the frame before it, so each frame takes the
   * closed-form root on the branch the frame before chose and refines only
   * where that root is illegal (Tolani, Goswami and Badler 2000, section 3.2.4,
   * the feasible swivel nearest the desired one): the temporal coherence a
   * display keeps a knee's side by. A second takes the frame at or before it.
   * The chain reads the plan's own leg goals alone. Its reader is prepared
   * once, when the action is placed (`IAutoMovieMotionHumanSegment.legSeeds`),
   * and solves its frames in order from the plan's start up to the latest frame
   * a second has needed, so no frame depends on the order seconds are read in.
   *
   * @param plan The segment's plan.
   * @param body The performer's body.
   * @returns Each leg's seed at a plan second.
   * @evidence contracts/development/common.md#meaningful-documentation States the grid, the chaining, which frame a second takes and why the order of reads cannot matter.
   * @evidence contracts/development/implementation.md#principled-implementation Warm-starting each frame from the frame before, on the branch it chose, is the temporal coherence of engine two-bone IK; the root nearest the seed is the closed-form feasible swivel nearest the desired one (Tolani §3.2.4).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation returns the reader; the reader's own list of frames grows in order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each frame is a full fit of the plan's own leg goals; a display only continues from it, against its own goals.
   * @evidence contracts/development/implementation.md#efficient-algorithms One legs-only fit per frame of the plan, each a closed-form root where it is legal, on a plan posture demanding only the root, trunk and leg channels.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The frames are the solver trajectory of the placed action, kept by its reader and shared by every read of it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Held by the placed action's reader: at most one frame per step of the plan's duration, released with the action.
   */
  export function chain(
    plan: IAutoMovieMotionHumanActionPlan,
    body: IAutoMovieMotionHumanBody,
  ): (
    seconds: number,
  ) => ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> {
    const step: number = AutoMovieMotionHumanArmCourse.STEP;

    // The frames are solved in order from the plan's start, up to the frame a
    // read first needs: the plan's posture is read only once the performance
    // can show it, never while the action is being placed.
    const frames: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>[] = [];
    return (
      seconds: number,
    ): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> => {
      const index: number = Math.floor(
        Math.min(plan.duration, Math.max(0, seconds)) / step + 1e-9,
      );
      while (frames.length <= index)
        frames.push(
          frame(
            body,
            plan.posture(Math.min(plan.duration, frames.length * step), LEGGED),
            frames[frames.length - 1],
          ),
        );
      return frames[index]!;
    };
  }

  /**
   * One frame's leg seeds: the posture's leg goals alone, fitted cold or
   * continuing the frame before.
   */
  function frame(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    previous: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> | undefined,
  ): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const limb of LEGS)
      if (posture.limbs[limb] !== undefined) limbs[limb] = posture.limbs[limb];
    const seeds: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
    if (Object.keys(limbs).length === 0) return seeds;
    const near: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>> = {};
    for (const [limb, seed] of previous ?? [])
      near[limb] = { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
    const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      resolveHumanPosture.seeded(body, { ...posture, limbs }, undefined, near);
    for (const limb of LEGS) {
      const seed: IAutoMovieSwivelSeed | null | undefined = solved.seeds[limb];
      if (seed !== undefined && seed !== null) seeds.set(limb, seed);
    }
    return seeds;
  }

  /** The legs a chain fits. */
  const LEGS: readonly AutoMovieHumanLimb[] = ["leftLeg", "rightLeg"];

  /**
   * The channels a chain frame demands of the plan: a leg fit reads the root,
   * the trunk and the legs' own goals and joints alone (`HumanSegmentLegs`), so
   * a plan that honours the demand evaluates no arm, head or hand writer for a
   * frame: the required-bones evaluation of engine animation graphs.
   */
  const LEGGED: readonly AutoMovieMotionHumanChannel[] = [
    "root",
    "trunk",
    "leftLeg",
    "rightLeg",
  ];
}
