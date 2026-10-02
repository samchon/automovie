/**
 * Find each calibration sphere in a rendered frame by its pure colour. A
 * pixel belongs to a sphere when every channel lies within `tolerance` of the
 * sphere's colour and its alpha is opaque, so lighting, tone and shading
 * cannot move a pixel off its colour (the spheres are unlit). Returns the
 * pixel count and the centroid in pixels, top left origin, y downward, for
 * every named colour; a colour absent from the frame has count zero and a
 * null centroid. Pure over the pixel array, row-major RGBA bytes.
 *
 * @evidence contracts/common.md#principled-implementation A colour-keyed pixel census and centroid are exact for unlit pure colours; a shared border pixel would need a tolerance that this value bounds.
 * @evidence contracts/common.md#clear-and-simple-design One pure scan reads the whole frame once for all spheres.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads only pixels, never the camera or the rig positions it is checked against.
 * @evidence contracts/common.md#meaningful-documentation States the matching rule, frame and the absent-sphere result.
 * @evidence contracts/modeling.md#spatial-conventions Pixels with a top-left origin, y downward, row-major RGBA.
 */
export function measureHumanViewerCalibration(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
  colors: readonly { name: string; color: readonly [number, number, number] }[],
  tolerance = 6,
): Record<string, { count: number; x: number | null; y: number | null }> {
  const sums = colors.map(() => ({ count: 0, x: 0, y: 0 }));
  for (let y = 0; y < height; ++y)
    for (let x = 0; x < width; ++x) {
      const at = (y * width + x) * 4;
      if (rgba[at + 3] < 255) continue;
      for (let index = 0; index < colors.length; ++index) {
        const color = colors[index].color;
        if (
          Math.abs(rgba[at] - color[0]) <= tolerance &&
          Math.abs(rgba[at + 1] - color[1]) <= tolerance &&
          Math.abs(rgba[at + 2] - color[2]) <= tolerance
        ) {
          sums[index].count += 1;
          sums[index].x += x + 0.5;
          sums[index].y += y + 0.5;
          break;
        }
      }
    }
  return Object.fromEntries(
    colors.map((entry, index) => {
      const sum = sums[index];
      return [
        entry.name,
        {
          count: sum.count,
          x: sum.count === 0 ? null : sum.x / sum.count,
          y: sum.count === 0 ? null : sum.y / sum.count,
        },
      ];
    }),
  );
}
