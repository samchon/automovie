/**
 * Observe synchronous result versus the exact propagated failure value. Cases
 * use this to distinguish an operational error's identity from a replacement
 * diagnostic with similar text; no runtime or native method is intercepted.
 */
export function observeThrownValue(task: () => unknown): {
  threw: boolean;
  error: unknown;
} {
  try {
    task();
    return { threw: false, error: undefined };
  } catch (error) {
    return { threw: true, error };
  }
}
