/*
 * Turn the bytes WebGL read from a drawn target into the base64 text a draw
 * page returns: rows flipped to start at the top, and a supersampled target
 * reduced to the picture's size by averaging each `factor` by `factor` block.
 *
 * `bytes` holds `width * height * 4` RGBA bytes of the drawn target, rows from
 * the bottom as `readPixels` writes them. The result holds `(width / factor) *
 * (height / factor) * 4` bytes, rows from the top. Averaging is the area
 * filter: each output pixel is the mean of the target pixels it covers.
 *
 * The target's colour is associated with its alpha, as blending over a cleared
 * target leaves it, so the mean is taken of associated colour and of alpha, and
 * the colour is then divided by the mean alpha into straight colour, 0 where
 * the alpha is 0, each rounded to the nearest byte. Averaging straight colour
 * instead would let a transparent sample's black darken every half-covered
 * edge. An opaque target, alpha 255 throughout, reduces to the plain mean of
 * each channel.
 *
 * It throws when the byte count is not the size's, or the factor is not a whole
 * number dividing both sides.
 */
export function encodeAutoMovieDrawPixels(
  bytes: Uint8Array,
  width: number,
  height: number,
  factor: number,
): string {
  if (bytes.length !== width * height * 4)
    throw new Error(
      `Drawn target holds ${bytes.length} bytes where ${width}x${height} RGBA needs ${width * height * 4}`,
    );
  if (factor < 1 || width % factor !== 0 || height % factor !== 0)
    throw new Error(
      `Supersampling factor ${factor} does not divide the drawn target ${width}x${height}`,
    );

  // Flip to rows from the top while averaging each factor-by-factor block.
  const outWidth: number = width / factor;
  const outHeight: number = height / factor;
  const area: number = factor * factor;
  const out: Uint8Array = new Uint8Array(outWidth * outHeight * 4);
  for (let row: number = 0; row < outHeight; row++)
    for (let column: number = 0; column < outWidth; column++) {
      const sums: number[] = [0, 0, 0, 0];
      for (let dy: number = 0; dy < factor; dy++) {
        const source: number = height - 1 - (row * factor + dy);
        for (let dx: number = 0; dx < factor; dx++)
          for (let channel: number = 0; channel < 4; channel++)
            sums[channel]! +=
              bytes[(source * width + column * factor + dx) * 4 + channel]!;
      }

      // Associated colour over its alpha is straight colour; both means share
      // the block area, which cancels.
      const alpha: number = sums[3]!;
      const at: number = (row * outWidth + column) * 4;
      for (let channel: number = 0; channel < 3; channel++)
        out[at + channel] =
          alpha === 0
            ? 0
            : Math.min(255, Math.round((sums[channel]! * 255) / alpha));
      out[at + 3] = Math.round(alpha / area);
    }

  // Base64 in chunks under the argument limit.
  let text: string = "";
  for (let offset: number = 0; offset < out.length; offset += CHUNK)
    text += String.fromCharCode(...out.subarray(offset, offset + CHUNK));
  return btoa(text);
}

/*
 * Bytes turned into one string at a time, kept under the argument limit of
 * `String.fromCharCode`.
 */
const CHUNK: number = 0x8000;
