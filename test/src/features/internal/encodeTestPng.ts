import { deflateSync } from "node:zlib";

/** CRC-32 of the PNG specification (ISO 3309 polynomial 0xEDB88320), table-driven. */
const CRC_TABLE: Uint32Array = Uint32Array.from(
  { length: 256 },
  (_: unknown, n: number): number => {
    let c: number = n;
    for (let k: number = 0; k < 8; ++k)
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  },
);

const crc32: (bytes: Uint8Array) => number = (bytes: Uint8Array): number => {
  let c: number = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk: (type: string, body: Uint8Array) => Buffer = (
  type: string,
  body: Uint8Array,
): Buffer => {
  const head: Buffer = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "latin1");
  const tail: Buffer = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, tail]);
};

/**
 * Encode authored 8-bit samples as a base64 PNG with the requested filter per scanline, independently of the viewer's decoder: filtering runs forward from PNG section 9 and compression uses Node's zlib.
 *
 * `header` overrides IHDR bytes 8 to 12 (depth, colour type, compression, filter, interlace) to author headers outside the decoded subset; `truncate` drops that many bytes from the end of the compressed stream.
 */
export const encodeTestPng: (props: {
  width: number;
  height: number;
  colourType: 0 | 2 | 4 | 6;
  samples: readonly number[];
  filters?: readonly number[];
  header?: Partial<
    Record<
      "depth" | "colourType" | "compression" | "filter" | "interlace",
      number
    >
  >;
  truncate?: number;
}) => string = (props: {
  width: number;
  height: number;
  colourType: 0 | 2 | 4 | 6;
  samples: readonly number[];
  filters?: readonly number[];
  header?: Partial<
    Record<
      "depth" | "colourType" | "compression" | "filter" | "interlace",
      number
    >
  >;
  truncate?: number;
}): string => {
  const channels: number = { 0: 1, 2: 3, 4: 2, 6: 4 }[props.colourType];
  const stride: number = props.width * channels;
  const sample: (x: number, y: number) => number = (
    x: number,
    y: number,
  ): number =>
    x < 0 || y < 0 ? 0 : props.samples[y * stride + x]!;
  const raw: number[] = [];
  for (let y: number = 0; y < props.height; ++y) {
    const filter: number = props.filters?.[y] ?? 0;
    raw.push(filter);
    for (let x: number = 0; x < stride; ++x) {
      const left: number = sample(x - channels, y);
      const up: number = sample(x, y - 1);
      const corner: number = sample(x - channels, y - 1);
      const estimate: number = left + up - corner;
      const paeth: number =
        Math.abs(estimate - left) <= Math.abs(estimate - up) &&
        Math.abs(estimate - left) <= Math.abs(estimate - corner)
          ? left
          : Math.abs(estimate - up) <= Math.abs(estimate - corner)
            ? up
            : corner;
      const predictor: number = [
        0,
        left,
        up,
        Math.floor((left + up) / 2),
        paeth,
      ][filter]!;
      raw.push((sample(x, y) - predictor + 256) & 255);
    }
  }
  const ihdr: Buffer = Buffer.alloc(13);
  ihdr.writeUInt32BE(props.width, 0);
  ihdr.writeUInt32BE(props.height, 4);
  ihdr[8] = props.header?.depth ?? 8;
  ihdr[9] = props.header?.colourType ?? props.colourType;
  ihdr[10] = props.header?.compression ?? 0;
  ihdr[11] = props.header?.filter ?? 0;
  ihdr[12] = props.header?.interlace ?? 0;
  const compressed: Buffer = deflateSync(Uint8Array.from(raw));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk(
      "IDAT",
      compressed.subarray(0, compressed.length - (props.truncate ?? 0)),
    ),
    chunk("IEND", new Uint8Array(0)),
  ]).toString("base64");
};
