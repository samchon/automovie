import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];

/**
 * Quasi-static soft-tissue sag under gravity, the step after skinning in
 * `createHumanBodyBasisBuilder`.
 *
 * Soft tissue hangs from its body under gravity. At the rest pose the
 * source's sculpted shape already carries that hang, so only the change of
 * gravity's direction in each vertex's own frame moves the tissue: a vertex
 * whose skin the pose turned by `R` hangs toward `R · down` in its rest
 * shape and is pulled toward `down` now, and it moves by
 * `gain · compliance · (down − R · down)`. Its compliance is the soft tissue
 * it carries, the document's body at rest less the same body made lean
 * (each declared tissue channel at its lean weight) along the rest normal
 * where that is outward, times a softness the document's own channels set
 * (age raises it, muscle lowers it; Cutometer elasticity falls with age at
 * every site). Tissue is continuous, so the displacement field is smoothed
 * over `sweeps` sweeps that each take a vertex half way to its neighbours'
 * mean, with the surface's open boundary (the neck's cut) held at its skinned
 * position throughout, so the field fades into it. `down` is the basis frame's -Y, the direction the neutral stands
 * against.
 *
 * The calibration: a breast about 8 to 10 cm thick moves 3 to 6 cm between
 * prone and supine MRI, 0.3 to 0.6 of its thickness for gravity reversed,
 * which the model gives as `gain · softness · 2`; the declared gain is read
 * against that.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Moves the skin's soft tissue with gravity as a pose turns it, zero at the rest pose.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Implements the declared sag: tissue thickness against the lean body, softness from the document's channels, gravity's change in the skin's frame, smoothing and the held boundary.
 */
export function createHumanBodySurfaceSag(
  surface: Surface,
  sag: NonNullable<Surface["sag"]>,
): (props: {
  /** The document's shape at the rest pose, the lean shape, and the skinned positions. */
  rest: number[];
  lean: number[];
  skinned: number[];
  /** Per vertex, where the skin's rest `down` points after the pose (unit, basis frame). */
  hanging: number[];
  softness: number;
}) => number[] {
  const count = surface.positions.length / 3;
  const sets = Array.from({ length: count }, () => new Set<number>());
  const edges = new Map<string, number>();
  for (let t = 0; t < surface.indices.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = surface.indices[t + k];
      const b = surface.indices[t + ((k + 1) % 3)];
      sets[a].add(b);
      sets[b].add(a);
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  const neighbours = sets.map((set) => [...set]);
  const held = new Uint8Array(count);
  for (const [key, triangles] of edges)
    if (triangles === 1) for (const v of key.split(",")) held[Number(v)] = 1;

  return ({ rest, lean, skinned, hanging, softness }) => {
    const normals = new Float64Array(count * 3);
    for (let t = 0; t < surface.indices.length; t += 3) {
      const [a, b, c] = [0, 1, 2].map((k) => surface.indices[t + k]);
      const e1 = [0, 1, 2].map((k) => rest[b * 3 + k] - rest[a * 3 + k]);
      const e2 = [0, 1, 2].map((k) => rest[c * 3 + k] - rest[a * 3 + k]);
      const n = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
      ];
      for (const v of [a, b, c])
        for (let k = 0; k < 3; k++) normals[v * 3 + k] += n[k];
    }
    let field = new Float64Array(count * 3);
    for (let v = 0; v < count; v++) {
      if (held[v] === 1) continue;
      const size =
        Math.hypot(normals[v * 3], normals[v * 3 + 1], normals[v * 3 + 2]) || 1;
      let thickness = 0;
      for (let k = 0; k < 3; k++)
        thickness +=
          ((rest[v * 3 + k] - lean[v * 3 + k]) * normals[v * 3 + k]) / size;
      const compliance = sag.gain * Math.max(0, thickness) * softness;
      field[v * 3] = compliance * (0 - hanging[v * 3]);
      field[v * 3 + 1] = compliance * (-1 - hanging[v * 3 + 1]);
      field[v * 3 + 2] = compliance * (0 - hanging[v * 3 + 2]);
    }
    for (let sweep = 0; sweep < sag.sweeps; sweep++) {
      const next = new Float64Array(field.length);
      for (let v = 0; v < count; v++) {
        const around = neighbours[v];
        for (let k = 0; k < 3; k++) {
          let sum = 0;
          for (const u of around) sum += field[u * 3 + k];
          next[v * 3 + k] =
            held[v] === 1
              ? 0
              : around.length === 0
                ? field[v * 3 + k]
                : 0.5 * field[v * 3 + k] + (0.5 * sum) / around.length;
        }
      }
      field = next;
    }
    return skinned.map((value, i) => value + field[i]);
  };
}
