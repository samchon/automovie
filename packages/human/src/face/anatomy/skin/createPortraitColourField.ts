import type { IPortraitColourField } from "./structures/IPortraitColourField";

/**
 * Compile owned reference-space pigmentation envelopes. The connected basis
 * samples these on its immutable source vertices; the procedural component
 * path resolves landmark-relative regions before calling the same owner.
 * All lengths use one caller-selected unit. The compact C2 kernel is
 * (1-r)^4(4r+1) inside the ellipsoid and zero outside; composing bounded
 * channel multipliers cannot introduce light or values outside [0,1].
 * The kernel decreases from one to zero: its derivative is -20r(1-r)^3 on [0,1].
 * The final upper clamp removes floating-point overshoot near the centre.
 * Sampling resolution belongs to the consuming surface. A narrow field needs
 * enough surface samples; this function neither subdivides nor invents detail.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-skin-colour Evaluates numeric colour fields without photographs or illumination.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour Owns the shared C2 compact-support envelope and deterministic named composition.
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
      field.gain.some((value) => value < 0 || value > 1) ||
      !Number.isFinite(field.strength) ||
      field.strength < 0 ||
      field.strength > 1
    )
      throw new Error(
        "Skin colour needs named finite centres, positive radii and gains/strength in [0,1].",
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
