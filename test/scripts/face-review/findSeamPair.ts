import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

import { roundedMillimetres } from "./roundedMillimetres";

type Surface = IAutoMovieHumanFaceBasis["surfaces"][number];

/** Jaw weight per vertex of a surface, zero where unattached. */
const jawWeights = (surface: Surface): Float64Array => {
  const weights = new Float64Array(surface.positions.length / 3);
  for (const attachment of surface.attachments ?? [])
    if (attachment.owner === "jaw")
      for (let i = 0; i < attachment.rows.length; i += 2)
        weights[attachment.rows[i]] = attachment.rows[i + 1];
  return weights;
};

/**
 * The closest pair of a fixed and a mandibular vertex among `candidates`
 * whose transverse coordinate about the jaw axis lies within the band.
 */
export function findSeamPair(props: {
  surface: Surface;
  candidates: Iterable<number>;
  axis: readonly number[];
  pivot: readonly number[];
  bandMetres: number;
}): { upper: number; lower: number; gapMetres: number } {
  const { surface, axis, pivot } = props;
  const weights = jawWeights(surface);
  const fixed: number[] = [];
  const moving: number[] = [];
  for (const vertex of props.candidates) {
    const across = [0, 1, 2].reduce(
      (total, k) =>
        total + (surface.positions[3 * vertex + k] - pivot[k]) * axis[k],
      0,
    );
    if (Math.abs(across) > props.bandMetres) continue;
    (weights[vertex] < 0.5 ? fixed : moving).push(vertex);
  }
  let best: { upper: number; lower: number; gapMetres: number } | undefined;
  for (const upper of fixed)
    for (const lower of moving) {
      const gap = Math.hypot(
        surface.positions[3 * upper] - surface.positions[3 * lower],
        surface.positions[3 * upper + 1] - surface.positions[3 * lower + 1],
        surface.positions[3 * upper + 2] - surface.positions[3 * lower + 2],
      );
      if (best === undefined || gap < best.gapMetres)
        best = { upper, lower, gapMetres: gap };
    }
  if (best === undefined)
    throw new Error(
      `${surface.id} has no fixed and mandibular vertex pair within ${roundedMillimetres(props.bandMetres)} mm of the midline.`,
    );
  return best;
}
