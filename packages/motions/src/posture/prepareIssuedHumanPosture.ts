import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";

/** The alternatives of `PrepareIssuedHumanPostureKey`'s site. */
type PrepareIssuedHumanPostureKey = string | symbol;

/** The alternatives of `PrepareIssuedHumanPostureKeysItem`'s site. */
type PrepareIssuedHumanPostureKeysItem = string | symbol;

/** The alternatives of `PrepareIssuedHumanPostureOwnKey`'s site. */
type PrepareIssuedHumanPostureOwnKey = string | symbol;

/** The alternatives of `OwnKeysItem`'s site. */
type OwnKeysItem = string | symbol;

/**
 * Record the actual native objects created by authoritative raw translation.
 * Later checks inspect only those exact original objects, never a replacement
 * child, so a forwarding Proxy cannot add metadata traps to the check.
 */
export function prepareIssuedHumanPosture(
  posture: IAutoMovieMotionHumanPosture,
): (() => boolean) | undefined {
  try {
    if (!standardJson()) return undefined;
    const nodes: INode[] = [];
    const seen: Set<object> = new Set();
    const own: (
      value: object,
      names: readonly string[],
      array?: boolean,
    ) => boolean = (
      value: object,
      names: readonly string[],
      array: boolean = false,
    ): boolean => {
      const prototype: object = array ? Array.prototype : Object.prototype;
      if (Object.getPrototypeOf(value) !== prototype) return false;
      const keys: readonly OwnKeysItem[] = Reflect.ownKeys(value);
      if (
        keys.length !== names.length ||
        keys.some(
          (key: PrepareIssuedHumanPostureOwnKey): boolean =>
            typeof key !== "string" || !names.includes(key),
        )
      )
        return false;
      if (seen.has(value)) return true;
      const fields: unknown[] = [];
      const record: Record<PropertyKey, unknown> = value as Record<
        PropertyKey,
        unknown
      >;
      for (const key of keys) {
        fields.push(record[key]);
      }
      seen.add(value);
      nodes.push({ value, prototype, keys, fields, array });
      return true;
    };
    const vector: (value: object, names: readonly string[]) => boolean = (
      value: object,
      names: readonly string[],
    ): boolean =>
      own(value, names) &&
      names.every((key: string): boolean =>
        Number.isFinite((value as Record<string, unknown>)[key]),
      );

    if (
      !own(
        posture,
        Object.hasOwn(posture, "rotation")
          ? ["root", "yaw", "pitch", "roll", "joints", "limbs", "rotation"]
          : ["root", "yaw", "pitch", "roll", "joints", "limbs"],
      ) ||
      ![posture.yaw, posture.pitch, posture.roll].every(Number.isFinite) ||
      !vector(posture.root, ["x", "y", "z"]) ||
      !own(posture.joints, Object.keys(posture.joints)) ||
      !own(posture.limbs, Object.keys(posture.limbs))
    )
      return undefined;
    for (const tuple of Object.values(posture.joints))
      if (
        tuple === undefined ||
        !Array.isArray(tuple) ||
        !own(tuple, ["0", "1", "2", "length"], true) ||
        tuple.length !== 3 ||
        !tuple.every(Number.isFinite)
      )
        return undefined;
    for (const [limb, goal] of Object.entries(posture.limbs)) {
      if (
        (limb !== "leftLeg" && limb !== "rightLeg") ||
        goal === undefined ||
        !own(
          goal,
          Object.hasOwn(goal, "rotation")
            ? ["point", "bend", "rotation"]
            : ["point", "bend"],
        ) ||
        !vector(goal.point, ["x", "y", "z"]) ||
        !vector(goal.bend, ["x", "y", "z"]) ||
        (goal.rotation !== undefined &&
          !vector(goal.rotation, ["x", "y", "z", "w"]))
      )
        return undefined;
    }
    if (
      posture.rotation !== undefined &&
      (!own(posture.rotation, ["about", "turn"]) ||
        !vector(posture.rotation.about, ["x", "y", "z"]) ||
        !vector(posture.rotation.turn, ["x", "y", "z", "w"]))
    )
      return undefined;
    return (): boolean => {
      if (!standardJson()) return false;
      for (const node of nodes) {
        if (Object.getPrototypeOf(node.value) !== node.prototype) return false;
        const keys: readonly PrepareIssuedHumanPostureKeysItem[] =
          Reflect.ownKeys(node.value);
        if (
          keys.length !== node.keys.length ||
          keys.some(
            (key: PrepareIssuedHumanPostureKey, i: number): boolean =>
              key !== node.keys[i],
          )
        )
          return false;
        for (let i: number = 0; i < keys.length; ++i) {
          const field: PropertyDescriptor | undefined =
            Object.getOwnPropertyDescriptor(node.value, keys[i]!);
          const ordinary: boolean = keys[i] !== "length" || !node.array;
          if (
            field === undefined ||
            !("value" in field) ||
            !Object.is(field.value, node.fields[i]) ||
            field.enumerable !== ordinary ||
            field.writable !== true ||
            field.configurable !== ordinary
          )
            return false;
        }
      }
      return true;
    };
  } catch {
    return undefined;
  }
}
/** The alternatives of `NodeKeysItem`'s site. */
type NodeKeysItem = string | symbol;

/**
 * Each value is an original constructor-owned ordinary object, never a
 * replacement supplied after issuance.
 */
interface INode {
  /**
   * Original native object identity whose own metadata cannot invoke Proxy
   * traps.
   */
  value: object;
  /** Original ordinary object/array prototype. */
  prototype: object;
  /** Exact ordered own keys, including the native array length property. */
  keys: readonly NodeKeysItem[];
  /**
   * Exact original data values/child identities in key order; normal data flags
   * follow from construction.
   */
  fields: readonly unknown[];
  /**
   * Native array length is the only nonenumerable/nonconfigurable captured
   * field.
   */
  array: boolean;
}

/**
 * Closed native own data has no JSON callback when its two intrinsic prototype
 * chains expose no hook.
 */
function standardJson(): boolean {
  return (
    Object.getOwnPropertyDescriptor(Object.prototype, "toJSON") === undefined &&
    Object.getOwnPropertyDescriptor(Array.prototype, "toJSON") === undefined &&
    Object.getPrototypeOf(Array.prototype) === Object.prototype
  );
}
