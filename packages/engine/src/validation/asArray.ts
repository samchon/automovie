/**
 * Borrow an actual array or return a fresh empty array after separate shape
 * admission.
 */
export const asArray: (value: unknown) => unknown[] = (
  value: unknown,
): unknown[] => (Array.isArray(value) ? value : []);
