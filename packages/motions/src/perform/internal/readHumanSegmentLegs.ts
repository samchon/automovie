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

import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";

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

/**
 * The legs' continuation seeds of a displayed second, under every name the
 * read's leaf fits a leg by: the plain leaf's (`leaf::<leg>`) and each leaf
 * under the running overlays, named by their ordinals in placement order
 * (`HumanSegmentOverlay.overlaid`), every subset of them since a fading overlay
 * keeps both the leaf with it and the one without. The seeds are the plan's leg
 * chain at the second (`IAutoMovieMotionHumanSegment.IPrepared.legs`, made by
 * `readHumanSegmentLegs.chain` once the performance is prepared; none
 * before), for a free leg alone (a goal neither planted nor in contact):
 * a leg is only continued from them, never placed at them, and its fit takes
 * the closed-form root nearest the seed (on another branch where the seed's has
 * no legal one). A planted leg keeps its own fit: where its goal asks no turn
 * of the foot, the chain's swivel would turn the foot about the ankle and move
 * its sole.
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
  const out: Map<string, IAutoMovieSwivelSeed> = new Map();
  if (
    segment.prepared === undefined ||
    (!free(limbs.leftLeg) && !free(limbs.rightLeg))
  )
    return out;
  const chain: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =
    segment.prepared.legs(local);
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

/** The plan-level leg chain the display's legs continue. */
export namespace readHumanSegmentLegs {
  /**
   * A plan's leg chain: the legs' seeds at knots on the plan's frame grid
   * (`AutoMovieMotionHumanArmCourse.STEP`), the first knot fitted cold and each
   * later one continuing the knot before it, so each knot takes the closed-form
   * root on the branch the knot before chose and refines only where that root
   * is illegal (Tolani, Goswami and Badler 2000, section 3.2.4, the feasible
   * swivel nearest the desired one): the branch is chosen once per knot, the
   * temporal coherence a display keeps a knee's side by. Between two knots on
   * the same branch the continuous swivel angle (Tolani, Goswami and Badler
   * 2000, section 3) is joined by a quintic carrying each knot's swivel,
   * velocity and acceleration, the minimum-jerk form of Flash and Hogan 1985,
   * so the swivel is C² across the knots; across a branch change, or where a
   * leg has no seed at one of the two knots, a second takes the knot at or
   * before it. The chain reads the plan's own leg goals alone. It is prepared
   * once, every knot fitted in order from the plan's start, when the
   * performance is prepared (`IAutoMovieMotionHumanSegment.IPrepared.legs`),
   * and a second is a closed-form evaluation of the prepared knots.
   *
   * @param plan The segment's plan.
   * @param body The performer's body.
   * @returns Each leg's seed at a plan second.
   * @evidence contracts/development/common.md#meaningful-documentation States the knot grid, the chaining, the branch choice per knot, the curve between knots and when the chain is prepared.
   * @evidence contracts/development/implementation.md#principled-implementation Warm-starting each knot from the knot before, on the branch it chose, is the temporal coherence of engine two-bone IK; the root nearest the seed is the closed-form feasible swivel nearest the desired one (Tolani §3.2.4); the swivel between knots is a quintic Hermite of position, velocity and acceleration, the minimum-jerk form (Flash and Hogan 1985), C² at the knots.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation fits the knots and their rates; the reader finds a second's knot interval and evaluates its quintic.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each knot is a full fit of the plan's own leg goals; no curve crosses a branch change; a display only continues from a seed, against its own goals.
   * @evidence contracts/development/implementation.md#efficient-algorithms One legs-only fit per knot at preparation, each a closed-form root where it is legal, on a plan posture demanding only the root, trunk and leg channels; a read is constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The knots are the solver trajectory of the placed action, prepared once and shared by every read of it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Held by the placed action's reader: one knot per step of the plan's duration, released with the action.
   */
  export function chain(
    plan: IAutoMovieMotionHumanActionPlan,
    body: IAutoMovieMotionHumanBody,
  ): (
    seconds: number,
  ) => ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> {
    const step: number = AutoMovieMotionHumanArmCourse.STEP;
    const count: number = Math.floor(plan.duration / step + 1e-9) + 1;
    const knots: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>[] = [];
    for (let k: number = 0; k < count; ++k)
      knots.push(
        frame(
          body,
          plan.posture(Math.min(plan.duration, k * step), LEGGED),
          knots[k - 1],
        ),
      );
    const rates: ReadonlyMap<AutoMovieHumanLimb, IRates>[] = knots.map(
      (
        _: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>,
        k: number,
      ): ReadonlyMap<AutoMovieHumanLimb, IRates> => knotRates(knots, k, step),
    );
    return (
      seconds: number,
    ): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> => {
      const at: number = Math.min(plan.duration, Math.max(0, seconds));
      const k: number = Math.min(count - 1, Math.floor(at / step + 1e-9));
      const here: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =
        knots[k]!;
      const next:
        | ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>
        | undefined = knots[k + 1];
      const u: number = (at - k * step) / step;
      if (next === undefined || !(u > 0)) return here;
      const out: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
      for (const [limb, seed] of here) {
        const after: IAutoMovieSwivelSeed | undefined = next.get(limb);
        if (after === undefined || after.branch !== seed.branch) {
          out.set(limb, seed);
          continue;
        }
        const a: IRates = rates[k]!.get(limb)!;
        const b: IRates = rates[k + 1]!.get(limb)!;
        out.set(limb, {
          ...seed,
          swivel: quintic(
            seed.swivel,
            a,
            seed.swivel + turn(after.swivel - seed.swivel),
            b,
            step,
            u,
          ),
        });
      }
      return out;
    };
  }

  /**
   * A knot's swivel rates on its own branch: velocity by the central difference
   * of its neighbours on the same branch (one-sided where one is missing) and
   * acceleration by the second difference where both are on it, none otherwise;
   * differences are taken the short way round.
   */
  function knotRates(
    knots: readonly ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>[],
    k: number,
    step: number,
  ): ReadonlyMap<AutoMovieHumanLimb, IRates> {
    const out: Map<AutoMovieHumanLimb, IRates> = new Map();
    for (const [limb, seed] of knots[k]!) {
      const before: IAutoMovieSwivelSeed | undefined = knots[k - 1]?.get(limb);
      const after: IAutoMovieSwivelSeed | undefined = knots[k + 1]?.get(limb);
      const back: number | undefined =
        before === undefined || before.branch !== seed.branch
          ? undefined
          : turn(seed.swivel - before.swivel);
      const ahead: number | undefined =
        after === undefined || after.branch !== seed.branch
          ? undefined
          : turn(after.swivel - seed.swivel);
      out.set(limb, {
        velocity:
          back !== undefined && ahead !== undefined
            ? (back + ahead) / (2 * step)
            : (back ?? ahead ?? 0) / step,
        acceleration:
          back !== undefined && ahead !== undefined
            ? (ahead - back) / (step * step)
            : 0,
      });
    }
    return out;
  }

  /**
   * The quintic Hermite between two knots of position, velocity and
   * acceleration (the minimum-jerk boundary form of Flash and Hogan 1985).
   */
  function quintic(
    p0: number,
    a: IRates,
    p1: number,
    b: IRates,
    h: number,
    u: number,
  ): number {
    const u2: number = u * u;
    const u3: number = u2 * u;
    const u4: number = u3 * u;
    const u5: number = u4 * u;
    return (
      (1 - 10 * u3 + 15 * u4 - 6 * u5) * p0 +
      (u - 6 * u3 + 8 * u4 - 3 * u5) * h * a.velocity +
      (0.5 * u2 - 1.5 * u3 + 1.5 * u4 - 0.5 * u5) * h * h * a.acceleration +
      (0.5 * u3 - u4 + 0.5 * u5) * h * h * b.acceleration +
      (-4 * u3 + 7 * u4 - 3 * u5) * h * b.velocity +
      (10 * u3 - 15 * u4 + 6 * u5) * p1
    );
  }

  /** An angle difference taken the short way round, degrees in (-180, 180]. */
  function turn(degrees: number): number {
    const wrapped: number = degrees - 360 * Math.round(degrees / 360);
    return wrapped === -180 ? 180 : wrapped;
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

/** A knot's swivel rates on its branch. */
interface IRates {
  /** Degrees per second. */
  velocity: number;

  /** Degrees per second squared. */
  acceleration: number;
}
