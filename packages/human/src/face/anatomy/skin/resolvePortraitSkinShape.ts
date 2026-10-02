import { portraitSkinParameters } from "./portraitSkinParameters";
import { IPortraitSkinShape } from "./structures/IPortraitSkinShape";

/**
 * Resolve owned complete skin settings without clipping invalid input. The
 * same envelopes supply the editor; geometry admission remains a later gate.
 *
 * @evidence contracts/common.md#principled-implementation Every parameter takes its documented default when omitted and is checked against its documented minimum and maximum, then returned in an owned record; an invalid value refuses and is never clamped.
 * @evidence contracts/common.md#clear-and-simple-design One loop over the parameter table that also supplies the editor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clamping and no special case.
 * @evidence contracts/common.md#meaningful-documentation States the no-clipping rule and that the same envelopes serve the editor and that geometry admission is a later gate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries resolvePortraitSkinShape constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping resolvePortraitSkinShape is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry resolvePortraitSkinShape emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation resolvePortraitSkinShape owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 */
export function resolvePortraitSkinShape(
  input: IPortraitSkinShape = {},
): Required<IPortraitSkinShape> {
  const output = {} as Required<IPortraitSkinShape>;
  for (const parameter of portraitSkinParameters) {
    const value =
      input[parameter.id] === undefined
        ? parameter.initial
        : input[parameter.id]!;
    if (
      !Number.isFinite(value) ||
      value < parameter.minimum ||
      value > parameter.maximum
    )
      throw new Error(`Invalid skin shape: ${parameter.id}.`);
    output[parameter.id] = value;
  }
  return output;
}
