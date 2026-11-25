/**
 * Assert that a value a test reads is present, and hand it on.
 *
 * @param title What the value is, for the failure.
 * @param value The value, possibly absent.
 * @returns The present value.
 * @throws {Error} When the value is absent.
 */
export function present<T>(title: string, value: T | undefined): T {
  if (value === undefined) throw new Error(`Bug on ${title}: it is absent`);
  return value;
}
