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
