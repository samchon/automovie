import type { IAutoMovieSwivelNear } from "@automovie/engine";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanPosture } from "./IHumanPosture";

/**
 * Index exact native free-leg dependencies without serializing their names.
 * Rich goals and foreign record shapes decline to the existing JSON owner.
 * A hash selects candidates only; every hit compares every binary64 value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines constructor-only right-leg scope, exact signed-zero/null/order dependencies, collision checking, delayed insertion and eviction ownership; read returns an unretained key on a miss, retain canonicalizes it only after a successful solve, and remove releases its bucket membership.
 * @evidence contracts/development/implementation.md#principled-implementation Exact numeric interning represents the same finite native solver inputs after the existing mirror/frame transformation. Skeleton and bone-name identifiers are private exact strings; full Object.is comparisons, rather than the FNV bucket hash, establish equality. Unsupported schemas and JSON hooks retain original serialization.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns only exact keys and their collision index; HumanLimbFitMemory owns the single shared LRU, numerical solve, result capture, counters and invalidation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rounded coordinates, approximate hash equality, fixture/name/time branch, numerical output or caller readiness flag is accepted. Leg-only scope reflects the currently closed free-goal schema; arm clearance dependencies remain with JSON.
 * @evidence contracts/development/implementation.md#efficient-algorithms One O(B) primitive snapshot and binary64 hash replace complete decimal/string serialization. A bucket checks O(B) exact values per collision; no speedup is claimed before measurement.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every goal/root/ordered clinical/placed/rival/near scalar is represented exactly under the unchanged body epoch; signed zero and nullable angles remain distinct. Candidate insertion waits for successful solve/capture, and retain rechecks canonical identity after synchronous reentry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body pool owns this index, at most the same4096 retained keys as its LRU. Eviction removes bucket membership; body invalidation releases all keys and the finite initial bone-name table. No pose, source, goal, reader or returned result is retained.
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
      near: IAutoMovieSwivelNear | undefined): prepareHumanContinuationKey.IKey | undefined {
      if (limb !== "rightLeg" || current.skeleton !== skeleton || current.root === null ||
        !closed(current, ["skeleton", "root", "joints"], true) ||
        !Array.isArray(current.joints) || Object.getPrototypeOf(current.joints) !== Array.prototype ||
        Reflect.ownKeys(current.joints).length !== current.joints.length + 1 ||
        Object.getOwnPropertyDescriptor(Object.prototype, "toJSON") !== undefined ||
        Object.getOwnPropertyDescriptor(Array.prototype, "toJSON") !== undefined ||
        Object.getPrototypeOf(Array.prototype) !== Object.prototype ||
        !closed(goal, ["point", "bend", "rotation"]) ||
        !closed(current.root, ["translation", "rotation", "scale"]) ||
        !closed(current.root.translation, ["x", "y", "z"]) ||
        !closed(current.root.rotation, ["x", "y", "z", "w"]) ||
        !closed(current.root.scale, ["x", "y", "z"]) ||
        !closed(goal.point, ["x", "y", "z"]) || !closed(goal.bend, ["x", "y", "z"]) ||
        (goal.rotation !== undefined && !closed(goal.rotation, ["x", "y", "z", "w"])) ||
        (rival !== undefined && !closed(rival, ["x", "y", "z"])) ||
        (near !== undefined && !closed(near, ["branch", "swivel", "tolerance"]))) return undefined;
      const values: number[] = [placed.length];
      for (const side of placed) {
        if (side !== "left" && side !== "right") return undefined;
        values.push(side === "left" ? 0 : 1);
      }
      values.push(near === undefined ? 0 : 1);
      if (near !== undefined) values.push(near.branch, near.swivel, near.tolerance);
      values.push(rival === undefined ? 0 : 1);
      if (rival !== undefined) values.push(rival.x, rival.y, rival.z);
      values.push(goal.rotation === undefined ? 0 : 1);
      if (goal.rotation !== undefined) values.push(goal.rotation.x, goal.rotation.y, goal.rotation.z, goal.rotation.w);
      values.push(goal.point.x, goal.point.y, goal.point.z, goal.bend.x, goal.bend.y, goal.bend.z,
        current.root.translation.x, current.root.translation.y, current.root.translation.z,
        current.root.rotation.x, current.root.rotation.y, current.root.rotation.z, current.root.rotation.w,
        current.root.scale.x, current.root.scale.y, current.root.scale.z, current.joints.length);
      if (!values.every(Number.isFinite)) return undefined;
      for (const joint of current.joints) {
        if (joint === undefined || !closed(joint, ["bone", "flexion", "abduction", "twist"], true)) return undefined;
        const bone: number | undefined = bones.get(joint.bone);
        if (bone === undefined ||
          (joint.flexion !== null && !Number.isFinite(joint.flexion)) ||
          (joint.abduction !== null && !Number.isFinite(joint.abduction)) ||
          (joint.twist !== null && !Number.isFinite(joint.twist))) return undefined;
        values.push(bone, joint.flexion === null ? Number.NaN : joint.flexion,
          joint.abduction === null ? Number.NaN : joint.abduction,
          joint.twist === null ? Number.NaN : joint.twist);
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
 * @evidence contracts/development/common.md#meaningful-documentation IKey is an exact primitive dependency vector and candidate-bucket hash; IPrepared reads without retaining, canonicalizes after successful solve and removes actual LRU evictions.
 * @evidence contracts/development/design.md#principled-representation Numbers retain metres, degrees and quaternion units without conversion; NaN is an internal null-axis marker and actual nonfinite inputs decline. Object.is preserves signed zero and no hash certifies equivalence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sole memory owner consumes read/retain/remove and opaque key identity; there is no solver flag, callback, source pose or duplicate result cache.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Skeleton/bone dictionaries come from the actual constructor pose, unknown names decline, and the numeric representation includes all currently supported free-leg dependencies rather than one action's constants.
 */
export namespace prepareHumanContinuationKey {
  /** Exact immutable-by-ownership scalar snapshot; hash only locates a candidate bucket. */
  export interface IKey { readonly hash: number; readonly values: readonly number[]; }
  /** The existing body LRU owns retention and calls remove for every evicted numeric key. */
  export interface IPrepared {
    /** Inspect this actual normalized constructor-owned request, declining rich schemas. */
    read(pose: IAutoMoviePose, limb: IHumanPosture.Limb, goal: IHumanPosture.IGoal,
      placed: readonly ("left" | "right")[], rival: IAutoMovieVector3 | undefined,
      near: IAutoMovieSwivelNear | undefined): IKey | undefined;
    /** Return the canonical key after successful result capture, accounting for reentry. */
    retain(key: IKey): IKey;
    /** Release membership when the shared LRU removes this exact key. */
    remove(key: IKey): void;
  }
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
