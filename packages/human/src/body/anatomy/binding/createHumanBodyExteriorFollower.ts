import type { IAutoMovieHumanBodyExteriorBinding } from "./IAutoMovieHumanBodyExteriorBinding";

/**
 * Compile the rule by which points under a skin follow that skin's displacement.
 *
 * The returned function takes points in the neutral frame and the skin's
 * displacement, three metres per native skin vertex, and returns the points
 * moved by the inverse-distance weighted mean displacement of their nearest
 * neutral skin vertices. The neighbour search runs once per distinct point
 * array and is remembered against it, so a body that is shaped repeatedly
 * pays for the search once per part.
 *
 * Nearest neighbours are found on a uniform lattice over the neutral skin
 * vertices, whose cell is sized to hold a few vertices. A query examines
 * cubic shells of cells around its own and stops when the nearest unseen
 * shell cannot be nearer than its current furthest neighbour, so the answer is the
 * exact nearest set and not a sample of it. A point coincident with a skin
 * vertex takes that vertex's displacement.
 *
 * @evidence contracts/common.md#principled-implementation The shell search ends on a metric bound, so the weights are those of the true nearest vertices; positive normalised weights keep each moved point inside the range of the displacements it averages.
 * @evidence contracts/common.md#clear-and-simple-design One lattice, one search per point array, one weighted sum per build.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every point is treated alike; the search is exact and nothing is tuned to a part.
 * @evidence contracts/common.md#meaningful-documentation States the inputs, the caching rule and why the lattice search is exact.
 * @evidence contracts/modeling.md#spatial-conventions Points, skin positions and displacements are metres in the body's one neutral frame; the skin is addressed by native vertex ordinal.
 * @evidence contracts/modeling.md#shared-boundaries The skin displacement given here is the same one the exterior shows, so tissue and skin move by one definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The binding record owns the rule's parameters.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function moves given points and emits none.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The shape channels own their ranges.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no authoring input.
 */
export function createHumanBodyExteriorFollower(
  skin: readonly number[],
  binding: IAutoMovieHumanBodyExteriorBinding,
): (points: readonly number[], displacement: readonly number[]) => number[] {
  const count = skin.length / 3;
  const neighbours = Math.min(binding.neighbours, count);
  if (
    !Number.isInteger(binding.neighbours) ||
    binding.neighbours < 1 ||
    !(binding.power > 0) ||
    count < 1
  )
    throw new Error(
      "An exterior binding needs a positive neighbour count, a positive power and a skin.",
    );
  const low = [Infinity, Infinity, Infinity];
  const high = [-Infinity, -Infinity, -Infinity];
  for (let at = 0; at < skin.length; at++) {
    low[at % 3] = Math.min(low[at % 3], skin[at]);
    high[at % 3] = Math.max(high[at % 3], skin[at]);
  }
  // About four vertices per cell of the skin's bounding volume.
  const cell = Math.max(
    Math.cbrt(
      ((high[0] - low[0]) * (high[1] - low[1]) * (high[2] - low[2]) * 4) /
        count,
    ),
    1e-6,
  );
  const size = [0, 1, 2].map(
    (axis) => Math.floor((high[axis] - low[axis]) / cell) + 1,
  );
  const cellOf = (value: number, axis: number): number =>
    Math.min(
      size[axis] - 1,
      Math.max(0, Math.floor((value - low[axis]) / cell)),
    );
  const buckets = new Map<number, number[]>();
  for (let vertex = 0; vertex < count; vertex++) {
    const key =
      (cellOf(skin[vertex * 3], 0) * size[1] +
        cellOf(skin[vertex * 3 + 1], 1)) *
        size[2] +
      cellOf(skin[vertex * 3 + 2], 2);
    const bucket = buckets.get(key);
    if (bucket === undefined) buckets.set(key, [vertex]);
    else bucket.push(vertex);
  }
  const remembered = new WeakMap<
    readonly number[],
    [Int32Array, Float64Array]
  >();
  const search = (points: readonly number[]): [Int32Array, Float64Array] => {
    const total = points.length / 3;
    const chosen = new Int32Array(total * neighbours);
    const weights = new Float64Array(total * neighbours);
    const nearest = new Int32Array(neighbours);
    const distance = new Float64Array(neighbours);
    for (let point = 0; point < total; point++) {
      const [x, y, z] = [
        points[point * 3],
        points[point * 3 + 1],
        points[point * 3 + 2],
      ];
      const home = [cellOf(x, 0), cellOf(y, 1), cellOf(z, 2)];
      // How far outside the lattice the point lies; shells are measured from the clamped home cell.
      const outside = Math.hypot(
        ...[x, y, z].map((value, axis) =>
          Math.max(low[axis] - value, 0, value - high[axis] - cell),
        ),
      );
      let found = 0;
      for (let shell = 0; shell < Math.max(...size); shell++) {
        if (
          found === neighbours &&
          Math.max((shell - 1) * cell, outside) > Math.sqrt(distance[found - 1])
        )
          break;
        for (
          let i = Math.max(0, home[0] - shell);
          i <= Math.min(size[0] - 1, home[0] + shell);
          i++
        )
          for (
            let j = Math.max(0, home[1] - shell);
            j <= Math.min(size[1] - 1, home[1] + shell);
            j++
          )
            for (
              let k = Math.max(0, home[2] - shell);
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
                const squared =
                  (skin[vertex * 3] - x) ** 2 +
                  (skin[vertex * 3 + 1] - y) ** 2 +
                  (skin[vertex * 3 + 2] - z) ** 2;
                if (found === neighbours && squared >= distance[found - 1])
                  continue;
                let slot = found < neighbours ? found++ : neighbours - 1;
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
      let sum = 0;
      for (let slot = 0; slot < found; slot++) {
        const weight =
          distance[slot] === 0
            ? Infinity
            : distance[slot] ** (-binding.power / 2);
        weights[point * neighbours + slot] = weight;
        chosen[point * neighbours + slot] = nearest[slot];
        sum += weight;
      }
      for (let slot = 0; slot < found; slot++) {
        const at = point * neighbours + slot;
        // A point on a skin vertex takes that vertex alone.
        weights[at] =
          sum === Infinity
            ? weights[at] === Infinity
              ? 1
              : 0
            : weights[at] / sum;
      }
      if (sum === Infinity) {
        let coincident = 0;
        for (let slot = 0; slot < found; slot++)
          coincident += weights[point * neighbours + slot];
        for (let slot = 0; slot < found; slot++)
          weights[point * neighbours + slot] /= coincident;
      }
    }
    return [chosen, weights];
  };
  return (points, displacement) => {
    if (displacement.length !== skin.length)
      throw new Error(
        "Skin displacement does not address this skin's vertices.",
      );
    let found = remembered.get(points);
    if (found === undefined) {
      found = search(points);
      remembered.set(points, found);
    }
    const [chosen, weights] = found;
    const moved = [...points];
    for (let at = 0; at < chosen.length; at++) {
      const point = Math.floor(at / neighbours) * 3;
      const vertex = chosen[at] * 3;
      for (let axis = 0; axis < 3; axis++)
        moved[point + axis] += weights[at] * displacement[vertex + axis];
    }
    return moved;
  };
}
