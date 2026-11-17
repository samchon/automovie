import type { HumanPerformance } from "./HumanPerformance";
import type { IHumanPerformer } from "./IHumanPerformer";

/**
 * A performance input's structural key: two inputs share a key exactly when
 * a performance resolved from either is the same, so a resolved performance
 * is kept and read again under it (`HumanPerformanceState.of`).
 *
 * Plain data (the seed, the composition, the parameters, the places, the
 * props' frames and points) is keyed by its content: each value by its type
 * and exact value, each array by its items in order and each plain object by
 * its own keys in sorted order, a key holding `undefined` apart from a key
 * absent. The authored-flight policy is normalized to its staged default;
 * explicit physical mode has a distinct key. Everything else is keyed by its identity: a function (a law's
 * plan, a layer, a moving prop's course), an instance of a class, a map and
 * a performer's body, the prepared body a process keeps for its whole life,
 * whose content is the rig, the profile and the surfaces of that body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when two inputs share a key and how each kind of value is keyed.
 * @evidence contracts/development/design.md#principled-representation A key is the input's content where the input is data and its identity where it is behaviour or a prepared body, so equal keys mean equal performances.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by the state's memo.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No serializer of the whole object: a body is not walked, and behaviour is never taken as equal by its text.
 */
export namespace HumanPerformanceKey {
  /**
   * The key of a performance input.
   *
   * @param input The input.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A canonical form: plain data by content in a fixed order, behaviour and bodies by identity, and the effective authored-flight mode including its staged default, so physical and staged resolutions cannot collide.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The performers with their bodies by identity, then one walk of the rest.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A value of a kind the walk does not read as data is keyed by identity, so an unknown value can only miss, never collide.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the input's plain data; a body is one identity read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function of the input.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The identities are numbered in a weak map, released with their objects.
   */
  export function of(input: HumanPerformance.IInput): string {
    const value: Omit<HumanPerformance.IInput, "performers"> & {
      performers: (Omit<IHumanPerformer, "body"> & { body: string })[];
    } = {
      ...input,
      performers: input.performers.map(
        (
          p: IHumanPerformer,
        ): Omit<IHumanPerformer, "body"> & { body: string } => ({
          ...p,
          body: identity(p.body),
        }),
      ),
    };
    if (value.flight === undefined) value.flight = "staged";
    return walk(value);
  }

  /** A value's canonical text. */
  function walk(value: unknown): string {
    if (value === null) return "n";
    switch (typeof value) {
      case "undefined":
        return "u";
      case "boolean":
        return value ? "t" : "f";
      case "number":
        return Object.is(value, -0) ? "#-0" : `#${value}`;
      case "string":
        return `s${value.length}:${value}`;
      case "bigint":
        return `b${value}`;
      case "object":
        break;
      case "function":
        return identity(value);
      case "symbol":
        // A symbol has no content to compare and no weak identity: it is
        // keyed apart from everything, so it can only miss.
        return `y${++counter}`;
    }
    if (Array.isArray(value))
      return `[${value.map((item: unknown): string => walk(item)).join(",")}]`;
    const prototype: unknown = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null)
      return identity(value as object);

    // A plain object by its own keys in code-unit order, a total order that no
    // locale changes, so two objects of equal content read as one text.
    return `{${Object.keys(value as object)
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .map(
        (key: string): string =>
          `${key.length}:${key}=${walk((value as Record<string, unknown>)[key])}`,
      )
      .join(",")}}`;
  }

  /** An object's number for the life of the object. */
  function identity(value: object): string {
    let id: number | undefined = IDENTITIES.get(value);
    if (id === undefined) {
      id = ++counter;
      IDENTITIES.set(value, id);
    }
    return `@${id}`;
  }

  /** Each object keyed by identity, numbered on first sight. */
  const IDENTITIES: WeakMap<object, number> = new WeakMap();

  /** The last number given. */
  let counter: number = 0;
}
