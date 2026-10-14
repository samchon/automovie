import type { IAutoMovieHumanPersonSourceCoverageProps } from "../structures/IAutoMovieHumanPersonSourceCoverageProps";
import type { IAutoMovieHumanPersonSourceEdge } from "../structures/IAutoMovieHumanPersonSourceEdge";
import type { IAutoMovieHumanPersonSourceInterval } from "../structures/IAutoMovieHumanPersonSourceInterval";

/**
 * Admit positive chart coverage of an already domain-validated source tree. Ordered original-corner preimages give each child's positive affine determinant; interior source edges must cancel exactly once in opposite directions, and each remaining original-side interval must join exactly from zero to one. No fitted area tolerance changes that coverage.
 *
 * Geometry partitions and fixed normal-cell subdivisions share this owner with their respective preimage readers. IDs/weights/charts are dimensionless; valid population indices and finite positive source preimages are caller premises. Input arrays remain unchanged. This checks source chart incidence, not physical coordinates, self-intersection or tissue anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Positive ordered chart areas, exact directed-edge cancellation and contiguous original-side affine intervals admit complete parent coverage from actual source identities.
 * @evidence contracts/common.md#clear-and-simple-design One parent-relative preimage protocol serves geometric and normal-cell trees while their domain/source validators own valid counts and coefficients.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Gaps, overlaps, wrong winding and uncancelled interior edges refuse without fitted epsilon; chart coverage is not advertised as physical embeddedness.
 * @evidence contracts/common.md#meaningful-documentation Prose states exact dimensionless coverage rules, preimage/index premises, unchanged inputs and physical-validation limits.
 * @evidence contracts/performance.md#efficient-algorithms Cell chart/edge work scales with actual cells plus supplied preimage cost; per-parent remaining intervals sort O(E log E), with maps allocated by parent/edge population rather than original ID extent.
 * @evidence contracts/performance.md#reuse-equivalent-work Each parent edge map serves cancellation and boundary analysis, and the same coverage owner is reused for both source trees without a second geometric fitting rule.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Edge maps, chart rows and interval arrays are invocation-local; successful admission returns no data and retains no input reader, task or cache.
 */
export function validateHumanPersonSourceCoverage(
  props: IAutoMovieHumanPersonSourceCoverageProps,
): void {
  const preimage: IAutoMovieHumanPersonSourceCoverageProps["preimage"] =
    props.preimage;
  const edges: Map<string, IAutoMovieHumanPersonSourceEdge>[] = Array.from(
    { length: props.parentTriangles.length / 3 },
    (): Map<string, IAutoMovieHumanPersonSourceEdge> => new Map(),
  );
  for (const cell of props.cells) {
    const parent: number = cell.parent;
    const original: number[] = props.parentTriangles.slice(
      parent * 3,
      parent * 3 + 3,
    );
    const samples: number[] = [...cell.samples];
    const chart: number[][] = samples.map((sample: number): number[] => {
      const weights: ReturnType<typeof preimage> = preimage(parent, sample);
      if (
        weights.some(
          (one: ReturnType<typeof preimage>[number]): boolean =>
            !original.includes(one.id),
        )
      )
        throw new Error(
          "Person source cell leaves its declared parent triangle.",
        );
      return original
        .slice(1)
        .map(
          (id: number): number =>
            weights.find(
              (one: ReturnType<typeof preimage>[number]): boolean =>
                one.id === id,
            )?.weight ?? 0,
        );
    });
    const determinant: number =
      (chart[1][0] - chart[0][0]) * (chart[2][1] - chart[0][1]) -
      (chart[1][1] - chart[0][1]) * (chart[2][0] - chart[0][0]);
    if (!(determinant > 0))
      throw new Error(
        "Person source cells must have positive nonzero oriented chart area.",
      );
    for (let k: number = 0; k < 3; k++) {
      const from: number = samples[k];
      const to: number = samples[(k + 1) % 3];
      const key: string = [from, to]
        .sort((a: number, b: number): number => a - b)
        .join(":");
      const found: IAutoMovieHumanPersonSourceEdge | undefined =
        edges[parent].get(key);
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
  for (let parent: number = 0; parent < edges.length; parent++) {
    const original: number[] = props.parentTriangles.slice(
      parent * 3,
      parent * 3 + 3,
    );
    const intervals: IAutoMovieHumanPersonSourceInterval[][] = [[], [], []];
    for (const edge of edges[parent].values()) {
      if (edge.count === 2) continue;
      const from: ReturnType<typeof preimage> = preimage(parent, edge.from);
      const to: ReturnType<typeof preimage> = preimage(parent, edge.to);
      const side: number = original.findIndex((a: number, k: number): boolean =>
        [...from, ...to].every(
          (point: ReturnType<typeof preimage>[number]): boolean =>
            point.id === a || point.id === original[(k + 1) % 3],
        ),
      );
      if (side < 0)
        throw new Error(
          "Person source partition leaves an uncovered interior edge.",
        );
      const end: number = original[(side + 1) % 3];
      const coordinate: (points: typeof from) => number = (
        points: typeof from,
      ): number =>
        points.find(
          (point: ReturnType<typeof preimage>[number]): boolean =>
            point.id === end,
        )?.weight ?? 0;
      const start: number = coordinate(from);
      const finish: number = coordinate(to);
      if (!(finish > start))
        throw new Error(
          "Person source boundary intervals must follow the original winding.",
        );
      intervals[side].push({ start, end: finish });
    }
    for (const side of intervals) {
      side.sort(
        (
          a: IAutoMovieHumanPersonSourceInterval,
          b: IAutoMovieHumanPersonSourceInterval,
        ): number => a.start - b.start,
      );
      let end: number = 0;
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
