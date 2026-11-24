/**
 * Freeze a value and everything reachable from it through own data properties,
 * in place, so a reader that writes into any of it throws, as every test and
 * package module runs in strict mode.
 *
 * Shared and cyclic references are frozen once. Array buffer views are left
 * writable, because `Object.freeze` refuses one with elements, and the entries
 * of a `Map` or `Set` and a class instance's private fields stay writable too;
 * a reader that writes only into those is not caught.
 *
 * @param value The value to freeze; the caller gives up writing into it.
 * @returns The same value, frozen.
 */
export function deepFreeze<T>(value: T): T {
  const seen: Set<object> = new Set();
  const visit: (item: unknown) => void = (item: unknown): void => {
    if (
      item === null ||
      (typeof item !== "object" && typeof item !== "function") ||
      seen.has(item) ||
      ArrayBuffer.isView(item)
    )
      return;
    seen.add(item);
    for (const key of Reflect.ownKeys(item)) {
      const descriptor: PropertyDescriptor | undefined =
        Object.getOwnPropertyDescriptor(item, key);
      if (descriptor !== undefined && "value" in descriptor)
        visit(descriptor.value);
    }
    Object.freeze(item);
  };
  visit(value);
  return value;
}
