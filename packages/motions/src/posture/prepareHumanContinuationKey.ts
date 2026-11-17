import type { IAutoMovieSwivelNear } from "@automovie/engine";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanPosture } from "./IHumanPosture";

/**
 * Index a limb fit's numeric dependencies without serializing their names.
 * Rich goals and foreign record shapes decline to the existing JSON owner.
 * A hash selects candidates only; every hit compares every binary64 value.
 *
 * Two policies share one index, each value list led by its policy. The
 * continuous policy keeps its constructor-only right-leg scope and exact
 * values. The ordinary policy covers every limb and reads each numeric input
 * on the memory's grid (`HumanLimbFitFrame.grid`, `Math.round(value / grid)`),
 * the same rounding the ordinary JSON key applies, so two requests share an
 * ordinary numeric key exactly when their grid readings agree. Its goals may
 * carry a point, bend, rotation, planted flag, contact, elbow policy and
 * reference; an attached goal, other bodies' colliders or point limits
 * decline to JSON.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines both policies' scopes, the grid reading, exact signed-zero/null/order dependencies, collision checking, delayed insertion and eviction ownership; read returns an unretained key on a miss, retain canonicalizes it only after a successful solve, and remove releases its bucket membership.
 * @evidence contracts/development/implementation.md#principled-implementation Numeric interning represents the same solver inputs after the existing mirror/frame transformation: exactly for the continuous policy, on the ordinary JSON key's own grid for the ordinary policy, with presence markers for optional members and a dynamic bone-name table assigning each name one stable index. Full Object.is comparisons, rather than the FNV bucket hash, establish equality. Unsupported schemas and JSON hooks retain original serialization.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns only keys and their collision index; HumanLimbFitMemory owns the single shared LRU, numerical solve, result capture, counters and invalidation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coarser rounding than the ordinary key's grid, approximate hash equality, fixture/name/time branch, numerical output or caller readiness flag is accepted. Goals whose dependencies are not encoded here (attachments, colliders, limits) keep JSON.
 * @evidence contracts/development/implementation.md#efficient-algorithms One O(B) primitive snapshot and binary64 hash replace complete decimal/string serialization with its per-value replacer call. A bucket checks O(B) exact values per collision; no speedup is claimed before measurement.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every goal/root/ordered clinical/placed/rival/near scalar is represented under the unchanged body epoch; signed zero and nullable angles remain distinct, and optional members carry presence markers. Candidate insertion waits for successful solve/capture, and retain rechecks canonical identity after synchronous reentry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body pool owns this index, at most the same 4096 retained keys as its LRU. Eviction removes bucket membership; body invalidation releases all keys and the bone-name table, which grows only with distinct bone names. No pose, source, goal, reader or returned result is retained.
 */
export function prepareHumanContinuationKey(pose: IAutoMoviePose): prepareHumanContinuationKey.IPrepared {
  const skeleton: string = pose.skeleton;
  const bones: Map<string, number> = new Map();
  for (const joint of pose.joints)
    if (!bones.has(joint.bone)) bones.set(joint.bone, bones.size);
  const buckets: Map<number, prepareHumanContinuationKey.IKey[]> = new Map();
  const bits: DataView = new DataView(new ArrayBuffer(8));

  /** Resolve a collision by full exact comparison, including negative zero. */
  function found(key: prepareHumanContinuationKey.IKey): prepareHumanContinuationKey.IKey | undefined {
    return buckets.get(key.hash)?.find((candidate: prepareHumanContinuationKey.IKey): boolean =>
      candidate.values.length === key.values.length && candidate.values.every(
        (value: number, i: number): boolean => Object.is(value, key.values[i])));
  }

  return {
    read(current: IAutoMoviePose, limb: IHumanPosture.Limb, goal: IHumanPosture.IGoal,
      placed: readonly ("left" | "right")[], rival: IAutoMovieVector3 | undefined,
      near: IAutoMovieSwivelNear | undefined,
      policy: "ordinary" | "continuous" = "continuous",
      grid?: number): prepareHumanContinuationKey.IKey | undefined {
      const ordinary: boolean = policy === "ordinary";
      if (ordinary && !(grid !== undefined && grid > 0)) return undefined;
      if ((!ordinary && limb !== "rightLeg") || current.skeleton !== skeleton || current.root === null ||
        !closed(current, ["skeleton", "root", "joints"], true) ||
        !Array.isArray(current.joints) || Object.getPrototypeOf(current.joints) !== Array.prototype ||
        Reflect.ownKeys(current.joints).length !== current.joints.length + 1 ||
        Object.getOwnPropertyDescriptor(Object.prototype, "toJSON") !== undefined ||
        Object.getOwnPropertyDescriptor(Array.prototype, "toJSON") !== undefined ||
        Object.getPrototypeOf(Array.prototype) !== Object.prototype ||
        !closed(goal, ordinary ? ORDINARY_GOAL : ["point", "bend", "rotation"]) ||
        !closed(current.root, ["translation", "rotation", "scale"]) ||
        !closed(current.root.translation, ["x", "y", "z"]) ||
        !closed(current.root.rotation, ["x", "y", "z", "w"]) ||
        !closed(current.root.scale, ["x", "y", "z"]) ||
        !closed(goal.point, ["x", "y", "z"]) || !closed(goal.bend, ["x", "y", "z"]) ||
        (goal.rotation !== undefined && !closed(goal.rotation, ["x", "y", "z", "w"])) ||
        (goal.contact !== undefined && !closed(goal.contact, ["x", "y", "z"])) ||
        (goal.planted !== undefined && typeof goal.planted !== "boolean") ||
        (goal.elbow !== undefined && goal.elbow !== "strain") ||
        (goal.reference !== undefined && !reference(goal.reference)) ||
        (rival !== undefined && !closed(rival, ["x", "y", "z"])) ||
        (near !== undefined && !closed(near, ["branch", "swivel", "tolerance"]))) return undefined;

      // Structural markers (policy, limb, counts, presence, bone indices) are
      // exact; every input number is read on the ordinary grid when asked,
      // with a signed zero made positive, as the ordinary JSON key prints it.
      const at = (value: number): number => ordinary ? Math.round(value / grid!) + 0 : value;
      const values: number[] = [ordinary ? 1 : 0, LIMBS.indexOf(limb), placed.length];
      for (const side of placed) {
        if (side !== "left" && side !== "right") return undefined;
        values.push(side === "left" ? 0 : 1);
      }
      values.push(near === undefined ? 0 : 1);
      if (near !== undefined) values.push(at(near.branch), at(near.swivel), at(near.tolerance));
      values.push(rival === undefined ? 0 : 1);
      if (rival !== undefined) values.push(at(rival.x), at(rival.y), at(rival.z));
      values.push(goal.rotation === undefined ? 0 : 1);
      if (goal.rotation !== undefined)
        values.push(at(goal.rotation.x), at(goal.rotation.y), at(goal.rotation.z), at(goal.rotation.w));
      if (ordinary) {
        values.push(goal.planted === undefined ? 0 : goal.planted ? 2 : 1);
        values.push(goal.elbow === undefined ? 0 : 1);
        values.push(goal.contact === undefined ? 0 : 1);
        if (goal.contact !== undefined) values.push(at(goal.contact.x), at(goal.contact.y), at(goal.contact.z));
        values.push(goal.reference === undefined ? 0 : goal.reference.weight === undefined ? 1 : 2);
        if (goal.reference !== undefined) {
          for (const v of [...goal.reference.upper, ...goal.reference.lower]) values.push(at(v));
          if (goal.reference.weight !== undefined) values.push(at(goal.reference.weight));
        }
      }
      values.push(at(goal.point.x), at(goal.point.y), at(goal.point.z),
        at(goal.bend.x), at(goal.bend.y), at(goal.bend.z),
        at(current.root.translation.x), at(current.root.translation.y), at(current.root.translation.z),
        at(current.root.rotation.x), at(current.root.rotation.y), at(current.root.rotation.z), at(current.root.rotation.w),
        at(current.root.scale.x), at(current.root.scale.y), at(current.root.scale.z), current.joints.length);
      if (!values.every(Number.isFinite)) return undefined;
      for (const joint of current.joints) {
        if (joint === undefined || !closed(joint, ["bone", "flexion", "abduction", "twist"], true)) return undefined;
        if (ordinary && !bones.has(joint.bone)) bones.set(joint.bone, bones.size);
        const bone: number | undefined = bones.get(joint.bone);
        if (bone === undefined ||
          (joint.flexion !== null && !Number.isFinite(joint.flexion)) ||
          (joint.abduction !== null && !Number.isFinite(joint.abduction)) ||
          (joint.twist !== null && !Number.isFinite(joint.twist))) return undefined;
        values.push(bone, joint.flexion === null ? Number.NaN : at(joint.flexion),
          joint.abduction === null ? Number.NaN : at(joint.abduction),
          joint.twist === null ? Number.NaN : at(joint.twist));
      }
      let hash: number = 2166136261;
      for (const value of values) {
        bits.setFloat64(0, value, true);
        hash = Math.imul(hash ^ bits.getUint32(0, true), 16777619);
        hash = Math.imul(hash ^ bits.getUint32(4, true), 16777619);
      }
      const key: prepareHumanContinuationKey.IKey = { hash, values };
      return found(key) ?? key;
    },
    retain(key: prepareHumanContinuationKey.IKey): prepareHumanContinuationKey.IKey {
      const previous: prepareHumanContinuationKey.IKey | undefined = found(key);
      if (previous !== undefined) return previous;
      const bucket: prepareHumanContinuationKey.IKey[] | undefined = buckets.get(key.hash);
      if (bucket === undefined) buckets.set(key.hash, [key]);
      else bucket.push(key);
      return key;
    },
    remove(key: prepareHumanContinuationKey.IKey): void {
      const bucket: prepareHumanContinuationKey.IKey[] | undefined = buckets.get(key.hash);
      if (bucket === undefined) return;
      const index: number = bucket.indexOf(key);
      if (index !== -1) bucket.splice(index, 1);
      if (bucket.length === 0) buckets.delete(key.hash);
    },
  };
}

/**
 * Private numeric keys and the body-pool collision index contract.
 *
 * @evidence contracts/development/common.md#meaningful-documentation IKey is a primitive dependency vector and candidate-bucket hash; IPrepared reads without retaining, canonicalizes after successful solve and removes actual LRU evictions.
 * @evidence contracts/development/design.md#principled-representation Numbers retain metres, degrees and quaternion units, exactly or as whole counts of the ordinary grid; NaN is an internal null-axis marker and actual nonfinite inputs decline. Object.is preserves signed zero and no hash certifies equivalence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sole memory owner consumes read/retain/remove and opaque key identity; there is no solver flag, callback, source pose or duplicate result cache.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The skeleton comes from the actual constructor pose and bone names receive stable indices; the representation includes every encoded goal dependency rather than one action's constants.
 */
export namespace prepareHumanContinuationKey {
  /** Exact immutable-by-ownership scalar snapshot; hash only locates a candidate bucket. */
  export interface IKey { readonly hash: number; readonly values: readonly number[]; }
  /** The existing body LRU owns retention and calls remove for every evicted numeric key. */
  export interface IPrepared {
    /** Inspect this normalized request under a policy (continuous when omitted; ordinary needs its positive grid), declining unencoded schemas. */
    read(pose: IAutoMoviePose, limb: IHumanPosture.Limb, goal: IHumanPosture.IGoal,
      placed: readonly ("left" | "right")[], rival: IAutoMovieVector3 | undefined,
      near: IAutoMovieSwivelNear | undefined, policy?: "ordinary" | "continuous", grid?: number): IKey | undefined;
    /** Return the canonical key after successful result capture, accounting for reentry. */
    retain(key: IKey): IKey;
    /** Release membership when the shared LRU removes this exact key. */
    remove(key: IKey): void;
  }
}

/** The limbs in a fixed order, so a limb is one number in a key. */
const LIMBS: readonly IHumanPosture.Limb[] = ["leftArm", "rightArm", "leftLeg", "rightLeg"];

/** The goal members an ordinary numeric key encodes; any other member keeps JSON. */
const ORDINARY_GOAL: readonly string[] = ["point", "bend", "rotation", "planted", "contact", "elbow", "reference"];

/** A plain reference of two clinical triples and an optional weight. */
function reference(value: IHumanPosture.IReference): boolean {
  return closed(value, ["upper", "lower", "weight"]) &&
    [value.upper, value.lower].every((triple: readonly number[]): boolean =>
      Array.isArray(triple) && triple.length === 3 && Reflect.ownKeys(triple).length === 4) &&
    (value.weight === undefined || typeof value.weight === "number");
}

/** Native constructors issue plain own-data records; unknown keys/accessors require JSON. */
function closed(record: object, allowed: readonly string[], ordered: boolean = false): boolean {
  if (Object.getPrototypeOf(record) !== Object.prototype) return false;
  const keys: readonly (string | symbol)[] = Reflect.ownKeys(record);
  if (ordered && (keys.length !== allowed.length || keys.some(
    (key: string | symbol, index: number): boolean => key !== allowed[index]))) return false;
  return keys.every((key: string | symbol): boolean => {
    if (typeof key !== "string" || !allowed.includes(key)) return false;
    const property: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(record, key);
    return property !== undefined && property.enumerable === true && "value" in property;
  });
}
