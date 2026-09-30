import { IPortraitNasalEnvelope } from "./structures/IPortraitNasalEnvelope";
import { IPortraitNasalRimSection } from "./structures/IPortraitNasalRimSection";
import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";

/**
 * Admit one nose shape as a whole and return its owned copies.
 *
 * The nose offers alternative complete constructions of the same lower nose: a
 * pre-fit section, a final body (sections, a target-depth grid or lobules),
 * local lobules, an exterior rim band with optional curve refinement, and
 * complete per-opening envelopes. Each is a full basis, so stacking two would
 * silently compound the form; this function refuses every stack and returns
 * the copied `shape`, `rimSection`, `envelopes` and `body` the component then
 * reads without aliasing the caller's input. It also refuses non-finite or
 * nonpositive dimensions, a cavity contraction or rim support outside (0,1),
 * a roundness outside [0,1] and a cavity offset that is not three finite
 * numbers. `openings` is the number of nasal openings the socket names; a
 * nonempty envelope list must carry exactly one profile per opening. Nothing is
 * mutated, and the individual section, lobule and envelope validators keep
 * their own refusals.
 *
 * @evidence contracts/common.md#principled-implementation Admission is a set of closed-form predicates over the shape: mutual exclusion of complete bases (so no construction is applied twice), finiteness, and the open intervals that keep the lining contracted inside the rim and the support ring strictly between rim and floor. Values are copied structurally so later caller edits cannot change a built nose.
 * @evidence contracts/common.md#clear-and-simple-design The combination and dimension rules live in one function beside the component that reads them; the component keeps only fitting and attachment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased; every refusal is a statement about the shape alone.
 * @evidence contracts/common.md#meaningful-documentation The comment lists the alternative bases, the refusal classes and the ownership of the returned copies.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part; it admits the shape of the nose component.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function validates channels defined on IPortraitNoseShape and defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitives.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function converts no unit or frame; the shape's millimetre and degree fields are checked for finiteness only.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part; the component observes the assembled nose.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Finite positive checks are not living-body bounds, so this chapter is not answered here.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function admits inputs defined on IPortraitNoseShape and adds none.
 */
export function resolvePortraitNoseShape(
  inputShape: IPortraitNoseShape,
  openings: number,
): {
  shape: IPortraitNoseShape & { cavityOffset: number[] };
  rimSection: IPortraitNasalRimSection | undefined;
  envelopes: readonly IPortraitNasalEnvelope[];
  body: IPortraitNoseShape["body"];
} {
  const shape = { ...inputShape, cavityOffset: [...inputShape.cavityOffset] };
  const rimSection =
    inputShape.rimSection === undefined
      ? undefined
      : { ...inputShape.rimSection };
  const envelopes = structuredClone(inputShape.envelopes ?? []);
  if (
    envelopes.length !== 0 &&
    (envelopes.length !== openings ||
      rimSection !== undefined ||
      inputShape.body !== undefined ||
      inputShape.rimRefinement === "curve")
  )
    throw new Error(
      "Complete nasal envelopes need one profile per opening and cannot stack legacy rim or final-body construction.",
    );
  if (
    (shape.rimRefinement ?? "surface") !== "surface" &&
    shape.rimRefinement !== "curve"
  )
    throw new Error("Nasal rim refinement must be surface or curve.");
  const body =
    inputShape.body === undefined
      ? undefined
      : structuredClone(inputShape.body);
  if (inputShape.section !== undefined && body !== undefined)
    throw new Error(
      "Choose one pre-fit or final nasal section basis, not two stacked constructions.",
    );
  if (
    (inputShape.lobules?.length ?? 0) !== 0 &&
    (inputShape.section !== undefined || body !== undefined)
  )
    throw new Error(
      "Choose local nasal lobules or a complete section/body basis.",
    );
  if (
    (shape.depthScale ?? 1) !== 1 &&
    (inputShape.section !== undefined ||
      (body !== undefined && !("lobules" in body.shape)))
  )
    throw new Error("Choose one nasal depth-scale or section/body basis.");
  if (!Number.isFinite(shape.depthScale ?? 1) || (shape.depthScale ?? 1) <= 0)
    throw new Error("Nasal depth scale must be finite and positive.");
  if (
    [
      shape.widthScale,
      shape.nostrilWidthScale,
      shape.nostrilHeightScale,
      shape.cavityContraction,
      shape.rimSupport,
    ].some((v) => !Number.isFinite(v) || v <= 0) ||
    shape.cavityContraction >= 1 ||
    shape.rimSupport >= 1 ||
    !Number.isFinite(shape.rimRoundness) ||
    shape.rimRoundness < 0 ||
    shape.rimRoundness > 1 ||
    !Number.isFinite(shape.blendReach) ||
    shape.blendReach < 0 ||
    ![
      shape.tipProjection,
      shape.alarProjection,
      shape.nostrilRise,
      shape.nostrilTilt,
    ].every(Number.isFinite) ||
    shape.cavityOffset.length !== 3 ||
    !shape.cavityOffset.every(Number.isFinite)
  )
    throw new Error(
      "Nasal dimensions must be finite, with positive openings and a contracted inner lining.",
    );
  return { shape, rimSection, envelopes, body };
}
