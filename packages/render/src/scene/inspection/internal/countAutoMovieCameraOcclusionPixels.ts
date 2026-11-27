/** Count membership after the same box reduction as the Draw picture. */
export function countAutoMovieCameraOcclusionPixels(
  props: IProps,
): ICount | undefined {
  const { bytes, sampleWidth, sampleHeight, factor, isolated } = props;
  const byteCount: number = 4 * sampleWidth * sampleHeight;
  if (
    (factor !== 1 && factor !== 2) ||
    sampleWidth < 1 ||
    sampleHeight < 1 ||
    sampleWidth % factor !== 0 ||
    sampleHeight % factor !== 0 ||
    bytes.length !== byteCount
  )
    return undefined;
  const width: number = sampleWidth / factor;
  const height: number = sampleHeight / factor;
  const limit: number = Math.ceil((width * height) / 8);
  if (isolated !== undefined && isolated.length !== limit) return undefined;
  const occupancy: Uint8Array = new Uint8Array(limit);
  let count: number = 0;
  for (let row: number = 0; row < height; ++row)
    for (let column: number = 0; column < width; ++column) {
      let covered: boolean = false;
      for (let y: number = 0; y < factor; ++y)
        for (let x: number = 0; x < factor; ++x) {
          const offset: number =
            ((row * factor + y) * sampleWidth + column * factor + x) * 4;
          const red: number | undefined = bytes[offset];
          if (
            (red !== 0 && red !== 255) ||
            bytes[offset + 1] !== red ||
            bytes[offset + 2] !== red ||
            bytes[offset + 3] !== 255
          )
            return undefined;
          covered ||= red === 255;
        }
      if (!covered) continue;
      const index: number = row * width + column;
      const byte: number = Math.floor(index / 8);
      const bit: number = 1 << (index % 8);
      if (isolated !== undefined && ((isolated[byte] ?? 0) & bit) === 0)
        return undefined;
      occupancy[byte] = (occupancy[byte] ?? 0) | bit;
      ++count;
    }
  return { count, occupancy };
}

/** One native black-and-white coverage read from the delivery mask. */
interface IProps {
  /** Full RGBA8 framebuffer, with opaque binary RGB entries. */
  bytes: Uint8Array;

  /** Width of the native framebuffer before delivery reduction. */
  sampleWidth: number;

  /** Height of the native framebuffer before delivery reduction. */
  sampleHeight: number;

  /** Whole native samples along a side of a delivered pixel. */
  factor: 1 | 2;

  /** Previously read isolated occupancy, when grading the composite. */
  isolated?: Uint8Array;
}

/** A delivered pixel count and its packed occupancy in native row order. */
interface ICount {
  /** Number of delivered pixels with at least one subject sample. */
  count: number;

  /** One bit per delivered pixel, low bit first. */
  occupancy: Uint8Array;
}
