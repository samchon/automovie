import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformer,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * A performance input's structural key: two inputs share a key exactly when
 * a performance resolved from either is the same, so a resolved performance
 * is kept and read again under it (`HumanPerformanceState.of`).
 *
 * Plain data (the seed, the composition, the parameters, the places, the
 * props' frames and points) is keyed by its content: each value by its type
 * and exact value, each array by its items in order and each plain object by
 * its own keys in sorted order, a key holding `undefined` apart from a key
 * absent. The authored-flight policy is captured once from its effective
 * property, including inherited and non-enumerable properties, and normalized
 * to its staged default. That same capture is returned to construction;
 * explicit physical mode has a distinct key. Everything else is keyed by its identity: a function (a law's
 * plan, a layer, a moving prop's course), an instance of a class, a map and
 * a performer's body, the prepared body a process keeps for its whole life,
 * whose content is the rig, the profile and the surfaces of that body.
 */
export namespace HumanPerformanceKey {
  /**
   * The key of a performance input and its single effective flight-mode capture.
   *
   * @param input The input.
   * @returns The structural key and the same admitted mode for construction.
   * @throws {HumanRefusal} When the effective flight mode is neither staged nor physical after the undefined default.
   */
  export function of(input: IAutoMovieMotionHumanPerformance.IInput): {
    key: string;
    flight: NonNullable<IAutoMovieMotionHumanPerformance.IInput["flight"]>;
  } {
    const value: Omit<IAutoMovieMotionHumanPerformance.IInput, "performers"> & {
      performers: (Omit<IAutoMovieMotionHumanPerformer, "body"> & { body: string })[];
    } = {
      ...input,
      performers: input.performers.map(
        (
          p: IAutoMovieMotionHumanPerformer,
        ): Omit<IAutoMovieMotionHumanPerformer, "body"> & { body: string } => ({
          ...p,
          body: identity(p.body),
        }),
      ),
    };
    const selected: IAutoMovieMotionHumanPerformance.IInput["flight"] =
      Object.prototype.hasOwnProperty.call(value, "flight") ? value.flight : input.flight;
    const flight: NonNullable<IAutoMovieMotionHumanPerformance.IInput["flight"]> = selected === undefined ? "staged" : selected;
    if (flight !== "staged" && flight !== "physical")
      throw new HumanRefusal({
        kind: "parameter", axis: "flight", value: flight,
        reason: "the authored-flight mode must be staged or physical",
        fix: "choose staged for authored turns or physical for angular-momentum flight",
      });
    Object.defineProperty(value, "flight", { value: flight, enumerable: true, writable: true, configurable: true });
    return { key: walk(value), flight };
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
