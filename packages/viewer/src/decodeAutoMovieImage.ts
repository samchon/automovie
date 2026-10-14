import type { IAutoMovieImage } from "@automovie/interface";
import * as THREE from "three";

/** The eight-byte PNG signature (W3C PNG, 2nd edition, section 5.2). */
const SIGNATURE: readonly number[] = [137, 80, 78, 71, 13, 10, 26, 10];

/** Samples per pixel for each decoded colour type. */
const CHANNELS: ReadonlyMap<number, number> = new Map([
  [0, 1],
  [2, 3],
  [4, 2],
  [6, 4],
]);

/**
 * Decode an image a model carries into an RGBA texture the shot cache owns like a loaded asset.
 *
 * The decoder reads the subset engine admission allows: a non-interlaced 8-bit greyscale, RGB, greyscale-alpha or RGBA PNG (W3C PNG, 2nd edition). It joins the IDAT chunks, inflates them as one zlib stream with the platform `DecompressionStream`, reverses the five scanline filters of section 9 and expands every pixel to RGBA, with alpha 255 where the image has none. Rows keep file order and `flipY` stays false, so the first PNG row samples at `v = 0` as glTF specifies. Pixels are not colour-managed or premultiplied; the binding later chooses sRGB or linear decoding. Sampling defaults match a loaded image texture: linear magnification, trilinear minification and generated mipmaps. Chunk checksums are not verified, but a short or mismatched data stream, an unknown filter or an unsupported header rejects with the image id.
 *
 * @evidence contracts/common.md#principled-implementation Implements PNG chunk parsing, zlib inflation through the standard DecompressionStream "deflate" format and the specification's None, Sub, Up, Average and Paeth reconstruction over bytes of the previous pixel and scanline, then a fixed channel expansion to RGBA8.
 * @evidence contracts/common.md#clear-and-simple-design One function turns a carried image into an owned Texture so the shot cache can treat it exactly like a host-loaded original; admission of the header subset stays in engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported depths, colour types, interlacing and filters reject instead of approximating, and the browser image decoder is not used because its colour management varies by host.
 * @evidence contracts/common.md#meaningful-documentation States the decoded subset, row orientation, absent colour management, sampling defaults, the unchecked CRC and which faults reject.
 * @evidence contracts/performance.md#efficient-algorithms For encoded bytes B and pixels P, base64 decoding, chunk walking and IDAT joining cost O(B), inflation is streamed by the platform and reconstruction plus expansion cost O(P) with one raw and one RGBA buffer.
 * @evidence contracts/performance.md#reuse-equivalent-work The shot cache calls this at most once per carried image id and shares the decoded Source across bindings; the decoder itself keeps no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Encoded, joined and inflated buffers expire with the call; the returned texture and its RGBA buffer transfer to the caller, which the shot cache retires.
 */
export const decodeAutoMovieImage: (
  image: IAutoMovieImage,
) => Promise<THREE.DataTexture> = async (
  image: IAutoMovieImage,
): Promise<THREE.DataTexture> => {
  const refuse: (reason: string) => Error = (reason: string): Error =>
    new Error(`Carried image "${image.id}" ${reason}.`);
  const binary: string = atob(image.data);
  const bytes: Uint8Array = Uint8Array.from(
    binary,
    (character: string): number => character.charCodeAt(0),
  );
  if (SIGNATURE.some((value: number, i: number): boolean => bytes[i] !== value))
    throw refuse("is not a PNG");
  const view: DataView = new DataView(bytes.buffer);
  let header: { width: number; height: number; channels: number } | null =
    null;
  const data: Uint8Array[] = [];
  let offset: number = 8;
  while (offset + 8 <= bytes.length) {
    const length: number = view.getUint32(offset);
    const type: string = String.fromCharCode(
      ...bytes.subarray(offset + 4, offset + 8),
    );
    const body: Uint8Array = bytes.subarray(offset + 8, offset + 8 + length);
    if (body.length !== length) throw refuse("ends inside a chunk");
    if (type === "IHDR") {
      const channels: number | undefined = CHANNELS.get(body[9]!);
      if (
        length !== 13 ||
        body[8] !== 8 ||
        channels === undefined ||
        body[10] !== 0 ||
        body[11] !== 0 ||
        body[12] !== 0
      )
        throw refuse(
          "must be a non-interlaced 8-bit greyscale, RGB or RGBA PNG",
        );
      header = {
        width: view.getUint32(offset + 8),
        height: view.getUint32(offset + 12),
        channels,
      };
    } else if (type === "IDAT") data.push(body);
    else if (type === "IEND") break;
    offset += 12 + length;
  }
  if (header === null || data.length === 0)
    throw refuse("has no image header or data");
  const {
    width,
    height,
    channels,
  }: { width: number; height: number; channels: number } = header;
  const stride: number = width * channels;
  const raw: Uint8Array = new Uint8Array(
    await new Response(
      new Blob(data as BlobPart[])
        .stream()
        .pipeThrough(new DecompressionStream("deflate")),
    ).arrayBuffer(),
  );
  if (raw.length !== (stride + 1) * height)
    throw refuse("has image data that does not match its size");
  const pixels: Uint8Array = new Uint8Array(stride * height);
  for (let y: number = 0; y < height; ++y) {
    const filter: number = raw[y * (stride + 1)]!;
    if (filter > 4) throw refuse(`uses unknown scanline filter ${filter}`);
    const row: number = y * stride;
    const source: number = y * (stride + 1) + 1;
    for (let x: number = 0; x < stride; ++x) {
      const left: number = x >= channels ? pixels[row + x - channels]! : 0;
      const up: number = y > 0 ? pixels[row - stride + x]! : 0;
      const corner: number =
        x >= channels && y > 0 ? pixels[row - stride + x - channels]! : 0;
      const predictor: number =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? up
              : filter === 3
                ? (left + up) >> 1
                : paeth(left, up, corner);
      pixels[row + x] = (raw[source + x]! + predictor) & 255;
    }
  }
  const rgba: Uint8Array = new Uint8Array(width * height * 4);
  for (let i: number = 0; i < width * height; ++i) {
    const at: number = i * channels;
    const grey: boolean = channels <= 2;
    rgba[4 * i] = pixels[at]!;
    rgba[4 * i + 1] = grey ? pixels[at]! : pixels[at + 1]!;
    rgba[4 * i + 2] = grey ? pixels[at]! : pixels[at + 2]!;
    rgba[4 * i + 3] =
      channels === 2 ? pixels[at + 1]! : channels === 4 ? pixels[at + 3]! : 255;
  }
  const texture: THREE.DataTexture = new THREE.DataTexture(
    rgba,
    width,
    height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.name = image.id;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
};

/** The Paeth predictor of PNG section 9.4: the neighbour nearest the linear estimate, ties to left, then up. */
const paeth: (left: number, up: number, corner: number) => number = (
  left: number,
  up: number,
  corner: number,
): number => {
  const estimate: number = left + up - corner;
  const a: number = Math.abs(estimate - left);
  const b: number = Math.abs(estimate - up);
  const c: number = Math.abs(estimate - corner);
  return a <= b && a <= c ? left : b <= c ? up : corner;
};
