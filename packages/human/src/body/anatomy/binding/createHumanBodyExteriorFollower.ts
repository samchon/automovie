import type { IAutoMovieHumanBodyExteriorBinding } from "./IAutoMovieHumanBodyExteriorBinding";

/**
 * Compile the rule by which points under a skin follow that skin's displacement.
 *
 * The returned function takes points in the neutral frame and the skin's displacement, three metres per native skin vertex, and returns the points moved by the inverse-distance weighted mean displacement of their nearest neutral skin vertices. The neighbour search runs once per distinct point array and is remembered against it, so a body that is shaped repeatedly pays for the search once per part.
 *
 * Nearest neighbours are sought on a uniform lattice over the neutral skin vertices, with cell size derived from bounding volume and vertex count. With representable lattice keys and distance arithmetic, the shell bound searches the nearest set rather than sampling it. A coincident point follows the coincident samples. Finite input scalars alone do not establish those derived arithmetic premises.
 *
 * Skin and point arrays must stay immutable while this follower exists; identity reuse does not detect in-place edits. Neighbour count and exponent are compiled snapshots. Invalid finite/cardinality inputs throw without changing caller arrays. The rule is an authored exterior interpolation, not a tissue model. Flat or extreme-aspect bounds can require large empty-shell scans. Large coordinate ranges can overflow derived cells/distances or lose integer-key distinctions, and extreme exponents can overflow or underflow distance powers. These unresolved limits can prevent a valid nearest-set or finite interpolation result.
 *
 * @evidence contracts/common.md#principled-implementation Lattice shells and inverse-distance weights implement exterior interpolation under representable keys/distances; coincidence is explicit, while derived arithmetic, extreme aspect ratios and weight overflow remain unresolved limits.
 * @evidence contracts/common.md#clear-and-simple-design The closure owns skin indexing/weak point correspondences; binding owns neighbour/exponent policy and callers supply each current displacement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reuse requires immutable sample arrays; exponent snapshot prevents later binding edits mixing old cached weights with new searches. No tissue validity is inferred.
 * @evidence contracts/common.md#meaningful-documentation The comment states metre triples, interpolation/coincidence, immutable-source caching premises, invalid-input refusal and remaining representation limits.
 * @evidence contracts/performance.md#efficient-algorithms Compilation scans N vertices; visited cells/candidates drive P-point search, O(PK) indices/weights and O(PK) application. Empty shells dominate flat/extreme-aspect bounds.
 * @evidence contracts/performance.md#reuse-equivalent-work One lattice serves all calls; weak keys reuse weights for the same immutable point array under fixed controls, with displacement evaluated afresh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains skin/lattice; live caller keys can retain unbounded aggregate O(PK) cache bytes. Dropping keys/follower releases weights without host tasks.
 */
export function createHumanBodyExteriorFollower(
  skin: readonly number[],
  binding: IAutoMovieHumanBodyExteriorBinding,
): (points: readonly number[], displacement: readonly number[]) => number[] {
  const count: number = skin.length / 3;
  const neighbours: number = Math.min(binding.neighbours, count);
  const power: number = binding.power;
  if (
    !Number.isSafeInteger(binding.neighbours) ||
    binding.neighbours < 1 ||
    !Number.isFinite(power) ||
    !(power > 0) ||
    !Number.isSafeInteger(count) ||
    count < 1 ||
    !skin.every(Number.isFinite)
  )
    throw new Error(
      "An exterior binding needs a positive neighbour count, a positive power and a skin.",
    );
  const low: number[] = [Infinity, Infinity, Infinity];
  const high: number[] = [-Infinity, -Infinity, -Infinity];
  for (let at: number = 0; at < skin.length; at++) {
    low[at % 3] = Math.min(low[at % 3], skin[at]);
    high[at % 3] = Math.max(high[at % 3], skin[at]);
  }
  // About four vertices per cell of the skin's bounding volume.
  const cell: number = Math.max(
    Math.cbrt(
      ((high[0] - low[0]) * (high[1] - low[1]) * (high[2] - low[2]) * 4) /
        count,
    ),
    1e-6,
  );
  const size: number[] = [0, 1, 2].map(
    (axis: number): number => Math.floor((high[axis] - low[axis]) / cell) + 1,
  );
  const cellOf: (value: number, axis: number) => number = (
    value: number,
    axis: number,
  ): number =>
    Math.min(
      size[axis] - 1,
      Math.max(0, Math.floor((value - low[axis]) / cell)),
    );
  const buckets: Map<number, number[]> = new Map<number, number[]>();
  for (let vertex: number = 0; vertex < count; vertex++) {
    const key: number =
      (cellOf(skin[vertex * 3], 0) * size[1] +
        cellOf(skin[vertex * 3 + 1], 1)) *
        size[2] +
      cellOf(skin[vertex * 3 + 2], 2);
    const bucket: number[] | undefined = buckets.get(key);
    if (bucket === undefined) buckets.set(key, [vertex]);
    else bucket.push(vertex);
  }
  const remembered: WeakMap<readonly number[], [Int32Array, Float64Array]> =
    new WeakMap<readonly number[], [Int32Array, Float64Array]>();
  const search: (points: readonly number[]) => [Int32Array, Float64Array] = (
    points: readonly number[],
  ): [Int32Array, Float64Array] => {
    const total: number = points.length / 3;
    const chosen: Int32Array = new Int32Array(total * neighbours);
    const weights: Float64Array = new Float64Array(total * neighbours);
    const nearest: Int32Array = new Int32Array(neighbours);
    const distance: Float64Array = new Float64Array(neighbours);
    for (let point: number = 0; point < total; point++) {
      const [x, y, z]: number[] = [
        points[point * 3],
        points[point * 3 + 1],
        points[point * 3 + 2],
      ];
      const home: number[] = [cellOf(x, 0), cellOf(y, 1), cellOf(z, 2)];
      // How far outside the lattice the point lies; shells are measured from the clamped home cell.
      const outside: number = Math.hypot(
        ...[x, y, z].map((value: number, axis: number): number =>
          Math.max(low[axis] - value, 0, value - high[axis] - cell),
        ),
      );
      let found: number = 0;
      for (let shell: number = 0; shell < Math.max(...size); shell++) {
        if (
          found === neighbours &&
          Math.max((shell - 1) * cell, outside) > Math.sqrt(distance[found - 1])
        )
          break;
        for (
          let i: number = Math.max(0, home[0] - shell);
          i <= Math.min(size[0] - 1, home[0] + shell);
          i++
        )
          for (
            let j: number = Math.max(0, home[1] - shell);
            j <= Math.min(size[1] - 1, home[1] + shell);
            j++
          )
            for (
              let k: number = Math.max(0, home[2] - shell);
              k <= Math.min(size[2] - 1, home[2] + shell);
              k++
            ) {
              if (
                Math.max(
                  Math.abs(i - home[0]),
                  Math.abs(j - home[1]),
                  Math.abs(k - home[2]),
                ) !== shell
              )
                continue;
              for (const vertex of buckets.get(
                (i * size[1] + j) * size[2] + k,
              ) ?? []) {
                const squared: number =
                  (skin[vertex * 3] - x) ** 2 +
                  (skin[vertex * 3 + 1] - y) ** 2 +
                  (skin[vertex * 3 + 2] - z) ** 2;
                if (found === neighbours && squared >= distance[found - 1])
                  continue;
                let slot: number =
                  found < neighbours ? found++ : neighbours - 1;
                while (slot > 0 && distance[slot - 1] > squared) {
                  distance[slot] = distance[slot - 1];
                  nearest[slot] = nearest[slot - 1];
                  slot--;
                }
                distance[slot] = squared;
                nearest[slot] = vertex;
              }
            }
      }
      let sum: number = 0;
      for (let slot: number = 0; slot < found; slot++) {
        const weight: number =
          distance[slot] === 0 ? Infinity : distance[slot] ** (-power / 2);
        weights[point * neighbours + slot] = weight;
        chosen[point * neighbours + slot] = nearest[slot];
        sum += weight;
      }
      for (let slot: number = 0; slot < found; slot++) {
        const at: number = point * neighbours + slot;
        // A point on a skin vertex takes that vertex alone.
        weights[at] =
          sum === Infinity
            ? weights[at] === Infinity
              ? 1
              : 0
            : weights[at] / sum;
      }
      if (sum === Infinity) {
        let coincident: number = 0;
        for (let slot: number = 0; slot < found; slot++)
          coincident += weights[point * neighbours + slot];
        for (let slot: number = 0; slot < found; slot++)
          weights[point * neighbours + slot] /= coincident;
      }
    }
    return [chosen, weights];
  };
  return (
    points: readonly number[],
    displacement: readonly number[],
  ): number[] => {
    if (points.length % 3 !== 0 || !points.every(Number.isFinite))
      throw new Error(
        "Exterior follower points must be finite complete metre triples.",
      );
    if (
      displacement.length !== skin.length ||
      !displacement.every(Number.isFinite)
    )
      throw new Error(
        "Skin displacement does not address this skin's vertices.",
      );
    let found: [Int32Array, Float64Array] | undefined = remembered.get(points);
    if (found === undefined) {
      found = search(points);
      remembered.set(points, found);
    }
    const [chosen, weights]: [Int32Array, Float64Array] = found;
    const moved: number[] = [...points];
    for (let at: number = 0; at < chosen.length; at++) {
      const point: number = Math.floor(at / neighbours) * 3;
      const vertex: number = chosen[at] * 3;
      for (let axis: number = 0; axis < 3; axis++)
        moved[point + axis] += weights[at] * displacement[vertex + axis];
    }
    return moved;
  };
}
