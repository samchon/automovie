/**
 * Axis-aligned Gaussian envelope in the neutral head's metre coordinates.
 * Root sampling and parting use the same arithmetic but independent inputs.
 * It stores six field coefficients, never a root list or curve samples.
 *
 * @evidence contracts/common.md#principled-implementation The existing centre and spread tuples retain the same Gaussian envelope consumed by root preference and parting.
 * @evidence contracts/common.md#clear-and-simple-design This named file owns the sole Region field definition; a separate compatibility alias preserves its existing public namespace.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing namespace qualification, fields and units are preserved without duplicate definitions or runtime patching.
 * @evidence contracts/common.md#meaningful-documentation Each retained member documents its established units, optional meaning and styling responsibility.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This Gaussian coefficient record names no physical part or root population; its enclosing hair layer owns population identity.
 * @evidence contracts/modeling.md#parameter-channels Centre translates one preference envelope and each positive spread controls its corresponding axis extent; rootRegion and part.region are independent instances consumed as relative sampling density or direction weight.
 * @evidenceExclude contracts/modeling.md#emitted-geometry humanFaceHairEnvelope evaluates a scalar and emits no primitive; root sampling and the hair builder own the requested population and resulting ribbons.
 * @evidence contracts/modeling.md#spatial-conventions Centre and spread use neutral head metres, with the basis origin and +X anatomical left/+Y superior/+Z anterior axes; the coefficient record performs no conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The envelope is a smooth preference weight rather than a clipping surface or tissue join; source-domain and contact owners retain actual boundary responsibility.
 * @evidenceExclude contracts/modeling.md#rendered-observation This numerical envelope has no independent rendered object; the assembled hair consumer owes observation of its combined effect.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Centre/spread describe an authored Gaussian preference, not an acquired anatomical landmark, follicle-density distribution or measured regional proportion.
 * @evidenceExclude contracts/anatomy.md#permitted-range assertHumanFaceHair owns finite centres and positive spreads and sampling owns exhaustion refusal; those are numerical styling conditions, not physiological bounds defined here.
 * @evidence contracts/anatomy.md#parametric-authority This retained legacy styling resource carries six neutral-space coefficients rather than personal roots, vertices or sampled curves. humanFaceHairEnvelope owns their deterministic Gaussian reading; their presence supplies no anatomical or clinical inverse.
 *
 * @author Samchon
 */
export interface Region {
  /** Finite centre coordinates in neutral head metres. */
  center: [number, number, number];

  /** Positive metre-space standard deviations, not a hard clipping radius. */
  spread: [number, number, number];
}
