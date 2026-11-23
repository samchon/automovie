/**
 * Freeze an admitted physical input/state tree without copying it again.
 * Shared records are visited once, and typed snapshot byte buffers are left
 * to their Map owner because JavaScript cannot freeze nonempty typed arrays.
 * Trees have the fixed profile/frame schema depth; this is not a JSON parser.
 */
export function freezePhysicalRecord(value: object): void {
  if (Object.isFrozen(value) || ArrayBuffer.isView(value)) return;
  const children: unknown[] = Object.values(value);
  for (const child of children)
    if (child !== null && typeof child === "object")
      freezePhysicalRecord(child);
  Object.freeze(value);
}
