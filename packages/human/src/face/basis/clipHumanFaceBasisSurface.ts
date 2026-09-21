import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";

type Surface = IAutoMovieHumanFaceBasis["surfaces"][number];
type Stencil = { a: number; b: number; t: number };

/**
 * Clip an admitted facial basis surface above a neutral Y plane, in metres.
 * Offline basis preparation uses this to replace the neck's staircase cut.
 * Each undirected source edge owns one intersection vertex. Its frozen affine
 * stencil also evaluates every shape, expression and corrective displacement,
 * preserving common correspondence through subsequent edits. Corner UVs retain
 * their independent seams. Normals are reconstructed by the ordinary builder.
 *
 * Inputs are read only and must already satisfy basis correspondence admission.
 * Output arrays are owned. Region triangle maps contain only wholly retained
 * triangles, whose corner order and barycentric attachment coordinates survive.
 * A caller must refuse or explicitly rebind an attachment on a clipped triangle;
 * an absent mapping never means permission to discard that attachment. The
 * caller also assigns a new basis revision and updates every dependent binding.
 * The cut is open; it creates no cap or anatomy below the declared boundary.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Maintains one shared facial correspondence when preparing an attachment boundary.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Clips neutral connectivity with shared affine endpoint and corner-UV correspondence.
 */
export function clipHumanFaceBasisSurface(
  source: Surface,
  minimumY: number,
): { surface: Surface; retainedTriangles: Map<string, Map<number, number>> } {
  if (!Number.isFinite(minimumY))
    throw new Error("Facial clipping needs a finite Y plane.");
  const stencils: Stencil[] = [];
  const vertices = new Map<string, number>();
  const resident = (a: number, b = a, t = 0): number => {
    const key = a + "/" + b;
    const previous = vertices.get(key);
    if (previous !== undefined) return previous;
    const index = stencils.length;
    stencils.push({ a, b, t });
    vertices.set(key, index);
    return index;
  };
  const height = (v: number): number => source.positions[3 * v + 1];
  const retainedTriangles = new Map<string, Map<number, number>>();
  const regions = source.regions.map((region) => {
    const indices: number[] = [];
    const uvs: number[] | null = region.uvs === null ? null : [];
    const retained = new Map<number, number>();
    retainedTriangles.set(region.id, retained);
    for (let offset = 0; offset < region.indices.length; offset += 3) {
      const ids = region.indices.slice(offset, offset + 3);
      const inside = ids.map((v) => height(v) >= minimumY);
      if (inside.every(Boolean)) retained.set(offset / 3, indices.length / 3);
      const polygon: { vertex: number; uv: number[] | null }[] = [];
      const uv = (corner: number): number[] | null =>
        region.uvs === null
          ? null
          : region.uvs.slice((offset + corner) * 2, (offset + corner) * 2 + 2);
      for (let corner = 0; corner < 3; corner++) {
        const previous = (corner + 2) % 3;
        const a = ids[previous];
        const b = ids[corner];
        if (inside[previous] !== inside[corner]) {
          const low = Math.min(a, b);
          const high = Math.max(a, b);
          const t =
            (minimumY / 2 - height(low) / 2) /
            (height(high) / 2 - height(low) / 2);
          if (!Number.isFinite(t) || t < 0 || t > 1)
            throw new Error("Facial clipping exceeded finite edge arithmetic.");
          const vertex =
            t === 0
              ? resident(low)
              : t === 1
                ? resident(high)
                : resident(low, high, t);
          const first = uv(previous);
          const second = uv(corner);
          const fraction = a === low ? t : 1 - t;
          polygon.push({
            vertex,
            uv:
              first === null
                ? null
                : first.map(
                    (value, k) =>
                      (1 - fraction) * value + fraction * second![k],
                  ),
          });
        }
        if (inside[corner])
          polygon.push({ vertex: resident(b), uv: uv(corner) });
      }
      for (let corner = 1; corner + 1 < polygon.length; corner++) {
        const triangle = [polygon[0], polygon[corner], polygon[corner + 1]];
        if (new Set(triangle.map((v) => v.vertex)).size < 3) continue;
        indices.push(...triangle.map((v) => v.vertex));
        if (uvs !== null) uvs.push(...triangle.flatMap((v) => v.uv!));
      }
    }
    return { ...region, indices, uvs };
  });
  const positions = stencils.flatMap(({ a, b, t }) =>
    [0, 1, 2].map((k) =>
      a !== b && k === 1
        ? minimumY
        : (1 - t) * source.positions[3 * a + k] +
          t * source.positions[3 * b + k],
    ),
  );
  const targets = Object.fromEntries(
    Object.entries(source.targets).map(([name, rows]) => {
      const values = new Map<number, number[]>();
      for (let i = 0; i < rows.length; i += 4)
        values.set(rows[i], rows.slice(i + 1, i + 4));
      const output: number[] = [];
      for (const [vertex, { a, b, t }] of stencils.entries()) {
        const first = values.get(a);
        const second = values.get(b);
        const delta = [0, 1, 2].map(
          (k) => (1 - t) * (first?.[k] ?? 0) + t * (second?.[k] ?? 0),
        );
        if (delta.some((value) => value !== 0)) output.push(vertex, ...delta);
      }
      return [name, output];
    }),
  );
  const surface: Surface = {
    ...source,
    positions,
    indices: regions.flatMap((region) => region.indices),
    regions,
    targets,
  };
  if (source.rigidGroups !== undefined)
    surface.rigidGroups = source.rigidGroups.flatMap((group) => {
      const members = new Set(group.vertices);
      const vertices = stencils.flatMap(({ a }, i) =>
        members.has(a) ? [i] : [],
      );
      return vertices.length === 0 ? [] : [{ ...group, vertices }];
    });
  return { surface, retainedTriangles };
}
