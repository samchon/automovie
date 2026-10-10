import { portraitSkinParameters } from "./portraitSkinParameters";
import { IPortraitSkinShape } from "./structures/IPortraitSkinShape";

/**
 * Resolve owned complete skin settings without clipping invalid input. The
 * same envelopes supply the editor; geometry admission remains a later gate.
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
