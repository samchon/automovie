/**
 * Accumulate the exact pixel-area coverage of one straight tapered fibre piece.
 *
 * Lash texture preparation supplies pixel-space centreline endpoints and full
 * widths. Their perpendicular offsets form a convex trapezoid. Intersecting
 * that trapezoid with each unit pixel square gives coverage by the shoelace
 * area formula, rather than deciding whether a pixel centre hits a disk stamp.
 * Thus a positive subpixel fibre cannot disappear solely because its sampling
 * phase falls between pixel centres. Adjacent pieces of the same fibre have
 * disjoint interiors, so the caller's coverage map accumulates their areas.
 *
 * Widths are finite and nonnegative, coordinates finite, and size a positive
 * integer, supplied by preparation. Zero length or zero width emits no area.
 * The caller owns the map; only its in-image entries are added, saturated at
 * one for rounding residue. Endpoints are unchanged. The caller composes
 * separate fibres and owns their anatomical dimensions and colour.
 *
 * @evidence contracts/common.md#principled-implementation Perpendicular endpoint widths construct the tapered strip. Closed half-plane clipping intersects it with each unit pixel square, and translated shoelace area gives coverage independent of pixel-centre sampling phase. The caller adds adjacent non-overlapping pieces of one fibre before separate-fibre composition.
 * @evidence contracts/common.md#clear-and-simple-design This owner computes area for one supplied strip; texture preparation owns tracing, anatomical widths, colour and fibre-to-fibre composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pixel coverage is derived from geometric intersection without fitted opacity, a photograph, subject identity or a minimum visible fibre width.
 * @evidence contracts/common.md#meaningful-documentation States the consumer, area derivation, coordinate unit, caller preconditions, zero-area behavior and the explicitly mutated coverage map.
 * @evidence contracts/modeling.md#spatial-conventions Coordinates and widths use pixels on one atlas; each pixel square has unit area and the returned coverage is its dimensionless covered fraction.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It owns no anatomical part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no shape channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It writes numerical pixel coverage and no resident mesh primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no anatomical surface boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; the regenerated lash asset owns observation of the visible result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It defines no anatomical width; preparation supplies the norm after metre-to-pixel conversion.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits a numerical strip, not a physiological configuration.
 * @evidenceExclude contracts/anatomy.md#parametric-authority These are internal texture-rasterization coordinates, not authored body controls.
 */
export function rasterizeEyelashSegment(input: {
  start: readonly [number, number];
  end: readonly [number, number];
  widthStart: number;
  widthEnd: number;
  size: number;
  coverage: Map<number, number>;
}): void {
  const { start, end, widthStart, widthEnd, size, coverage } = input;
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  if (length === 0 || (widthStart === 0 && widthEnd === 0)) return;
  const nx = -dy / length;
  const ny = dx / length;
  const polygon: [number, number][] = [
    [start[0] + nx * widthStart / 2, start[1] + ny * widthStart / 2],
    [end[0] + nx * widthEnd / 2, end[1] + ny * widthEnd / 2],
    [end[0] - nx * widthEnd / 2, end[1] - ny * widthEnd / 2],
    [start[0] - nx * widthStart / 2, start[1] - ny * widthStart / 2],
  ];
  const lowX = Math.max(0, Math.floor(Math.min(...polygon.map((p) => p[0]))));
  const highX = Math.min(size - 1, Math.ceil(Math.max(...polygon.map((p) => p[0]))) - 1);
  const lowY = Math.max(0, Math.floor(Math.min(...polygon.map((p) => p[1]))));
  const highY = Math.min(size - 1, Math.ceil(Math.max(...polygon.map((p) => p[1]))) - 1);
  for (let y = lowY; y <= highY; ++y)
    for (let x = lowX; x <= highX; ++x) {
      let clipped = clip(polygon, 0, x, true);
      clipped = clip(clipped, 0, x + 1, false);
      clipped = clip(clipped, 1, y, true);
      clipped = clip(clipped, 1, y + 1, false);
      // Translate into the unit pixel before summing, to avoid cancellation
      // of large atlas coordinates when the covered area is very small.
      const twice = clipped.reduce((sum, point, index) => {
        const next = clipped[(index + 1) % clipped.length];
        return sum + (point[0] - x) * (next[1] - y) - (point[1] - y) * (next[0] - x);
      }, 0);
      const area = Math.abs(twice) / 2;
      if (area === 0) continue;
      const index = y * size + x;
      coverage.set(index, Math.min(1, (coverage.get(index) ?? 0) + area));
    }
}

/** Convex polygon intersection with one closed axis-aligned half-plane. */
function clip(
  polygon: [number, number][], axis: 0 | 1, boundary: number, above: boolean,
): [number, number][] {
  const output: [number, number][] = [];
  if (polygon.length === 0) return output;
  let previous = polygon[polygon.length - 1];
  let wasInside = above ? previous[axis] >= boundary : previous[axis] <= boundary;
  for (const point of polygon) {
    const inside = above ? point[axis] >= boundary : point[axis] <= boundary;
    if (inside !== wasInside) {
      const fraction = (boundary - previous[axis]) / (point[axis] - previous[axis]);
      output.push([previous[0] + fraction * (point[0] - previous[0]),
        previous[1] + fraction * (point[1] - previous[1])]);
    }
    if (inside) output.push(point);
    previous = point;
    wasInside = inside;
  }
  return output;
}
