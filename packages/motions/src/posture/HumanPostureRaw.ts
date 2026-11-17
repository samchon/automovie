import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Raw translation and the original observable serialization/admission policy.
 * These operations establish no solved-pose or mutable-body capability.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines raw finite/free-goal scope, signed-zero JSON observations, graph-preserving authoritative translation and the separation from numerical proof.
 * @evidence contracts/development/design.md#principled-representation Finite raw authoring, ordinary JSON observation and source-plus-displacement construction are distinct operations; actual owned source/graph/rig evidence remains with HumanPosturePreparation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The preparation owner consumes eligible/signature/translated; eligibility shares the finite-vector and goal-field predicates. No new source, fit, cache key, resolved flag or body state is represented.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A JSON string is only an observed prefilter, never proof of physical equality. World-attached demands keep their frames and aliasing cannot apply a displacement twice to the same goal object.
 */
export namespace HumanPostureRaw {
  /**
   * Retain the original finite joint/free-world-leg admission observation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States supported six-field authoring with an optional finite numeric rigid rotation, finite triples/points/quaternions, free-leg context and malformed-input refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Root/angle, tuple and goal reads retain their order and exclude attached/contact contexts; optional numeric about/turn fields extend the rigid-equivariant domain. Numerical validity and actual constructed graph provenance remain separate solver/issuer responsibilities.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A guarded ordered predicate shares only the fixed goal-field/vector helpers and does not obtain any rig/FK state.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No range/tolerance coercion or resolved state is inferred; exceptions decline reuse and arbitrary contexts continue through ordinary resolution.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits J raw triples and G goals once with the existing Object.values/entries and finite checks, retaining no inspected-input verdict.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the same supported raw-domain predicate is shared by preparation/transport consumers; each call repeats its actual current reads and no prior query supplies admission.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The predicate retains no input, result, callback or resource.
   */
  export function eligible(posture: IAutoMovieMotionHumanPosture): boolean {
    try {
      if (Object.keys(posture).some((key: string): boolean => !POSTURE_KEYS.has(key)) ||
        !vector(posture.root) || ![posture.yaw, posture.pitch, posture.roll].every(Number.isFinite)) return false;
      for (const joint of Object.values(posture.joints))
        if (joint === undefined || joint.length !== 3 || !joint.every(Number.isFinite)) return false;
      for (const [limb, goal] of Object.entries(posture.limbs)) {
        if ((limb !== "leftLeg" && limb !== "rightLeg") || goal === undefined) return false;
        if (!goalFields(goal) || !vector(goal.point) || !vector(goal.bend) ||
          (goal.rotation !== undefined && ![goal.rotation.x, goal.rotation.y, goal.rotation.z, goal.rotation.w].every(Number.isFinite))) return false;
      }
      if (posture.rotation !== undefined &&
        (!vector(posture.rotation.about) || ![posture.rotation.turn.x, posture.rotation.turn.y, posture.rotation.turn.z, posture.rotation.turn.w].every(Number.isFinite) ||
          Object.keys(posture.rotation).some((key: string): boolean => key !== "about" && key !== "turn"))) return false;
      return true;
    } catch { return false; }
  }

  /**
   * Observe the existing complete JSON walk, distinguishing signed zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines ordinary getter/toJSON order, signed-zero lowering and unreadable/cyclic refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The original JSON.stringify and replacer execute once over the supplied raw object; only numeric negative zero lowers to its existing sentinel string.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One serialization owner preserves actual observation while constructor-owned graph checks separately establish numerical reuse proof.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Performs no component early exit or alternate hook/proxy probing, and its string cannot independently certify a pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms Ordinary JSON traversal visits the complete selected graph in O(S) serialized data and produces one string; no second serializer or cached callback result is used.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The serialization implementation is shared, while every invocation executes its original raw observations independently and retains no previous verdict.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one string or undefined and retains no authoring object or callback.
   */
  export function signature(posture: IAutoMovieMotionHumanPosture): string | undefined {
    try {
      return JSON.stringify(posture, (_key: string, value: unknown): unknown =>
        typeof value === "number" && Object.is(value, -0) ? "number:-0" : value);
    } catch { return undefined; }
  }

  /**
   * Copy original demands and apply one world-metre displacement per goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines complete owned output, original source displacement, attached/world contexts and alias-once mutation.
   * @evidence contracts/development/implementation.md#principled-implementation structuredClone preserves the complete authored graph; subtract new minus source root, copy the requested root, then add that displacement to each free point/bend. One identity set prevents shared limb/digit goal objects from moving twice.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Existing vector arithmetic owns every changed coordinate; one copied graph and bounded shifted-goal set retain graph relationships and unchanged metadata.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No achieved endpoint replaces a demand, attached goals/external colliders keep their own frames and every root/point/bend expression keeps its original arithmetic order.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(S) full authoring clone and O(G) goal work/set entries preserve public nested ownership for S raw data and G limb/digit goals; no numerical solve occurs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses original source values only to construct this fresh output; the shifted set coalesces only actual aliased goal identity within this translation, never distinct query results.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Output belongs to the caller; the temporary goal set ends on return/throw and no source, target, reader or previous translation is retained.
   */
  export function translated(source: IAutoMovieMotionHumanPosture, root: IAutoMovieVector3): IAutoMovieMotionHumanPosture {
    const out: IAutoMovieMotionHumanPosture = structuredClone(source);
    const delta: IAutoMovieVector3 = Vector3.subtract(root, source.root);
    out.root = { ...root };
    const shifted: Set<object> = new Set();
    for (const goal of Object.values(out.limbs)) {
      if (goal === undefined || goal.on !== undefined || shifted.has(goal)) continue;
      shifted.add(goal);
      goal.point = Vector3.add(goal.point, delta);
      goal.bend = Vector3.add(goal.bend, delta);
    }
    for (const goal of Object.values(out.digits ?? {}))
      if (goal !== undefined && goal.on === undefined && !shifted.has(goal)) {
        shifted.add(goal);
        goal.point = Vector3.add(goal.point, delta);
      }
    if (out.rotation !== undefined) out.rotation.about = Vector3.add(out.rotation.about, delta);
    return out;
  }

  /**
   * Check the existing three finite vector reads in x/y/z order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines finite numeric world components and original short-circuit order.
   * @evidence contracts/development/implementation.md#principled-implementation Number.isFinite rejects nonnumeric/nonfinite components without coercion, using the original ordered reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar predicate owns raw eligibility's existing vector reads.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No descriptors, prototypes, rounding, normalization or value repair are introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work with at most three actual reads and no allocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Every supplied current vector is read independently.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function vector(value: IAutoMovieVector3): boolean {
    return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
  }

  /**
   * Keep the original point/bend/rotation-only enumerable goal-key domain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the free-goal key scope without claiming scalar or source validity.
   * @evidence contracts/development/implementation.md#principled-implementation Original Object.keys observation and a fixed membership test exclude contact/reference/world-context fields from this narrow proof domain.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This one predicate owns raw eligibility's existing free-goal key set.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no descriptor/prototype probing and certifies neither a body nor a solved result.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(K) key work for the actual goal; the fixed three-name set never grows.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads every current goal independently, retaining no callback or predicate result.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds only the fixed immutable-domain key set and no input/resource.
   */
  export function goalFields(goal: IAutoMovieHumanLimbGoal): boolean {
    return !Object.keys(goal).some((key: string): boolean => !GOAL_KEYS.has(key));
  }
}

/** Other top-level fields carry context outside this raw proof domain. */
const POSTURE_KEYS: ReadonlySet<string> = new Set(["root", "yaw", "pitch", "roll", "joints", "limbs", "rotation"]);
/** Contact/plant/reference/external contexts require ordinary solving. */
const GOAL_KEYS: ReadonlySet<string> = new Set(["point", "bend", "rotation"]);
