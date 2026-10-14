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
 * @evidence contracts/common.md#principled-implementation Immutable ellipsoidal reference coordinates drive the compact C2 kernel and strength-blended gain product; positive radii and finite nonnegative gains are admitted before sampling, with one shared caller-selected length unit.
 * @evidence contracts/common.md#clear-and-simple-design One compiler owns field admission, lexical product order and point sampling for both connected source pigmentation and procedural landmark sites.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The kernel's min-one protects numerical centre overshoot without clamping authored gain or strength; duplicate/blank names and invalid dimensions refuse, and narrow-field sampling remains the surface consumer's obligation.
 * @evidence contracts/common.md#meaningful-documentation The prose gives kernel/derivative, reference units, darkening/lightening meaning, consumer-specific albedo limits and resolution limits.
 * @evidence contracts/performance.md#efficient-algorithms Cloning/admitting F fields costs O(F) plus O(F log F) name sorting; each finite point reads F fixed-size ellipsoids and returns one RGB triple, with no mesh reconstruction or sampled texture allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The closure shares one copied/admitted/sorted field population across point reads; different input fields require another compiler and no geometry- or point-result cache is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The sampler retains O(F) owned field data until released by its caller; each RGB result is caller-owned and compilation/sampling failure leaves original fields and geometry unchanged.
 */
export function createPortraitColourField(
  input: readonly IPortraitColourField[],
): (point: readonly number[]) => number[] {
  const fields: IPortraitColourField[] = [...structuredClone(input)];
  if (new Set(fields.map((field: IPortraitColourField): string  => field.name)).size !== fields.length)
    throw new Error("Skin colour region identities must be unique.");
  for (const field of fields)
    if (
      field.name.trim().length === 0 ||
      [field.center, field.radius, field.gain].some(
        (values: [number, number, number]): boolean  => values.length !== 3 || !values.every(Number.isFinite),
      ) ||
      field.radius.some((value: number): boolean  => value <= 0) ||
      field.gain.some((value: number): boolean  => value < 0) ||
      !Number.isFinite(field.strength) ||
      field.strength < 0 ||
      field.strength > 1
    )
      throw new Error(
        "Skin colour needs named finite centres, positive radii, nonnegative gains and strength in [0,1].",
      );
  fields.sort((a: IPortraitColourField, b: IPortraitColourField): 1 | -1  => (a.name < b.name ? -1 : 1));
  return (point: readonly number[]): number[]  => {
    if (point.length !== 3 || !point.every(Number.isFinite))
      throw new Error("Skin colour sampling requires finite reference XYZ.");
    const rgb: number[] = [1, 1, 1];
    for (const field of fields) {
      const distance: number = Math.hypot(
        ...point.map(
          (value: number, axis: number): number  => (value - field.center[axis]) / field.radius[axis],
        ),
      );
      if (distance >= 1) continue;
      const weight: number =
        field.strength * Math.min(1, (1 - distance) ** 4 * (4 * distance + 1));
      for (let axis: number = 0; axis < 3; axis++)
        rgb[axis] *= 1 + (field.gain[axis] - 1) * weight;
    }
    return rgb;
  };
}
