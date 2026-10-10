import type { IAutoMovieHumanPersonSourceCoverageProps } from "../structures/IAutoMovieHumanPersonSourceCoverageProps";
import type { IAutoMovieHumanPersonSourceEdge } from "../structures/IAutoMovieHumanPersonSourceEdge";
import type { IAutoMovieHumanPersonSourceInterval } from "../structures/IAutoMovieHumanPersonSourceInterval";

/**
 * Prove complete positive chart coverage of an admitted source triangle tree.
 * Cell sample IDs name immutable preimages in the parent's ordered corners.
 * Directed internal edges cancel once, and the remaining affine boundary
 * intervals cover each original side exactly without a fitted area tolerance.
 * This shared owner is used for geometric partitions and source normal cells;
 * callers admit count/index domains and supply that cell tree's preimages.
 * It measures chart coverage, not physical coordinates or surface collisions.
 * All input buffers and preimages remain read only.
 */
export function validateHumanPersonSourceCoverage(
  props: IAutoMovieHumanPersonSourceCoverageProps,
): void {
  const preimage = props.preimage;
  const edges: Map<string, IAutoMovieHumanPersonSourceEdge>[] = Array.from(
    { length: props.parentTriangles.length / 3 },
    () => new Map(),
  );
  for (const cell of props.cells) {
    const parent = cell.parent;
    const original = props.parentTriangles.slice(parent * 3, parent * 3 + 3);
    const samples = [...cell.samples];
    const chart = samples.map((sample) => {
      const weights = preimage(parent, sample);
      if (weights.some((one) => !original.includes(one.id)))
        throw new Error(
          "Person source cell leaves its declared parent triangle.",
        );
      return original
        .slice(1)
        .map((id) => weights.find((one) => one.id === id)?.weight ?? 0);
    });
    const determinant =
      (chart[1][0] - chart[0][0]) * (chart[2][1] - chart[0][1]) -
      (chart[1][1] - chart[0][1]) * (chart[2][0] - chart[0][0]);
    if (!(determinant > 0))
      throw new Error(
        "Person source cells must have positive nonzero oriented chart area.",
      );
    for (let k = 0; k < 3; k++) {
      const from = samples[k];
      const to = samples[(k + 1) % 3];
      const key = [from, to].sort((a, b) => a - b).join(":");
      const found = edges[parent].get(key);
      if (found === undefined) edges[parent].set(key, { from, to, count: 1 });
      else {
        if (found.count !== 1 || found.from !== to || found.to !== from)
          throw new Error(
            "Person source cell edges must cancel once in opposite directions.",
          );
        found.count = 2;
      }
    }
  }
  for (let parent = 0; parent < edges.length; parent++) {
    const original = props.parentTriangles.slice(parent * 3, parent * 3 + 3);
    const intervals: IAutoMovieHumanPersonSourceInterval[][] = [[], [], []];
    for (const edge of edges[parent].values()) {
      if (edge.count === 2) continue;
      const from = preimage(parent, edge.from);
      const to = preimage(parent, edge.to);
      const side = original.findIndex((a, k) =>
        [...from, ...to].every(
          (point) => point.id === a || point.id === original[(k + 1) % 3],
        ),
      );
      if (side < 0)
        throw new Error(
          "Person source partition leaves an uncovered interior edge.",
        );
      const end = original[(side + 1) % 3];
      const coordinate = (points: typeof from): number =>
        points.find((point) => point.id === end)?.weight ?? 0;
      const start = coordinate(from);
      const finish = coordinate(to);
      if (!(finish > start))
        throw new Error(
          "Person source boundary intervals must follow the original winding.",
        );
      intervals[side].push({ start, end: finish });
    }
    for (const side of intervals) {
      side.sort((a, b) => a.start - b.start);
      let end = 0;
      for (const interval of side) {
        if (interval.start !== end)
          throw new Error(
            "Person source boundary has a gap or overlapping interval.",
          );
        end = interval.end;
      }
      if (end !== 1)
        throw new Error(
          "Person source partitions must cover every original triangle.",
        );
    }
  }
}
