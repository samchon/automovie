import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";

/**
 * Record the actual native objects created by authoritative raw translation.
 * Later checks inspect only those exact original objects, never a replacement
 * child, so a forwarding Proxy cannot add metadata traps to the check.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines genuine translated-object provenance, complete ordered own-data snapshots, numeric/root/goal schema, callback refusal and replacement-safe checking.
 * @evidence contracts/development/implementation.md#principled-implementation The sole caller passes actual structuredClone/point-construction output, whose own data flags are known from construction. Closed containers/finite triples/vectors establish a complete graph; capture stores primitive/child values without rereading descriptors. Consumption compares only original native-object descriptors and values, independently of JSON serialization.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Construction records a bounded list of native nodes; the returned checker compares that list without following any new child. HumanPosturePreparation owns issuance, live rig checks, actual JSON observations and cold fallback.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No caller-set resolved state or JSON hash proves equality. Only the actual owned translator can supply the initial graph; extra metadata, functions, unsupported prototypes or inherited JSON hooks decline whole-pose evidence. A changed property/descriptor/order/child cannot certify cached numerical output.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(J+G) construction stores one values/key array per native node, without per-field descriptor objects; only later consumer checks read current descriptors. No redundant issuance check is needed because a closed own-data graph with no inherited JSON hooks cannot execute a callback during its signature walk. Retention is O(J+G), speedup unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual construction proves original native objects/data flags and pure serialization before public escape. Later Object.is scalar/child plus exact own metadata checks establish current prerequisites; source solve/rig proof remains separate. No prior mutable-output verdict is retained and no replacement child is observed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One weak candidate capability owns only its bounded original-node snapshot until that candidate is released. Replacement children are neither traversed nor retained, no public pose or reader is borrowed, and no timestamp/history/handle collection is added.
 */
export function prepareIssuedHumanPosture(posture: IAutoMovieMotionHumanPosture): (() => boolean) | undefined {
  try {
    if (!standardJson()) return undefined;
    const nodes: INode[] = [];
    const seen: Set<object> = new Set();
    const own: (value: object, names: readonly string[], array?: boolean) => boolean =
      (value: object, names: readonly string[], array: boolean = false): boolean => {
        const prototype: object = array ? Array.prototype : Object.prototype;
        if (Object.getPrototypeOf(value) !== prototype) return false;
        const keys: readonly (string | symbol)[] = Reflect.ownKeys(value);
        if (keys.length !== names.length || keys.some((key: string | symbol): boolean => typeof key !== "string" || !names.includes(key))) return false;
        if (seen.has(value)) return true;
        const fields: unknown[] = [];
        const record: Record<PropertyKey, unknown> = value as Record<PropertyKey, unknown>;
        for (const key of keys) {
          fields.push(record[key]);
        }
        seen.add(value);
        nodes.push({ value, prototype, keys, fields, array });
        return true;
      };
    const vector: (value: object, names: readonly string[]) => boolean =
      (value: object, names: readonly string[]): boolean => own(value, names) && names.every((key: string): boolean =>
        Number.isFinite((value as Record<string, unknown>)[key]));

    if (!own(posture, Object.hasOwn(posture, "rotation") ? ["root", "yaw", "pitch", "roll", "joints", "limbs", "rotation"] : ["root", "yaw", "pitch", "roll", "joints", "limbs"]) ||
      ![posture.yaw, posture.pitch, posture.roll].every(Number.isFinite) || !vector(posture.root, ["x", "y", "z"]) ||
      !own(posture.joints, Object.keys(posture.joints)) || !own(posture.limbs, Object.keys(posture.limbs))) return undefined;
    for (const tuple of Object.values(posture.joints))
      if (tuple === undefined || !Array.isArray(tuple) || !own(tuple, ["0", "1", "2", "length"], true) ||
        tuple.length !== 3 || !tuple.every(Number.isFinite)) return undefined;
    for (const [limb, goal] of Object.entries(posture.limbs)) {
      if ((limb !== "leftLeg" && limb !== "rightLeg") || goal === undefined ||
        !own(goal, Object.hasOwn(goal, "rotation") ? ["point", "bend", "rotation"] : ["point", "bend"]) ||
        !vector(goal.point, ["x", "y", "z"]) || !vector(goal.bend, ["x", "y", "z"]) ||
        (goal.rotation !== undefined && !vector(goal.rotation, ["x", "y", "z", "w"]))) return undefined;
    }
    if (posture.rotation !== undefined && (!own(posture.rotation, ["about", "turn"]) ||
      !vector(posture.rotation.about, ["x", "y", "z"]) || !vector(posture.rotation.turn, ["x", "y", "z", "w"]))) return undefined;
    return (): boolean => {
      if (!standardJson()) return false;
      for (const node of nodes) {
        if (Object.getPrototypeOf(node.value) !== node.prototype) return false;
        const keys: readonly (string | symbol)[] = Reflect.ownKeys(node.value);
        if (keys.length !== node.keys.length || keys.some((key: string | symbol, i: number): boolean => key !== node.keys[i])) return false;
        for (let i: number = 0; i < keys.length; ++i) {
          const field: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(node.value, keys[i]!);
          const ordinary: boolean = keys[i] !== "length" || !node.array;
          if (field === undefined || !("value" in field) || !Object.is(field.value, node.fields[i]) ||
            field.enumerable !== ordinary || field.writable !== true || field.configurable !== ordinary) return false;
        }
      }
      return true;
    };
  } catch { return undefined; }
}

/** Each value is an original constructor-owned ordinary object, never a replacement supplied after issuance. */
interface INode {
  /** Original native object identity whose own metadata cannot invoke Proxy traps. */
  value: object;
  /** Original ordinary object/array prototype. */
  prototype: object;
  /** Exact ordered own keys, including the native array length property. */
  keys: readonly (string | symbol)[];
  /** Exact original data values/child identities in key order; normal data flags follow from construction. */
  fields: readonly unknown[];
  /** Native array length is the only nonenumerable/nonconfigurable captured field. */
  array: boolean;
}

/** Closed native own data has no JSON callback when its two intrinsic prototype chains expose no hook. */
function standardJson(): boolean {
  return Object.getOwnPropertyDescriptor(Object.prototype, "toJSON") === undefined &&
    Object.getOwnPropertyDescriptor(Array.prototype, "toJSON") === undefined && Object.getPrototypeOf(Array.prototype) === Object.prototype;
}
