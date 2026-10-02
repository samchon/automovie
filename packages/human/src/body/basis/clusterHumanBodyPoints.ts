/**
 * Group points so that two points closer than `gap` share a group.
 *
 * The groups are the connected components of the points binned into cubes of
 * side `gap` and joined across the twenty-six neighbouring cubes: a cube
 * chain is followed, so a stretch of points whose neighbours are each within
 * `gap` is one group however long it is. The rule is conservative (two points
 * in neighbouring cubes may be up to two cubes apart) and never separates two
 * points closer than `gap`. Groups hold the point indices in input order, and
 * a group's order follows its first point.
 *
 * @evidence contracts/common.md#principled-implementation Points within `gap` lie in the same or neighbouring cubes of side `gap`, and union-find over those neighbourhoods yields the connected components of that relation exactly; no two points closer than `gap` are ever separated, while two farther apart than two cubes never join directly.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: partition indices by proximity, with no notion of a garment or a skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The partition follows the points alone; nothing is tuned to a body or a garment.
 * @evidence contracts/common.md#meaningful-documentation The comment states the relation, its conservative side and the order of the result.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function partitions point indices and defines no part or group of a form.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function.
 */
export function clusterHumanBodyPoints(
  points: readonly number[],
  gap: number,
): number[][] {
  const count = points.length / 3;
  const parent = Array.from({ length: count }, (_, v) => v);
  const find = (v: number): number => {
    let root = v;
    while (parent[root] !== root) root = parent[root];
    while (parent[v] !== root) {
      const next = parent[v];
      parent[v] = root;
      v = next;
    }
    return root;
  };
  const cubes = new Map<string, number>();
  for (let v = 0; v < count; v++) {
    const cube = [0, 1, 2].map((k) => Math.floor(points[v * 3 + k] / gap));
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) {
          const other = cubes.get(
            cube[0] + dx + "/" + (cube[1] + dy) + "/" + (cube[2] + dz),
          );
          if (other !== undefined) parent[find(v)] = find(other);
        }
    cubes.set(cube.join("/"), v);
  }
  const groups = new Map<number, number[]>();
  for (let v = 0; v < count; v++) {
    const root = find(v);
    const group = groups.get(root);
    if (group === undefined) groups.set(root, [v]);
    else group.push(v);
  }
  return [...groups.values()];
}
