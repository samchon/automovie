/** Authoring descriptors are plain string-keyed records, including null-prototype records; arrays, null and opaque built-in objects are not omission. */
export function isAutoMovieRecord(
  value: unknown,
): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const prototype: object | null = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
