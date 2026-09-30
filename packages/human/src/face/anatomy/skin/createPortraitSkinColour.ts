import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import { createPortraitColourField } from "./createPortraitColourField";
import { IPortraitSkinColourRegion } from "./structures/IPortraitSkinColourRegion";

/**
 * Compile owned compact colour envelopes against an immutable reference host.
 * Sampling happens after reference-coordinate refinement, so a narrow region
 * between control vertices is not lost by interpolating white endpoint RGB.
 * Region names fix product order, making declaration order irrelevant.
 * Gains lie in [0,1]: this path has no material to fold a lightening into.
 *
 * @evidence contracts/common.md#principled-implementation Anchors and millimetre offsets resolve to fixed centres on the immutable reference host, and the compiled field is sampled on reference coordinates after refinement, so a narrow region between control vertices is not lost by interpolating white endpoint colours and the current expression cannot slide skin through the colour volume.
 * @evidence contracts/common.md#clear-and-simple-design It resolves anchors and delegates sampling to createPortraitColourField.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case; a gain above one refuses on this path because it has no material to fold a lightening into.
 * @evidence contracts/common.md#meaningful-documentation States why sampling follows refinement, the ordering rule and the gain limit.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame millimetres for anchors, offsets and radii.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping createPortraitSkinColour compiles a colour function and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels createPortraitSkinColour defines and consumes no parameter channel of a form; its regions are colour envelopes.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createPortraitSkinColour emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries createPortraitSkinColour constructs no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation createPortraitSkinColour owns no displayed part; the skin part that samples it is observed by its owner.
 * @evidenceExclude contracts/anatomy.md#anatomical-source createPortraitSkinColour carries no anatomical measurement of its own: the regions are caller-supplied appearance envelopes, and their values belong to the caller's document.
 * @evidenceExclude contracts/anatomy.md#permitted-range createPortraitSkinColour bounds appearance multipliers, not an anatomical quantity.
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
    if (r.gain.some((value) => value > 1))
      throw new Error("Skin colour region gains lie in [0,1].");
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
