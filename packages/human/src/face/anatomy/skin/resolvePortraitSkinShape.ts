import { portraitSkinParameters } from "./portraitSkinParameters";
import { IPortraitSkinShape } from "./structures/IPortraitSkinShape";

/**
 * Resolve owned complete skin settings without clipping invalid input. The
 * same envelopes supply the editor; geometry admission remains a later gate.
 *
 * @evidence contracts/common.md#principled-implementation Every key in portraitSkinParameters receives either the supplied finite in-range value or its authored initial value; invalid supplied values refuse instead of clipping and the completed record is owned.
 * @evidence contracts/common.md#clear-and-simple-design One parameter catalogue supplies field names, defaults and bounds to both this resolver and scalar controls, avoiding another private default table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ranges are authored editing envelopes rather than biological measurements; no age/preset chooses settings, and this scalar gate does not certify actual assembled morphology or caller extras.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes complete owned output, invalid-input refusal, shared editor envelopes and later geometry admission.
 * @evidence contracts/performance.md#efficient-algorithms The fixed catalogue is traversed once with one property lookup/output per parameter, O(P) time/storage and no mesh operation.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared immutable catalogue is reused; current scalar input is resolved afresh and no input-key-only result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the owned completed scalar record escapes; failed resolution leaves the input unchanged and no task, handle or retained mesh exists.
 */
export function resolvePortraitSkinShape(
  input: IPortraitSkinShape = {},
): Required<IPortraitSkinShape> {
  const output: Required<Partial<Record<"forehead" | "laxity" | "wrinkleDepth" | "wrinkleWidth" | "glabella" | "crowFeet" | "lowerLid" | "nasolabial" | "marionette" | "perioral" | "cheekSag" | "jowlSag" | "underEyeBag" | "volumeLoss" | "expressionCreasing", number>>> = {} as Required<IPortraitSkinShape>;
  for (const parameter of portraitSkinParameters) {
    const value: number =
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
