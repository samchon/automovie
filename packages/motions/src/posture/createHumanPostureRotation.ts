import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Construct an owned numeric rigid turn from the solved flight's output. Its
 * private exact native-node snapshot proves only graph provenance; the ordinary
 * quaternion and raw/rig owners still perform numerical admission.
 */
export function createHumanPostureRotation(
  about: IAutoMovieVector3,
  turn: IAutoMovieQuaternion,
): IAutoMovieHumanPostureRotation {
  const out: IAutoMovieHumanPostureRotation = {
    about: { x: about.x, y: about.y, z: about.z },
    turn: { x: turn.x, y: turn.y, z: turn.z, w: turn.w },
  };
  SOURCES.set(out, [
    { value: out, keys: ["about", "turn"], fields: [out.about, out.turn] },
    {
      value: out.about,
      keys: ["x", "y", "z"],
      fields: [out.about.x, out.about.y, out.about.z],
    },
    {
      value: out.turn,
      keys: ["x", "y", "z", "w"],
      fields: [out.turn.x, out.turn.y, out.turn.z, out.turn.w],
    },
  ]);
  return out;
}

/** Actual native-node provenance for rigid placement, separate from physics. */
export namespace createHumanPostureRotation {
  /**
   * Whether this actual constructed rotation still has its exact own data.
   *
   * Defines original-node metadata/field verification without following
   * replacement children and no numerical validity verdict. Exact prototype,
   * ordered own keys, ordinary data descriptors and Object.is original values
   * prove the actual constructor graph is unchanged; an unknown weak key is
   * refused before observing metadata. One bounded node walk owns graph
   * verification and leaves current raw/body and quaternion checks with their
   * existing owners. Does not call foreign suppliers/getters, traverse
   * replacement Proxy nodes, trust mutable identity or certify any physical
   * answer. Constant three-node/nine-field work with no body scan, retained
   * verdict or unbounded observation log. Every actual consumption checks
   * current fields; an earlier successful check is not cached. Retains no
   * input, result, callback or resource beyond the constructor's existing weak
   * record.
   */
  export function unchanged(rotation: IAutoMovieHumanPostureRotation): boolean {
    const nodes: readonly INode[] | undefined = SOURCES.get(rotation);
    if (nodes === undefined) return false;
    for (const node of nodes) {
      if (Object.getPrototypeOf(node.value) !== Object.prototype) return false;
      const keys: readonly PropertyKey[] = Reflect.ownKeys(node.value);
      if (
        keys.length !== node.keys.length ||
        keys.some(
          (key: PropertyKey, i: number): boolean => key !== node.keys[i],
        )
      )
        return false;
      for (let i: number = 0; i < keys.length; ++i) {
        const field: PropertyDescriptor | undefined =
          Object.getOwnPropertyDescriptor(node.value, keys[i]!);
        if (
          field === undefined ||
          !("value" in field) ||
          !Object.is(field.value, node.fields[i]) ||
          field.enumerable !== true ||
          field.writable !== true ||
          field.configurable !== true
        )
          return false;
      }
    }
    return true;
  }
}

/**
 * Only original ordinary constructor nodes are inspected, never replacement
 * children.
 */
interface INode {
  /** Actual constructed ordinary object. */
  value: object;
  /** Its complete original key order. */
  keys: readonly string[];
  /** Original primitive values or constructor-owned child identities. */
  fields: readonly unknown[];
}

/** Output lifetime alone owns its bounded constructor evidence. */
const SOURCES: WeakMap<IAutoMovieHumanPostureRotation, readonly INode[]> =
  new WeakMap();
