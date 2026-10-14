/**
 * Name one actual figure instance's physical source registration.
 * Instance and registration are exact nonblank identities. The JSON tuple is
 * injective even when either contains delimiters, quotes or whitespace; no
 * trimming changes an admitted identity. A canonical compiler generation or
 * a separately registered native-indexed source fingerprint supplies the
 * second value. A generation alone cannot identify two placed figures.
 *
 * This formatter neither registers source points nor proves compatibility,
 * incidence, geometry or anatomical validity. Producers own those facts and
 * supply the same instance/registration to all parts intended to share points.
 * It consumes primitive strings and retains no caller-owned mutable state.
 *
 * @evidence contracts/common.md#principled-implementation JSON-encodes exact nonblank instance/registration strings as an injective tuple, escaping delimiters without trimming admitted identities.
 * @evidence contracts/common.md#clear-and-simple-design Owns domain spelling only; producers own actual source registration, incidence and anatomical admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generation alone cannot identify separate figures, and a formatted domain is not geometry or compatibility proof.
 * @evidence contracts/common.md#meaningful-documentation Documents nonblank refusal, exact identity spelling and the formatter's qualification limits.
 * @evidence contracts/performance.md#efficient-algorithms For L identity characters, blank checks and escaped tuple output cost O(L) time/space.
 * @evidence contracts/performance.md#reuse-equivalent-work Body/face producers share deterministic formatting, without a cache or retained mutable registration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned string belongs to its producer; fixed tuple/temporary strings retain no source geometry or resource.
 */
export function humanPhysicalSourceDomain(
  instance: string,
  registration: string,
): string {
  if (instance.trim().length === 0 || registration.trim().length === 0)
    throw new Error(
      "Human physical source domain needs nonempty instance and registration identities.",
    );
  return JSON.stringify([instance, registration]);
}
