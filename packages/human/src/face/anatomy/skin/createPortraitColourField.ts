import type { IPortraitColourField } from "./structures/IPortraitColourField";

/**
 * Compile owned reference-space pigmentation envelopes. The connected basis
 * samples these on its immutable source vertices; the procedural component
 * path resolves landmark-relative regions before calling the same owner.
 * All lengths use one caller-selected unit. The compact C2 kernel is
 * (1-r)^4(4r+1) inside the ellipsoid and zero outside. Gains are finite
 * and nonnegative: below one a field darkens, above one it lightens, and a
 * product past one is the consumer's to carry (the connected builder folds it
 * into the material, `liftHumanFaceColours`; the procedural path admits
 * gains up to one only, `createPortraitSkinColour`).
 * The kernel decreases from one to zero: its derivative is -20r(1-r)^3 on [0,1].
 * The kernel is held at one against floating-point overshoot near the centre.
 * Sampling resolution belongs to the consuming surface. A narrow field needs
 * enough surface samples; this function neither subdivides nor invents detail.
 *
 * @evidence contracts/common.md#principled-implementation Each region weights its RGB gain by the compact C2 kernel (1 - r)^4 (4 r + 1) of the normalised ellipsoidal distance r, which is one at the centre, zero at r = 1 and has derivative -20 r (1 - r)^3, so overlapping regions fade smoothly; regions multiply in lexical name order so the result does not depend on declaration order. The multiplier 1 + (gain - 1) * weight interpolates linearly between white and the gain.
 * @evidence contracts/common.md#clear-and-simple-design Validate once, then a pure sampler over a sorted copy of the fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No region, subject or fixture is special-cased; invalid fields refuse.
 * @evidence contracts/common.md#meaningful-documentation States the kernel and its derivative, the gain semantics for the connected and procedural consumers and that sampling resolution belongs to the consuming surface.
 * @evidence contracts/modeling.md#spatial-conventions Centres and radii share one caller-selected length unit and the sampler reads points in that unit; gains are linear RGB multipliers.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping createPortraitColourField compiles a colour function and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels createPortraitColourField defines and consumes no parameter channel of a form; its regions are colour envelopes.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createPortraitColourField emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries createPortraitColourField constructs no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation createPortraitColourField owns no displayed part; the skin part that samples it is observed by its owner.
 * @evidenceExclude contracts/anatomy.md#anatomical-source createPortraitColourField carries no anatomical measurement of its own: the regions are caller-supplied appearance envelopes, and their values belong to the caller's document.
 * @evidenceExclude contracts/anatomy.md#permitted-range createPortraitColourField bounds appearance multipliers, not an anatomical quantity.
 */
export function createPortraitColourField(
  input: readonly IPortraitColourField[],
): (point: readonly number[]) => number[] {
  const fields = [...structuredClone(input)];
  if (new Set(fields.map((field) => field.name)).size !== fields.length)
    throw new Error("Skin colour region identities must be unique.");
  for (const field of fields)
    if (
      field.name.trim().length === 0 ||
      [field.center, field.radius, field.gain].some(
        (values) => values.length !== 3 || !values.every(Number.isFinite),
      ) ||
      field.radius.some((value) => value <= 0) ||
      field.gain.some((value) => value < 0) ||
      !Number.isFinite(field.strength) ||
      field.strength < 0 ||
      field.strength > 1
    )
      throw new Error(
        "Skin colour needs named finite centres, positive radii, nonnegative gains and strength in [0,1].",
      );
  fields.sort((a, b) => (a.name < b.name ? -1 : 1));
  return (point) => {
    if (point.length !== 3 || !point.every(Number.isFinite))
      throw new Error("Skin colour sampling requires finite reference XYZ.");
    const rgb = [1, 1, 1];
    for (const field of fields) {
      const distance = Math.hypot(
        ...point.map(
          (value, axis) => (value - field.center[axis]) / field.radius[axis],
        ),
      );
      if (distance >= 1) continue;
      const weight =
        field.strength * Math.min(1, (1 - distance) ** 4 * (4 * distance + 1));
      for (let axis = 0; axis < 3; axis++)
        rgb[axis] *= 1 + (field.gain[axis] - 1) * weight;
    }
    return rgb;
  };
}
