import { catmullRomPoint } from "../../mesh/catmullRomPoint";
import type { IHumanFaceBrowTintProps } from "./IHumanFaceBrowTintProps";

/**
 * Tint the skin under one eyebrow by the share of it the shafts cover.
 *
 * A brow shaft is a few hundredths of a millimetre wide, far below a pixel at
 * the distance a head is framed, so a coverage tint approximates the
 * unresolved population. This function places that approximation on the skin, as the scalp tint does
 * under scalp hair, so the brow reads as a band where its shafts cannot be
 * resolved and the shafts carry the detail where they can.
 *
 * Coverage is the shafts' silhouette area over the band's area, at most one.
 * A tube's silhouette seen broadside is its lateral area over pi and a
 * ribbon's is its own area; overlap between shafts is not removed, which the
 * cap at one bounds. The band's area is summed over a 48 by 8 lattice of the
 * band between its two registered boundaries before those points are seated.
 * This is authored loft area, not a projected-skin area integral or an exact
 * visible-pixel average. Subsequent skin seating supplies only the splat:
 * each lattice point gives its triangle's three vertices its barycentric weights;
 * a vertex's weight is its accumulated share normalized by the largest, so
 * the tint is full inside the band and falls off over the band's own
 * boundary triangles. The gain of a vertex is
 * `1 + (fibre / skin - 1) * coverage * opacity * weight` per channel,
 * multiplied into the gains it is given and kept in [0,1], so fibres lighter
 * than the skin leave it unchanged, as under scalp hair.
 *
 * No shaft gives no tint. The coverage is a geometric ratio of the emitted
 * population and no measured optical density of a brow.
 */
export function applyHumanFaceBrowTint(props: IHumanFaceBrowTintProps): void {
  const { host, positions, binding, shafts, gains } = props;
  if (shafts.length === 0) return;
  let silhouette = 0;
  for (const shaft of shafts) {
    const indices = shaft.indices ?? [];
    let area = 0;
    for (let at = 0; at < indices.length; at += 3)
      area += triangleArea(
        shaft.positions,
        indices[at],
        indices[at + 1],
        indices[at + 2],
      );
    silhouette += props.ribbon ? area : area / Math.PI;
  }
  const landmark = (id: number) => ({
    x: positions[3 * id],
    y: positions[3 * id + 1],
    z: positions[3 * id + 2],
  });
  const top = binding.upper.map(landmark),
    bottom = binding.lower.map(landmark);
  const columns = 48,
    rows = 8;
  const lattice: number[] = [];
  for (let row = 0; row <= rows; row++)
    for (let column = 0; column <= columns; column++) {
      const a = catmullRomPoint(bottom, column / columns),
        b = catmullRomPoint(top, column / columns),
        t = row / rows;
      lattice.push(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t,
        a.z + (b.z - a.z) * t,
      );
    }
  let band = 0;
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column;
      band +=
        triangleArea(lattice, a, a + 1, a + columns + 1) +
        triangleArea(lattice, a + 1, a + columns + 2, a + columns + 1);
    }
  if (!(band > 0)) return;
  const coverage = Math.min(1, silhouette / band) * props.opacity;
  const weights = new Map<number, number>();
  for (let at = 0; at < lattice.length; at += 3) {
    const seat = host.seat(lattice.slice(at, at + 3));
    const vertices = host.corners(seat.triangle);
    for (let corner = 0; corner < 3; corner++)
      weights.set(
        vertices[corner],
        (weights.get(vertices[corner]) ?? 0) + seat.weights[corner],
      );
  }
  let largest = 0;
  for (const weight of weights.values()) largest = Math.max(largest, weight);
  if (!(largest > 0)) return;
  for (const [vertex, weight] of weights)
    for (let channel = 0; channel < 3; channel++) {
      const ratio =
        props.skin[channel] > 0
          ? props.fibre[channel] / props.skin[channel]
          : 1;
      gains[3 * vertex + channel] *= Math.min(
        1,
        Math.max(0, 1 + (ratio - 1) * coverage * (weight / largest)),
      );
    }
}

const triangleArea = (
  points: readonly number[],
  a: number,
  b: number,
  c: number,
): number => {
  const ux = points[3 * b] - points[3 * a],
    uy = points[3 * b + 1] - points[3 * a + 1],
    uz = points[3 * b + 2] - points[3 * a + 2];
  const vx = points[3 * c] - points[3 * a],
    vy = points[3 * c + 1] - points[3 * a + 1],
    vz = points[3 * c + 2] - points[3 * a + 2];
  return (
    Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2
  );
};
