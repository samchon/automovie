import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceHairGather } from "../../structures/IAutoMovieHumanFaceHairGather";

/**
 * Convert named angular tie styling to the established scalp gathering fields.
 * Optional tail spread must be supplied as a complete pair. The enclosing hair
 * admission checks numerical limits and requires fully integrated gathered
 * populations; this adapter neither changes guide policy nor finds the ray hit.
 *
 * @evidence contracts/common.md#principled-implementation Direct unit conversion preserves the established chart-ray meaning and rejects incomplete spread pairs.
 * @evidence contracts/common.md#clear-and-simple-design One conversion owner serves standalone and sparse styling paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No private tie point, count change or guide-policy override is introduced.
 * @evidence contracts/common.md#meaningful-documentation States conversion, pair refusal and enclosing admission responsibilities.
 * @evidence contracts/modeling.md#spatial-conventions Degrees become radians and millimetres metres in the same shared head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The population owns part identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels The gather type owns named trait meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The adapter emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing ray resolver owns attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair assembly observes gathering.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The gather input owner states authored qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range Established hair admission owns numerical limits.
 * @evidence contracts/anatomy.md#parametric-authority Angular location and closed tail direction add no private coordinate or curve.
 */
export function expandHumanFaceHairGather(
  input: IAutoMovieHumanFaceHairGather,
): NonNullable<IAutoMovieHumanFaceHair.Layer["gather"]> {
  if ((input.spreadRadiusMm === undefined) !== (input.spreadReachMm === undefined))
    throw new Error("Named hair tail spread requires both radius and reach.");
  const direction: [number, number, number] = input.tailDirection === "back" ? [0, 0, -1] :
    input.tailDirection === "front" ? [0, 0, 1] : input.tailDirection === "left" ? [1, 0, 0] :
    input.tailDirection === "right" ? [-1, 0, 0] : [0, -1, 0];
  return { anchor: { polar: input.polarDegrees * Math.PI / 180,
    azimuth: input.azimuthDegrees * Math.PI / 180 }, radius: input.radiusMm / 1000,
    strength: input.strength, tail: { direction,
      spread: input.spreadRadiusMm === undefined ? undefined : {
        radius: input.spreadRadiusMm / 1000, reach: input.spreadReachMm! / 1000 } } };
}
