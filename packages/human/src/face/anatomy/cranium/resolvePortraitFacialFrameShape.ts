import { IPortraitFacialFrameShape } from "./structures/IPortraitFacialFrameShape";

/**
 * Resolve facial-frame dimensions without clipping and return owned settings.
 * Identity uses scales of one and displacements of zero, irrespective of person.
 *
 * @evidence contracts/common.md#principled-implementation Identity scales and zero displacements are merged with supplied fields, then every dimension is admitted against its existing scale or millimetre envelope.
 * @evidence contracts/common.md#clear-and-simple-design One resolver centralizes defaults and named-field refusal before either frame construction or width-limit trials consume them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-finite/out-of-envelope values refuse rather than being clipped or selected according to person/fixture identity.
 * @evidence contracts/common.md#meaningful-documentation The prose states owned settings and person-independent identity, while the public shape members carry the scale/displacement ranges.
 * @evidence contracts/performance.md#efficient-algorithms The supported eight-member frame record is copied and scanned once; work and allocation are constant relative to host geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Both direct frame construction and document resolution share this same default/admission owner; no changed-input result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned settings object escapes and no source geometry, handle or task is retained.
 */
export function resolvePortraitFacialFrameShape(
  input: IPortraitFacialFrameShape = {},
): Required<IPortraitFacialFrameShape> {
  const shape: {
    widthScale: number;
    lengthScale: number;
    jawWidth: number;
    chinHeight: number;
    chinProjection: number;
    foreheadProjection: number;
    browProjection: number;
    templeWidth: number;
  } = {
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
    const scale: boolean = key === "widthScale" || key === "lengthScale";
    if (
      !Number.isFinite(value) ||
      value < (scale ? 0.7 : -8) ||
      value > (scale ? 1.3 : 8)
    )
      throw new Error(`Invalid facial-frame dimension: ${key}.`);
  }
  return shape;
}
