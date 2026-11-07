/**
 * Run one Rapier enumeration whose JavaScript visitor may throw.
 *
 * Rapier 0.21's wasm-bindgen glue catches an exception raised by a visitor
 * passed to a native enumeration (`contactPairsWith`, `contactPair`,
 * `intersectionPairsWith`) and hands it back to Rust, which does not propagate
 * it. A refused native transfer, a nonfinite impulse or a malformed receipt
 * would otherwise vanish while the enumeration and the step continue. The
 * first failure stops every later visit of this enumeration and is rethrown
 * once the native call has returned. Nested enumerations each use their own
 * call, so an inner failure surfaces through the outer visitor as well.
 */
export function visitPhysicalNative<Arguments extends unknown[]>(
  enumerate: (visitor: (...values: Arguments) => void) => void,
  visit: (...values: Arguments) => void,
): void {
  let failure: { error: unknown } | undefined;
  enumerate((...values: Arguments): void => {
    if (failure) return;
    try {
      visit(...values);
    } catch (error) {
      failure = { error };
    }
  });
  if (failure) throw failure.error;
}
