/*
 * Read a record's enumerable own string keys in enumeration order while
 * retaining the record's per-key TypeScript type for its consumers. The
 * descriptor snapshot leaves the input object and its prototype untouched.
 */
export function ownArchetypeRecordKeys<T extends object>(
  record: T,
): Extract<keyof T, string>[] {
  const descriptors: { [Key in keyof T]: TypedPropertyDescriptor<T[Key]> } =
    Object.getOwnPropertyDescriptors(record);
  Object.setPrototypeOf(descriptors, null);
  const keys: Extract<keyof T, string>[] = [];
  for (const key in descriptors)
    if (descriptors[key]?.enumerable === true) keys.push(key);
  return keys;
}
