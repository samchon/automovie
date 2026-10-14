import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IHumanFaceSkinSeat } from "../skin/IHumanFaceSkinSeat";

import { catmullRomPoint } from "../../mesh/catmullRomPoint";
import type { IHumanFaceBrowTintProps } from "./IHumanFaceBrowTintProps";

/**
 * Tint the skin under one eyebrow by the share of it the shafts cover.
 *
 * A coverage tint approximates the shaft population where its fine geometry
 * is unresolved by the current view. This function places that approximation
 * on the skin, as the scalp tint does
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
 * clamped to [0,1] and multiplied into the supplied gains. The actual builder
 * starts those gains at one, so that caller's gains remain in [0,1]; this
 * function does not independently clamp arbitrary preexisting gains. Fibres
 * lighter than the skin leave the gains unchanged, as under scalp hair.
 *
 * No shaft gives no tint. The coverage is a geometric ratio of the emitted
 * population and no measured optical density of a brow.
 *
 * @evidence contracts/common.md#principled-implementation Summed tube/ribbon silhouette area divided by the authored loft-band area yields capped coverage; barycentric splats distribute its RGB gain on the same skin.
 * @evidence contracts/common.md#clear-and-simple-design The fixed 48-by-8 band lattice estimates area, the supplied host seats its splats, and the caller retains the multiplied gains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Overlapping silhouettes are not removed and loft area is not a projected-skin integral; lighter fibres leave gains unchanged under the documented cap.
 * @evidence contracts/common.md#meaningful-documentation The prose states the coverage/gain equation, lattice, geometric approximation and no-shaft behavior.
 * @evidence contracts/performance.md#efficient-algorithms Work scans every emitted shaft triangle, builds a fixed 441-point band lattice, and seats those points through the host's spatial instrument; colour updates scale with touched vertices.
 * @evidence contracts/performance.md#reuse-equivalent-work One supplied host serves every lattice seat and one call-local weight map accumulates repeated resident splats instead of reseating per colour channel.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary lattice and touched-vertex weight map expire on return; only caller-owned gains are mutated and no host or shaft cache is retained.
 */
export function applyHumanFaceBrowTint(props: IHumanFaceBrowTintProps): void {
  const { host, positions, binding, shafts, gains }: IHumanFaceBrowTintProps = props;
  if (shafts.length === 0) return;
  let silhouette: number = 0;
  for (const shaft of shafts) {
    const indices: number[] = shaft.indices ?? [];
    let area: number = 0;
    for (let at: number = 0; at < indices.length; at += 3)
      area += triangleArea(
        shaft.positions,
        indices[at],
        indices[at + 1],
        indices[at + 2],
      );
    silhouette += props.ribbon ? area : area / Math.PI;
  }
  const landmark: (id: number) => IAutoMovieVector3 = (id: number): IAutoMovieVector3 => ({
    x: positions[3 * id],
    y: positions[3 * id + 1],
    z: positions[3 * id + 2],
  });
  const top: IAutoMovieVector3[] = binding.upper.map(landmark),
    bottom: IAutoMovieVector3[] = binding.lower.map(landmark);
  const columns: number = 48 as const,
    rows: number = 8 as const;
  const lattice: number[] = [];
  for (let row: number = 0; row <= rows; row++)
    for (let column: number = 0; column <= columns; column++) {
      const a: IAutoMovieVector3 = catmullRomPoint(bottom, column / columns),
        b: IAutoMovieVector3 = catmullRomPoint(top, column / columns),
        t: number = row / rows;
      lattice.push(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t,
        a.z + (b.z - a.z) * t,
      );
    }
  let band: number = 0;
  for (let row: number = 0; row < rows; row++)
    for (let column: number = 0; column < columns; column++) {
      const a: number = row * (columns + 1) + column;
      band +=
        triangleArea(lattice, a, a + 1, a + columns + 1) +
        triangleArea(lattice, a + 1, a + columns + 2, a + columns + 1);
    }
  if (!(band > 0)) return;
  const coverage: number = Math.min(1, silhouette / band) * props.opacity;
  const weights: Map<number, number> = new Map<number, number>();
  for (let at: number = 0; at < lattice.length; at += 3) {
    const seat: IHumanFaceSkinSeat = host.seat(lattice.slice(at, at + 3));
    const vertices: number[] = host.corners(seat.triangle);
    for (let corner: number = 0; corner < 3; corner++)
      weights.set(
        vertices[corner],
        (weights.get(vertices[corner]) ?? 0) + seat.weights[corner],
      );
  }
  let largest: number = 0;
  for (const weight of weights.values()) largest = Math.max(largest, weight);
  if (!(largest > 0)) return;
  for (const [vertex, weight] of weights)
    for (let channel: number = 0; channel < 3; channel++) {
      const ratio: number =
        props.skin[channel] > 0
          ? props.fibre[channel] / props.skin[channel]
          : 1;
      gains[3 * vertex + channel] *= Math.min(
        1,
        Math.max(0, 1 + (ratio - 1) * coverage * (weight / largest)),
      );
    }
}

const triangleArea: (points: readonly number[], a: number, b: number, c: number) => number = (
  points: readonly number[],
  a: number,
  b: number,
  c: number,
): number => {
  const ux: number = points[3 * b] - points[3 * a],
    uy: number = points[3 * b + 1] - points[3 * a + 1],
    uz: number = points[3 * b + 2] - points[3 * a + 2];
  const vx: number = points[3 * c] - points[3 * a],
    vy: number = points[3 * c + 1] - points[3 * a + 1],
    vz: number = points[3 * c + 2] - points[3 * a + 2];
  return (
    Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2
  );
};
