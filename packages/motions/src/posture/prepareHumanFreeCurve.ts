import {
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  getConstraint,
  hingedArmSwivel,
  jointRomOvershoot,
  samplePoseVelocity,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPosturePreparation } from "./HumanPosturePreparation";
import { HumanPostureRaw } from "./HumanPostureRaw";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { prepareHumanPostureRigCheck } from "./prepareHumanPostureRigCheck";

/**
 * Continue a constructor-owned, pure free-leg curve from its canonical
 * endpoint or verified midpoint anchor and canonical dyadic intervals. This constrained-IK policy is separate from
 * public cold minimization: current goals remain actual solves, and no pose
 * is replayed or interpolated. The supplied producer owns copied curve
 * coefficients and never exposes or changes them during this preparation.
 *
 * @param body The curve's actual canonical body; changed live rig prerequisites permanently return this curve to ordinary cold fitting.
 * @param at Pure constructor-owned authoring at a phase in [0,1], with fresh records and closed direct-joint/free-world-leg goals only.
 * @param duration The physical duration in seconds, used by the existing velocity-continuation angular-resolution law.
 * @returns A current-phase preparation reader borrowing only a genuine native synchronous FK/projector source; foreign sources keep ordinary cold behavior.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines curve ownership, normalized phase/second units, canonical directed dyadic interval construction, exact current solves, supported free-goal domain, full physical gates and cold fallback. An accepted interval endpoint is not a global smoothness certificate.
 * @evidence contracts/development/implementation.md#principled-implementation Predictor-corrector continuation uses the existing near-basin hinged solver. A directed interval's actual endpoint correction either meets the original branch/swivel and one-degree postclamp rotation gates or requires deterministic left-before-right subdivision. Every actual query is independently corrected and checked for ankle position, requested orientation, pole side and ROM with those same gates. Query-local failure can descend without changing the parent's canonical classification. A unique smooth local basin remains a premise; sampled endpoints do not certify global C1 or analytic root selection.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One correct/observe pair owns all actual fit and physical gates. interval retains canonical endpoint classification; boundary constructs canonical preceding anchors; solve selects that prepared interval then actually fits the current target. A usable phase-zero or midpoint anchor starts the hierarchy; absent both, the original one-sided cold-reference policy remains. Precision-limited or physically unusable cases use cold fitting.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No body/law/fixture switch, approximate result key, sampled global certificate, fixed physical grid, skipped bound, interpolated pose or whole-pose cache is used. Every target still runs the actual fit and full checks. Query-dependent failures never mutate another target's canonical choice. Unsupported contexts retain ordinary cold fitting.
 * @evidence contracts/development/implementation.md#efficient-algorithms For C retained intervals and depth D, selection uses O(D) map lookups and normally one current correction instead of repeating the same coarse failures and recursive anchor reconstruction. The geodesic triangle inequality can reject a canonical endpoint before IK when its requested foot turn exceeds the sum of both acceptance radii and the angular roundoff reserve. Remaining boundaries pay actual correction/subdivision. Endpoint classification is reused while resident; eviction may recompute it. Each correction retains actual demanded FK and changed-tuple ROM scoring. C is bounded by the numerical-retention budget, not by weakened angular resolution; gains remain unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact directed dyadic boundaries under the same immutable curve and live rig identify one canonical left-anchor construction. Only primitive seeds, quaternions and endpoint classification share; every requested target is fitted afresh through the existing exact continuous-policy memory. No child links affect construction after eviction. ROM memoization still requires exact current nullable coordinates.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A curve owns at most 1024 unlinked numerical interval records, one origin, fixed ROM scorers/last tuples, at most four observed-bone sets with their bound demands (one per sequence of leg goals), and one cold-reference anchor per finite binary64 level when no origin exists. Recursive boundary construction owns O(D) temporary anchors; adjacent midpoint collapse ends refinement. Rig invalidation clears all numerical populations. No pose, output history, FK loan, callback handle or task is retained in interval data.
 */
export function prepareHumanFreeCurve(
  body: IAutoMovieMotionHumanBody,
  at: (share: number) => IAutoMovieMotionHumanPosture,
  duration: number,
): (share: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>) => HumanPosturePreparation.IPrepared {
  const unchanged: (() => boolean) | undefined = prepareHumanPostureRigCheck(body);
  const tolerance: number = Number.isFinite(duration) && duration > 0
    ? samplePoseVelocity.tolerance(1e-3, duration) : NaN;
  const radians: number = ROM_TOLERANCE * Math.PI / 180;
  const legality: Map<AutoMovieHumanoidBone, (joint: IAutoMovieJointPose) => number> = new Map();
  const checked: Map<AutoMovieHumanoidBone, readonly [number | null, number | null, number | null]> = new Map();
  for (const bone of body.skeleton.bones)
    legality.set(bone.bone, jointRomOvershoot.prepare(bone.bone,
      getConstraint(bone.bone, bone.constraint ?? null), swingTwistRange.of(bone.bone, body.skeleton)));
  const anchors: Map<number, { share: number; value: IAnchor }> = new Map();
  const observations: Map<number, IObserved> = new Map();
  const intervals: Map<string, IInterval> = new Map();
  let origin: IAnchor | undefined;
  let pivot: number = 0;
  let originRead: boolean = false;
  let supported: boolean = unchanged !== undefined && Number.isFinite(tolerance) && tolerance > 0 && tolerance < hingedArmSwivel.STEP;

  /** Actual current admission/solve remains the ordinary owner in every fallback. */
  function cold(share: number, resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined, raw: IAutoMovieMotionHumanPosture = at(share)): HumanPosturePreparation.IPrepared {
    return HumanPosturePreparation.continued(body, raw, {}, resolution, projection);
  }

  /** Observe native output independently; no seed or fitted endpoint is a target substitute. */
  function observe(prepared: HumanPosturePreparation.IPrepared, raw: IAutoMovieMotionHumanPosture,
    knownSeeds?: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"]): IAnchor | undefined {
    if (raw.rotation !== undefined || !HumanPostureRaw.eligible(raw)) return undefined;
    const limbs: [AutoMovieHumanLimb, IAutoMovieHumanLimbGoal][] = Object.entries(raw.limbs) as [AutoMovieHumanLimb, IAutoMovieHumanLimbGoal][];
    if (limbs.length === 0) return undefined;

    // The observed bones depend only on which sides' goals the posture
    // holds, in their order: read once per curve for each such sequence.
    let code: number = 0;
    for (const [limb] of limbs) code = 3 * code + (limb === "leftLeg" ? 1 : 2);
    let observed: IObserved | undefined = observations.get(code);
    if (observed === undefined) {
      const names: Set<AutoMovieHumanoidBone> = new Set();
      for (const [limb] of limbs) {
        const side: "left" | "right" = limb === "leftLeg" ? "left" : "right";
        names.add(`${side}UpperLeg`); names.add(`${side}LowerLeg`); names.add(`${side}Foot`);
      }
      observed = { names, read: poseBones.prepare(body, names) };
      observations.set(code, observed);
    }
    const names: ReadonlySet<AutoMovieHumanoidBone> = observed.names;
    const source: HumanPosturePreparation.IObservation | undefined = HumanPosturePreparation.source(prepared, names);
    let bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    if (source === undefined) {
      const pose: HumanPosturePreparation.IPrepared["pose"] = prepared.pose;
      for (const joint of pose.joints)
        if (!legal(joint.bone, joint.flexion, joint.abduction, joint.twist)) return undefined;
      bones = observed.read(pose);
    } else {
      for (let i: number = 0; i < source.names.length; ++i)
        if (!legal(source.names[i]!, source.values[3 * i]!, source.values[3 * i + 1]!, source.values[3 * i + 2]!)) return undefined;
      bones = source.bones;
    }
    const rotations: IAutoMovieQuaternion[] = [];
    for (const [limb, goal] of limbs) {
      const side: "left" | "right" = limb === "leftLeg" ? "left" : "right";
      const hip: IAutoMovieResolvedBone = bones.get(`${side}UpperLeg`)!;
      const knee: IAutoMovieResolvedBone = bones.get(`${side}LowerLeg`)!;
      const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const length: number = Vector3.distance(hip.worldPosition, knee.worldPosition) + Vector3.distance(knee.worldPosition, foot.worldPosition);
      const precision: number = length * radians;
      if (!(precision > 0) || Vector3.distance(foot.worldPosition, goal.point) > precision) return undefined;
      if (goal.rotation !== undefined && Quaternion.angleAfterNormalize(foot.worldRotation, Quaternion.normalize(goal.rotation)) * 180 / Math.PI > ROM_TOLERANCE) return undefined;
      const reach: IAutoMovieVector3 = Vector3.subtract(goal.point, hip.worldPosition);
      const distance: number = Vector3.length(reach);
      if (!(distance > precision)) return undefined;
      const axis: IAutoMovieVector3 = Vector3.scale(reach, 1 / distance);
      const off: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 => {
        const offset: IAutoMovieVector3 = Vector3.subtract(point, hip.worldPosition);
        return Vector3.subtract(offset, Vector3.scale(axis, Vector3.dot(offset, axis)));
      };
      const bent: IAutoMovieVector3 = off(knee.worldPosition);
      const asked: IAutoMovieVector3 = off(goal.bend);
      if (!(Vector3.length(bent) > precision) || !(Vector3.length(asked) > precision) || !(Vector3.dot(bent, asked) > 0)) return undefined;
      rotations.push(hip.worldRotation, knee.worldRotation, foot.worldRotation);
    }
    const seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] = knownSeeds ?? HumanPosturePreparation.seeds(prepared);
    if (limbs.some(([limb]: [AutoMovieHumanLimb, IAutoMovieHumanLimbGoal]): boolean => seeds[limb] === null || seeds[limb] === undefined)) return undefined;
    return { seeds, rotations };
  }

  /** Pure fixed-epoch ROM admission reuses only exactly equal actual nullable coordinates. */
  function legal(bone: AutoMovieHumanoidBone, flexion: number | null, abduction: number | null, twist: number | null): boolean {
    const previous: readonly [number | null, number | null, number | null] | undefined = checked.get(bone);
    if (previous !== undefined && Object.is(previous[0], flexion) &&
      Object.is(previous[1], abduction) && Object.is(previous[2], twist)) return true;
    if (!((legality.get(bone)?.({ bone, flexion, abduction, twist }) ?? Infinity) <= ROM_TOLERANCE)) return false;
    checked.set(bone, [flexion, abduction, twist]);
    return true;
  }

  /** Fit this actual target and retain the original physical and local-basin gates. */
  function correct(share: number, prior: IAnchor,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
    raw: IAutoMovieMotionHumanPosture = at(share)): ICorrection {
    const near: IAutoMovieMotionHumanResolveHumanPosture.INear = Object.fromEntries(Object.entries(prior.seeds).flatMap(
      ([limb, seed]: [string, IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][AutoMovieHumanLimb]]): [AutoMovieHumanLimb, IAutoMovieSwivelNear][] =>
        seed === null || seed === undefined ? [] : [[limb as AutoMovieHumanLimb, { ...seed, tolerance }]],
    ));
    const prepared: HumanPosturePreparation.IPrepared = HumanPosturePreparation.continued(body, raw, near, resolution, projection);
    const seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] = HumanPosturePreparation.seeds(prepared);
    const interior: boolean = Object.entries(seeds).every(([limb, seed]: [string, IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][AutoMovieHumanLimb]]): boolean => {
      const before: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][AutoMovieHumanLimb] = prior.seeds[limb as AutoMovieHumanLimb];
      return seed !== null && seed !== undefined && before !== null && before !== undefined && seed.branch === before.branch &&
        Math.abs(seed.swivel - before.swivel) < hingedArmSwivel.STEP - tolerance;
    });
    if (!interior) {
      return { kind: "refine" };
    }
    const value: IAnchor | undefined = observe(prepared, raw, seeds);
    if (value === undefined) return { kind: "unusable" };
    const continuous: boolean = value.rotations.length === prior.rotations.length && value.rotations.every(
      (rotation: IAutoMovieQuaternion, i: number): boolean => Quaternion.angleAfterNormalize(rotation, prior.rotations[i]!) * 180 / Math.PI <= hingedArmSwivel.STEP,
    );
    if (!continuous) {
      return { kind: "refine" };
    }
    return { kind: "accepted", prepared, anchor: value };
  }

  /**
   * Classify one canonical directed dyadic interval once. Its endpoint fit is
   * only a seed construction, never a certificate for an unsolved interior.
   * Each interval has one canonical parent and left-anchor construction, so
   * eviction rebuilds the same data regardless of previous query order.
   */
  function interval(from: number, to: number, left: IAnchor,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined): IInterval {
    const key: string = `${from}:${to}`;
    const known: IInterval | undefined = intervals.get(key);
    if (known !== undefined) {
      intervals.delete(key);
      intervals.set(key, known);
      return known;
    }
    const raw: IAutoMovieMotionHumanPosture = at(to);
    const corrected: ICorrection | undefined = excludesFootTurn(raw, left)
      ? undefined : correct(to, left, resolution, projection, raw);
    const value: IInterval = { direct: corrected?.kind === "accepted",
      boundary: corrected?.kind === "accepted" ? corrected.anchor : undefined };
    intervals.set(key, value);

    // This is a retained-work budget, not a physical grid or an error limit.
    // Eviction affects recomputation only; nodes contain no linked children.
    if (intervals.size > INTERVAL_CAPACITY) intervals.delete(intervals.keys().next().value!);
    return value;
  }

  /** Resolve a boundary through canonical left-before-right subdivision only. */
  function boundary(from: number, to: number, left: IAnchor,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined): IAnchor | undefined {
    const node: IInterval = interval(from, to, left, resolution, projection);
    if (node.boundary !== undefined) return node.boundary ?? undefined;
    const middle: number = from + (to - from) / 2;
    const anchor: IAnchor | undefined = middle === from || middle === to
      ? undefined : boundary(from, middle, left, resolution, projection);
    node.boundary = anchor === undefined ? null : boundary(middle, to, anchor, resolution, projection) ?? null;
    return node.boundary ?? undefined;
  }

  /**
   * Reuse canonical interval preparation, then solve every current target.
   * A current failure may descend into canonical children, but never changes
   * its parent's endpoint classification or another query's choice of seed.
   */
  function solve(share: number, resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined): ISolved {
    if (origin === undefined) return unanchored(share, resolution, projection);
    if (share === pivot) return { prepared: cold(share, resolution, projection) };
    let from: number = pivot;
    let to: number = share < pivot ? 0 : 1;
    let left: IAnchor = origin;
    for (;;) {
      const node: IInterval = interval(from, to, left, resolution, projection);
      if (node.direct) {
        const corrected: ICorrection = correct(share, left, resolution, projection);
        if (corrected.kind === "accepted") return corrected;
        if (corrected.kind === "unusable") return { prepared: cold(share, resolution, projection) };
      }
      const middle: number = from + (to - from) / 2;
      if (middle === from || middle === to) return { prepared: cold(share, resolution, projection) };
      if (to > from ? share <= middle : share >= middle) to = middle;
      else {
        const anchor: IAnchor | undefined = boundary(from, middle, left, resolution, projection);
        if (anchor === undefined) return { prepared: cold(share, resolution, projection) };
        from = middle;
        left = anchor;
      }
    }
  }

  /** A retained anchor always has the same canonical construction, even after eviction. */
  function seedAt(share: number, level: number, resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined): IAnchor | undefined {
    if (share === pivot) return origin;
    const kept: { share: number; value: IAnchor } | undefined = anchors.get(level);
    if (kept?.share === share) return kept.value;
    const raw: IAutoMovieMotionHumanPosture = at(share);
    const prepared: HumanPosturePreparation.IPrepared = cold(share, resolution, projection, raw);
    const value: IAnchor | undefined = observe(prepared, raw);
    if (value !== undefined) anchors.set(level, { share, value });
    return value;
  }

  /** Correct actual goals from canonical preceding anchors, never from query order. */
  function unanchored(share: number, resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined): ISolved {
    const direction: number = share < pivot ? -1 : 1;
    const extent: number = direction < 0 ? pivot : 1 - pivot;
    const progress: number = extent === 0 ? 0 : Math.abs(share - pivot) / extent;
    let previous: number = -1;
    for (let level: number = 0, scale: number = 1; Number.isFinite(scale); ++level, scale *= 2) {
      let before: number = Math.floor(progress * scale) / scale;
      if (before === progress) before -= 1 / scale;
      if (before < 0 || !(before < progress)) return { prepared: cold(share, resolution, projection) };
      if (before === previous) continue;
      previous = before;
      const anchor: number = pivot + direction * extent * before;
      if (anchor === share) return { prepared: cold(share, resolution, projection) };
      const prior: IAnchor | undefined = seedAt(anchor, level, resolution, projection);
      if (prior === undefined) {
        if (anchor === pivot) continue;
        return { prepared: cold(share, resolution, projection) };
      }
      const corrected: ICorrection = correct(share, prior, resolution, projection);
      if (corrected.kind === "accepted") return corrected;
      if (corrected.kind === "unusable") return { prepared: cold(share, resolution, projection) };
    }
    return { prepared: cold(share, resolution, projection) };
  }

  return (share: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>): HumanPosturePreparation.IPrepared => {
    if (!supported || !(share > 0 && share < 1) || !prepareHumanPoseResolution.isNativeSource(resolution)) return cold(share, resolution, projection);
    if (!unchanged!()) {
      supported = false; origin = undefined; anchors.clear(); intervals.clear(); checked.clear();
      return cold(share, resolution, projection);
    }
    if (!originRead) {
      originRead = true;
      const initial: IAutoMovieMotionHumanPosture = at(0);
      if (initial.rotation !== undefined || !HumanPostureRaw.eligible(initial) || Object.keys(initial.limbs).length === 0) {
        supported = false; return cold(share, resolution, projection);
      }
      const prepared: HumanPosturePreparation.IPrepared = cold(0, resolution, projection, initial);
      origin = observe(prepared, initial);
      if (origin === undefined) {
        const raw: IAutoMovieMotionHumanPosture = at(0.5);
        const middle: HumanPosturePreparation.IPrepared = cold(0.5, resolution, projection, raw);
        const interior: IAnchor | undefined = observe(middle, raw);
        if (interior !== undefined) { pivot = 0.5; origin = interior; }
      }
    }
    return solve(share, resolution, projection).prepared;
  };
}

/**
 * A validated previous foot and a current orientation goal bound a canonical
 * interval before IK. An accepted foot lies within ROM_TOLERANCE of its
 * goal and within STEP of the previous achieved orientation. A second ROM
 * tolerance is reserved for the independently evaluated quaternion angles.
 * This excludes only a direct interval; its ordinary subdivision and every
 * actual queried target still use their original correction policies.
 */
function excludesFootTurn(raw: IAutoMovieMotionHumanPosture, prior: IAnchor): boolean {
  if (raw.rotation !== undefined || !HumanPostureRaw.eligible(raw)) return false;
  const goals: readonly IAutoMovieHumanLimbGoal[] = Object.values(raw.limbs);
  if (goals.length * 3 !== prior.rotations.length) return false;
  for (let index: number = 0; index < goals.length; ++index) {
    const goal: IAutoMovieQuaternion | undefined = goals[index]!.rotation;
    if (goal === undefined) continue;
    const previous: IAutoMovieQuaternion = prior.rotations[3 * index + 2]!;
    const angle: number = Quaternion.angleAfterNormalize(previous, Quaternion.normalize(goal)) * 180 / Math.PI;
    if (angle > hingedArmSwivel.STEP + 2 * ROM_TOLERANCE) return true;
  }
  return false;
}

/** The bones a curve observes for one sequence of leg goals, and the rig's bound demand of them. */
interface IObserved {
  /** The legs' hip, knee and ankle bones, in the goals' order. */
  names: ReadonlySet<AutoMovieHumanoidBone>;

  /** Those bones of a pose, read through the bound demand. */
  read: ReturnType<typeof poseBones.prepare>;
}

/** Only primitive fit seeds and native quaternion observations survive a query. */
interface IAnchor {
  /** Actual branch and degree swivel of the validated canonical predecessor. */
  seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"];
  /** Actual postclamp chain world rotations, in supported goal insertion order. */
  rotations: readonly IAutoMovieQuaternion[];
}

/** Same-call current solve and already completed physical observation, never a cross-query answer. */
interface ISolved {
  /** Current independently issued canonical source. */
  prepared: HumanPosturePreparation.IPrepared;
  /** Present only when this same solve completed every actual physical/continuity check. */
  anchor?: IAnchor;
}

/** Only a validated correction carries a current preparation and numerical anchor. */
type ICorrection = { kind: "accepted"; prepared: HumanPosturePreparation.IPrepared; anchor: IAnchor }
  | { kind: "refine" | "unusable" };

/** A canonical interval owns numeric anchors only, without child links or poses. */
interface IInterval {
  /** Whether the original endpoint fit admits correcting interior requests directly. */
  direct: boolean;
  /** Validated endpoint of the canonical path, null if subdivision exhausted the phase precision. */
  boundary: Boundary;
}

/** Undefined before subdivision, null for an exhausted path, or its actual right anchor. */
type Boundary = IAnchor | null | undefined;

/** At most 1024 unlinked numerical interval records per owned curve; eviction changes work only. */
const INTERVAL_CAPACITY: number = 1024;
