import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import { createPortraitColourField } from "./createPortraitColourField";
import { IPortraitSkinColourRegion } from "./structures/IPortraitSkinColourRegion";

/**
 * Compile owned compact colour envelopes against an immutable reference host.
 * Sampling happens after reference-coordinate refinement, so a narrow region
 * between control vertices is not lost by interpolating white endpoint RGB.
 * Region names fix product order, making declaration order irrelevant.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-skin-colour Evaluates authored pigmentation independently of current pose and lighting.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour Applies the compact C2 compact-support envelope to transported reference coordinates and multiplies named linear RGB contributions.
 */
export function createPortraitSkinColour(
  host: IPortraitComponentHost,
  input: readonly IPortraitSkinColourRegion[],
): (reference: readonly number[]) => number[] {
  const regions = structuredClone(input);
  const fields = regions.map((r) => {
    if (
      !Number.isInteger(r.anchor) ||
      r.anchor < 0 ||
      r.anchor >= host.positions.length ||
      r.offset.length !== 3 ||
      !r.offset.every(Number.isFinite)
    )
      throw new Error(
        "Skin colour needs resident reference bindings and finite XYZ offsets.",
      );
    const point = host.positions[r.anchor];
    if (point.length !== 3 || !point.every(Number.isFinite))
      throw new Error("Skin colour requires a finite reference anchor.");
    const center = point.map((v, axis) => v + r.offset[axis]);
    if (!center.every(Number.isFinite))
      throw new Error("Skin colour centre exceeds representable coordinates.");
    return { ...r, center: center as [number, number, number] };
  });
  return createPortraitColourField(fields);
}
