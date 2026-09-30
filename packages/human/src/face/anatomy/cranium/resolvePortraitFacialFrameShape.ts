import { IPortraitFacialFrameShape } from "./structures/IPortraitFacialFrameShape";

/**
 * Resolve facial-frame dimensions without clipping and return owned settings.
 * Identity uses scales of one and displacements of zero, irrespective of person.
 *
 * @evidence contracts/common.md#principled-implementation Defaults are the identity (scales of one, displacements of zero) and every supplied value is checked against its documented interval and returned as an owned copy; an out-of-range value refuses rather than being clipped.
 * @evidence contracts/common.md#clear-and-simple-design Merge over the identity, check each value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clipping, special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation States identity irrespective of person and the no-clipping rule; the intervals are documented on the parameter type.
 * @evidenceExclude contracts/modeling.md#shared-boundaries resolvePortraitFacialFrameShape constructs no surface that meets another part.
 */
export function resolvePortraitFacialFrameShape(
  input: IPortraitFacialFrameShape = {},
): Required<IPortraitFacialFrameShape> {
  const shape = {
    widthScale: 1,
    lengthScale: 1,
    jawWidth: 0,
    chinHeight: 0,
    chinProjection: 0,
    foreheadProjection: 0,
    browProjection: 0,
    templeWidth: 0,
    ...input,
  };
  for (const [key, value] of Object.entries(shape)) {
    const scale = key === "widthScale" || key === "lengthScale";
    if (
      !Number.isFinite(value) ||
      value < (scale ? 0.7 : -8) ||
      value > (scale ? 1.3 : 8)
    )
      throw new Error(`Invalid facial-frame dimension: ${key}.`);
  }
  return shape;
}
