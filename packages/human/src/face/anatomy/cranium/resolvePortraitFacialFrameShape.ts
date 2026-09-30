import { IPortraitFacialFrameShape } from "./structures/IPortraitFacialFrameShape";

/**
 * Resolve facial-frame dimensions without clipping and return owned settings.
 * Identity uses scales of one and displacements of zero, irrespective of person.
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
