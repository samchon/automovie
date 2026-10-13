import zlib from "node:zlib";
import { pngChunk } from "./pngChunk";

/** Author a small RGBA datastream with exact independently stated extent and optional compressed IDAT bytes. */
export function pngStream(
  width: number,
  height: number,
  withIdat: boolean,
): Uint8Array {
  const header: Buffer = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    ...(withIdat
      ? [
          pngChunk(
            "IDAT",
            zlib.deflateSync(Buffer.alloc(height * (1 + width * 4))),
          ),
        ]
      : []),
    pngChunk("IEND", new Uint8Array()),
  ]);
}
