import type { IPortraitComponentHost } from "../../surface/IPortraitComponentHost";
import { IPortraitSkinColourRegion } from "./structures/IPortraitSkinColourRegion";

/**
 * Compile owned compact colour envelopes against an immutable reference host.
 * Sampling happens after reference-coordinate refinement, so a narrow region
 * between control vertices is not lost by interpolating white endpoint RGB.
 * Region names fix product order, making declaration order irrelevant.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-skin-colour Evaluates authored pigmentation independently of current pose and lighting.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour Applies the compact quartic envelope to transported reference coordinates and multiplies named linear RGB contributions.
 */
export function createPortraitSkinColour(
  host: IPortraitComponentHost,
  input: readonly IPortraitSkinColourRegion[],
): (reference: readonly number[]) => number[] {
  const regions = structuredClone(input);
  if (new Set(regions.map((r) => r.name)).size !== regions.length)
    throw new Error("Skin colour region identities must be unique.");
  const fields = [...regions]
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .map((r) => {
      if (
        r.name.trim().length === 0 ||
        !Number.isInteger(r.anchor) ||
        r.anchor < 0 ||
        r.anchor >= host.positions.length ||
        [r.offset, r.radius, r.gain].some(
          (v) => v.length !== 3 || !v.every(Number.isFinite),
        ) ||
        r.radius.some((v) => v <= 0) ||
        r.gain.some((v) => v < 0 || v > 1) ||
        !Number.isFinite(r.strength) ||
        r.strength < 0 ||
        r.strength > 1
      )
        throw new Error(
          "Skin colour needs named reference bindings, finite dimensions, positive radii and gains/strength in [0,1].",
        );
      const point = host.positions[r.anchor];
      if (point.length !== 3 || !point.every(Number.isFinite))
        throw new Error("Skin colour requires a finite reference anchor.");
      const center = point.map((v, axis) => v + r.offset[axis]);
      if (!center.every(Number.isFinite))
        throw new Error(
          "Skin colour centre exceeds representable coordinates.",
        );
      return { ...r, center };
    });
  return (point) => {
    if (point.length !== 3 || !point.every(Number.isFinite))
      throw new Error("Skin colour sampling requires finite reference XYZ.");
    const rgb = [1, 1, 1];
    for (const field of fields) {
      const distance = Math.hypot(
        ...point.map(
          (v, axis) => (v - field.center[axis]) / field.radius[axis],
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
