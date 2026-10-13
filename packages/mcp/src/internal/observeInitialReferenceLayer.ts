/**
 * Observe the initially requested layer. Only its initial absence can become
 * an empty population, and only after the bound root is rechecked. A missing
 * root or a later walk failure must still propagate; this boundary never
 * handles disappearance after a walk has begun.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-bounds Distinguishes an initially absent layer from lost root or mid-walk population.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-isolation Requires a current root observation before accepting an absent population.
 */
export async function observeInitialReferenceLayer<T>(
  inspect: () => Promise<T>,
  recheckRoot: () => Promise<void>,
): Promise<T | null> {
  try {
    return await inspect();
  } catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await recheckRoot();
      return null;
    }
    throw error;
  }
}
