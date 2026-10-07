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
 * @evidence contracts/common.md#principled-implementation JSON encodes an ordered pair of exact strings without delimiter ambiguity, separating actual instance ownership from source registration.
 * @evidence contracts/common.md#clear-and-simple-design Face, body and person producers consume one namespace admission and formatting owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate, normal island, rendered vertex ordinal or generation-only identity supplies the namespace.
 * @evidence contracts/common.md#meaningful-documentation States identity preservation, canonical/native registration choices, source-owner obligations and the formatter's limits.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Names an equivalence context without defining or composing anatomical parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no shaping or motion channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits a namespace string, not vertices or primitives.
 * @evidenceExclude contracts/modeling.md#spatial-conventions No coordinates, units or frame conversion enter.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly producers own shared-point registration; this helper only formats their context.
 * @evidenceExclude contracts/modeling.md#rendered-observation A metadata formatter carries no independent displayed form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Defines no anatomical quantity or source measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range String admission defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This internal source context is not a personal shaping input.
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
