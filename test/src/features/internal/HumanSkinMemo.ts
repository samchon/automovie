import type { HumanAnatomy } from "./HumanAnatomy";

/**
 * A reading of an object, such as a skin or a reference mesh, taken once per
 * object: one rule for every reading that is a pure function of the object
 * and costs seconds (the neck's sections and meridians, the trunk's tape
 * sites, the face's landmarks, vertex normals, a surface comparison's sides).
 *
 * Each reading keeps its own `WeakMap` keyed by the object, so a value dies
 * with its object and never outlives the test that holds it, and an edited
 * copy made for a red proof is another object with its own value.
 */
export namespace HumanSkinMemo {
  /** One reading's values by object, a skin unless named. */
  export type Values<T, K extends object = HumanAnatomy.ISkin> = WeakMap<K, T>;

  /**
   * The reading of an object.
   *
   * @param values The reading's own values by object.
   * @param key Object to read; its identity is the key.
   * @param take Takes the reading; called once per object, on first use.
   * @returns The reading.
   */
  export function get<T, K extends object>(values: Values<T, K>, key: K, take: () => T): T {
    let found: T | undefined = values.get(key);
    if (found === undefined) {
      found = take();
      values.set(key, found);
    }
    return found;
  }
}
