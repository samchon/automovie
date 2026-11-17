import {
  type IAutoMovieResolvedBone,
  type IAutoMovieSwivelNear,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  getConstraint,
  hingedArmSwivel,
  jointRomOvershoot,
  samplePoseVelocity,
  swingTwistRange,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanPosturePreparation } from "./HumanPosturePreparation";
import { HumanLimbFitFrame } from "./HumanLimbFitFrame";
import { HumanPostureRaw } from "./HumanPostureRaw";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureRigCheck } from "./prepareHumanPostureRigCheck";
import type { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import type { resolveHumanPosture } from "./resolveHumanPosture";

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
 * @evidence contracts/development/common.md#meaningful-documentation Defines curve ownership, normalized phase/second units, canonical directed dyadic interval construction, exact current solves, supported free-goal domain, full physical gates, cold fallback and strict-cell numerical observations. An accepted interval endpoint is not a global smoothness certificate.
 * @evidence contracts/development/implementation.md#principled-implementation Predictor-corrector continuation uses the existing near-basin hinged solver. A directed interval's actual endpoint correction either meets the original branch/swivel and one-degree postclamp rotation gates or requires deterministic left-before-right subdivision. Every actual query is independently corrected and checked for ankle position, requested orientation, pole side and ROM with those same gates. Query-local failure can descend without changing the parent's canonical classification. A unique smooth local basin remains a premise; neither sampled endpoints nor cell metadata certify global C1 or analytic root selection.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One correct/observe pair owns all actual fit and physical gates. interval retains canonical endpoint classification; boundary constructs canonical preceding anchors; solve selects that prepared interval then actually fits the current target. A usable phase-zero or midpoint anchor starts the hierarchy; absent both, the original one-sided cold-reference policy remains. Precision-limited or physically unusable cases use cold fitting. The companion cell reader copies only an actual strict-interior canonical result's numerical construction facts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No body/law/fixture switch, approximate result key, sampled global certificate, fixed physical grid, skipped bound, interpolated pose or whole-pose cache is used. Every target still runs the actual fit and full checks. Query-dependent failures never mutate another target's canonical choice; cell evidence excludes boundaries and query-local refinement and does not assert a unique engine root. Unsupported contexts retain ordinary cold fitting.
 * @evidence contracts/development/implementation.md#efficient-algorithms For C retained intervals and depth D, selection uses O(D) map lookups and normally one current correction instead of repeating the same coarse failures and recursive anchor reconstruction. A newly demanded canonical boundary still pays actual correction/subdivision. Endpoint classification is reused while resident; eviction may recompute it. Each correction retains actual demanded FK and changed-tuple ROM scoring. C is bounded by the numerical-retention budget, not by weakened angular resolution; gains remain unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact directed dyadic boundaries under the same immutable curve and live rig identify one canonical left-anchor construction. Only primitive seeds, quaternions and endpoint classification share; every requested target is fitted afresh through the existing exact continuous-policy memory. No child links affect construction after eviction. ROM memoization still requires exact current nullable coordinates. Cell observations belong only to the actual issued preparation and are copied before exposure.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A curve owns at most 1024 unlinked numerical interval records, one origin, fixed ROM scorers/last tuples, and one cold-reference anchor per finite binary64 level when no origin exists. Recursive boundary construction owns O(D) temporary anchors; adjacent midpoint collapse ends refinement. Rig invalidation clears all numerical populations. Weak current-preparation cell records own fixed-size copied limb seeds only until that preparation releases; no pose, output history, FK loan, callback handle or task is retained in interval data.
 */
export function prepareHumanFreeCurve(
  body: IHumanBody,
  at: (share: number) => IHumanPosture,
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
  const intervals: Map<string, IInterval> = new Map();
  let origin: IAnchor | undefined;
  let pivot: number = 0;
  let originRead: boolean = false;
  let supported: boolean = unchanged !== undefined && Number.isFinite(tolerance) && tolerance > 0 && tolerance < hingedArmSwivel.STEP;

  /** Actual current admission/solve remains the ordinary owner in every fallback. */
  function cold(share: number, resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined, anchor: boolean = false): HumanPosturePreparation.IPrepared {
    HumanLimbFitFrame.work(body, anchor ? "curveColdAnchors" : "curveColdFallbacks");
    return HumanPosturePreparation.continued(body, at(share), {}, resolution, projection);
  }

  /** Observe native output independently; no seed or fitted endpoint is a target substitute. */
  function observe(prepared: HumanPosturePreparation.IPrepared, raw: IHumanPosture,
    knownSeeds?: resolveHumanPosture.ISeeded["seeds"]): IAnchor | undefined {
    if (raw.rotation !== undefined || !HumanPostureRaw.eligible(raw)) return undefined;
    const limbs: [IHumanPosture.Limb, IHumanPosture.IGoal][] = Object.entries(raw.limbs) as [IHumanPosture.Limb, IHumanPosture.IGoal][];
    if (limbs.length === 0) return undefined;
    const names: Set<AutoMovieHumanoidBone> = new Set();
    for (const [limb] of limbs) {
      const side: "left" | "right" = limb === "leftLeg" ? "left" : "right";
      names.add(`${side}UpperLeg`); names.add(`${side}LowerLeg`); names.add(`${side}Foot`);
    }
    const source: HumanPosturePreparation.IObservation | undefined = HumanPosturePreparation.source(prepared, names);
    let bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    if (source === undefined) {
      const pose: HumanPosturePreparation.IPrepared["pose"] = prepared.pose;
      for (const joint of pose.joints)
        if (!legal(joint.bone, joint.flexion, joint.abduction, joint.twist)) return undefined;
      bones = poseBones(body, pose, undefined, names);
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
    const seeds: resolveHumanPosture.ISeeded["seeds"] = knownSeeds ?? HumanPosturePreparation.seeds(prepared);
    if (limbs.some(([limb]: [IHumanPosture.Limb, IHumanPosture.IGoal]): boolean => seeds[limb] === null || seeds[limb] === undefined)) return undefined;
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
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined): ICorrection {
    const raw: IHumanPosture = at(share);
    const near: resolveHumanPosture.INear = Object.fromEntries(Object.entries(prior.seeds).flatMap(
      ([limb, seed]: [string, resolveHumanPosture.ISeeded["seeds"][IHumanPosture.Limb]]): [IHumanPosture.Limb, IAutoMovieSwivelNear][] =>
        seed === null || seed === undefined ? [] : [[limb as IHumanPosture.Limb, { ...seed, tolerance }]],
    ));
    HumanLimbFitFrame.work(body, "curveProbes");
    const prepared: HumanPosturePreparation.IPrepared = HumanPosturePreparation.continued(body, raw, near, resolution, projection);
    const seeds: resolveHumanPosture.ISeeded["seeds"] = HumanPosturePreparation.seeds(prepared);
    const interior: boolean = Object.entries(seeds).every(([limb, seed]: [string, resolveHumanPosture.ISeeded["seeds"][IHumanPosture.Limb]]): boolean => {
      const before: resolveHumanPosture.ISeeded["seeds"][IHumanPosture.Limb] = prior.seeds[limb as IHumanPosture.Limb];
      return seed !== null && seed !== undefined && before !== null && before !== undefined && seed.branch === before.branch &&
        Math.abs(seed.swivel - before.swivel) < hingedArmSwivel.STEP - tolerance;
    });
    if (!interior) {
      HumanLimbFitFrame.work(body, "curveRefinements");
      return { kind: "refine" };
    }
    const value: IAnchor | undefined = observe(prepared, raw, seeds);
    if (value === undefined) return { kind: "unusable" };
    const continuous: boolean = value.rotations.length === prior.rotations.length && value.rotations.every(
      (rotation: IAutoMovieQuaternion, i: number): boolean => Quaternion.angleAfterNormalize(rotation, prior.rotations[i]!) * 180 / Math.PI <= hingedArmSwivel.STEP,
    );
    if (!continuous) {
      HumanLimbFitFrame.work(body, "curveRefinements");
      return { kind: "refine" };
    }
    HumanLimbFitFrame.work(body, "curveAccepted");
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
    const corrected: ICorrection = correct(to, left, resolution, projection);
    const value: IInterval = { from, to, left,
      right: corrected.kind === "accepted" ? corrected.anchor : undefined };
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
    if (node.right !== undefined) return node.right;
    const middle: number = from + (to - from) / 2;
    if (middle === from || middle === to) return undefined;
    const anchor: IAnchor | undefined = boundary(from, middle, left, resolution, projection);
    return anchor === undefined ? undefined : boundary(middle, to, anchor, resolution, projection);
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
    let local: boolean = false;
    for (;;) {
      const node: IInterval = interval(from, to, left, resolution, projection);
      if (node.right !== undefined) {
        const corrected: ICorrection = correct(share, left, resolution, projection);
        if (corrected.kind === "accepted") {
          const inside: boolean = share > Math.min(from, to) && share < Math.max(from, to);
          const strict: boolean = corrected.anchor.rotations.every(
            (rotation: IAutoMovieQuaternion, i: number): boolean => Quaternion.angleAfterNormalize(rotation, left.rotations[i]!) * 180 / Math.PI < hingedArmSwivel.STEP,
          );
          if (!local && inside && strict)
            CELLS.set(corrected.prepared, { from, to, share,
              left: structuredClone(left.seeds), current: structuredClone(corrected.anchor.seeds),
              right: structuredClone(node.right.seeds) });
          return corrected;
        }
        if (corrected.kind === "unusable") return { prepared: cold(share, resolution, projection) };
        local = true;
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
    const prepared: HumanPosturePreparation.IPrepared = cold(share, resolution, projection, true);
    const value: IAnchor | undefined = observe(prepared, at(share));
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
    HumanLimbFitFrame.work(body, "curveQueries");
    if (!supported || !(share > 0 && share < 1) || !prepareHumanPoseResolution.isNativeSource(resolution)) return cold(share, resolution, projection);
    if (!unchanged!()) {
      supported = false; origin = undefined; anchors.clear(); intervals.clear(); checked.clear();
      return cold(share, resolution, projection);
    }
    if (!originRead) {
      originRead = true;
      const initial: IHumanPosture = at(0);
      if (initial.rotation !== undefined || !HumanPostureRaw.eligible(initial) || Object.keys(initial.limbs).length === 0) {
        supported = false; return cold(share, resolution, projection);
      }
      const prepared: HumanPosturePreparation.IPrepared = cold(0, resolution, projection, true);
      origin = observe(prepared, at(0));
      if (origin === undefined) {
        const middle: HumanPosturePreparation.IPrepared = cold(0.5, resolution, projection, true);
        const interior: IAnchor | undefined = observe(middle, at(0.5));
        if (interior !== undefined) { pivot = 0.5; origin = interior; }
      }
    }
    return solve(share, resolution, projection).prepared;
  };
}

/**
 * Numerical construction facts of an actual strict-interior canonical solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation cell returns an independent observation only for an actual curve-issued strict-interior canonical solve; ICell documents directed normalized boundaries and actual branch/swivel records in degrees. Undefined covers seams, local refinement, unanchored/cold results and foreign preparations.
 * @evidence contracts/development/design.md#principled-representation The record describes one actual numerical construction: canonical interval boundaries, query phase and actual left/current/right limb seeds. Private weak issuance establishes origin; it does not represent global smoothness, unique engine roots or analytic derivative validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanFreeCurveRates consumes the interval observation alongside separately proven actual engine-root provenance. Existing resolver-owned seed types retain branch/swivel ownership without a second pose, fit or public readiness flag.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No caller can register a cell or supply eligibility. Copied or forged preparations have no weak entry; returned records are independent and contain numerical facts rather than a caller-writable success switch.
 */
export namespace prepareHumanFreeCurve {
  /** One canonical cell observation; all seed swivels are in clinical degrees. */
  export interface ICell {
    /** Directed interval start in normalized phase, not seconds. */
    from: number;
    /** Directed interval end in normalized phase, not seconds. */
    to: number;
    /** Actual query phase, strictly between the directed boundaries. */
    share: number;
    /** Actual validated canonical start branch and swivel for every fitted limb. */
    left: resolveHumanPosture.ISeeded["seeds"];
    /** Actual accepted current branch and swivel, independently physically checked. */
    current: resolveHumanPosture.ISeeded["seeds"];
    /** Actual validated canonical endpoint branch and swivel. */
    right: resolveHumanPosture.ISeeded["seeds"];
  }

  /**
   * Copy the actual issued cell's numeric facts, or decline an unissued result.
   * This fixed-size observation neither fits a pose nor certifies an engine
   * root, a derivative, or continuity across a cell boundary.
   */
  export function cell(prepared: HumanPosturePreparation.IPrepared): ICell | undefined {
    const value: ICell | undefined = CELLS.get(prepared);
    return value === undefined ? undefined : structuredClone(value);
  }
}

/** Only primitive fit seeds and native quaternion observations survive a query. */
interface IAnchor {
  /** Actual branch and degree swivel of the validated canonical predecessor. */
  seeds: resolveHumanPosture.ISeeded["seeds"];
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
  /** Directed normalized phase boundaries, uniquely generated by bisection. */
  from: number;
  /** Directed normalized phase boundaries, uniquely generated by bisection. */
  to: number;
  /** Actual validated source branch/quaternions at from. */
  left: IAnchor;
  /** Actual validated endpoint, absent when canonical subdivision is required. */
  right: IAnchor | undefined;
}

/** At most 1024 unlinked numerical interval records per owned curve; eviction changes work only. */
const INTERVAL_CAPACITY: number = 1024;

/** Only the actual curve's strict canonical current results can own a cell observation. */
const CELLS: WeakMap<HumanPosturePreparation.IPrepared, prepareHumanFreeCurve.ICell> = new WeakMap();
