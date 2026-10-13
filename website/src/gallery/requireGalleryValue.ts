/** Admit observed authored markup before listeners can attach; null is absence. */
export function requireGalleryValue<T>(value: T | null, selector: string): T {
  if (value === null) throw new Error(`Missing gallery element: ${selector}`);
  return value;
}
