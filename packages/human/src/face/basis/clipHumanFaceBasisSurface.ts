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
 * Output arrays are owned.
 * `correspondence` preserves the frozen source-edge preimage of each output
 * vertex, in output order: a resident source vertex has a=b and t=0, and
 * an edge vertex is (1-t)*a+t*b with a<b. A complementary source compiler
 * consumes these same identities rather than fitting positions to a new edge.
 * Region triangle maps contain only wholly retained triangles, whose corner
 * order and barycentric attachment coordinates survive.
 * A caller must refuse or explicitly rebind an attachment on a clipped triangle;
 * an absent mapping never means permission to discard that attachment. The
 * caller also assigns a new basis revision and updates every dependent binding.
 * The cut is open; it creates no cap or anatomy below the declared boundary.
 * Prepare numerical hair domains/contact closure after clipping. Their triangle
 * and vertex correspondence cannot be copied through a new cut; supplied hair
 * metadata refuses so this operation never leaves a stale closed collider.
 * A surface already bound to a shared source partition likewise refuses:
 * prepare the new common partition maps after the final crop instead of
 * copying bindings whose sample and parent populations belong to the old cut.
 *
 * @evidence contracts/common.md#principled-implementation Clipping a triangle mesh at a plane keeps the part with y >= plane: each source edge crossing the plane owns one intersection vertex whose position is the affine blend of its ends (y set to the plane), so shape, expression and corrective rows and attachment weights, all affine in the vertices, are evaluated by the same frozen stencil and correspondence survives edits. Convex polygons from clipping are fanned into triangles and corner UVs interpolate along the same edge parameter.
 * @evidence contracts/common.md#clear-and-simple-design One pass over regions building stencils, then one pass over positions, rows and attachments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hair metadata that would go stale refuses; an attachment on a clipped triangle is never silently dropped by the caller's contract.
 * @evidence contracts/common.md#meaningful-documentation States the stencil, the retained-triangle map, the open cut and the caller's duties after a new revision.
 * @evidence contracts/modeling.md#emitted-geometry The population is the source's retained triangles plus at most two triangles per clipped triangle, and one new vertex per crossing edge; a cap or further surface below the cut is not emitted, by contract.
 * @evidence contracts/modeling.md#shared-boundaries Both sides of a shared clipped edge use the one intersection vertex owned by that undirected edge, so adjacent triangles and regions meet at identical positions; the cut boundary itself is left open by design.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres along the neutral Y axis for the plane and vertices; nothing is converted.
 * @evidenceExclude contracts/anatomy.md#anatomical-source clipHumanFaceBasisSurface carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range clipHumanFaceBasisSurface admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority clipHumanFaceBasisSurface defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping clipHumanFaceBasisSurface is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels clipHumanFaceBasisSurface defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#rendered-observation clipHumanFaceBasisSurface consumes an admitted source and a caller-supplied mathematical plane, owning only affine clipping and correspondence; it defines no anatomical part, assembly, pose or observation conditions. The crop/bake revision producer and consuming face or person assembly retain their observation responsibilities.
 */
export function clipHumanFaceBasisSurface(
  source: Surface,
  minimumY: number,
): {
  surface: Surface;
  retainedTriangles: Map<string, Map<number, number>>;
  correspondence: readonly Readonly<Stencil>[];
} {
  if (!Number.isFinite(minimumY))
    throw new Error("Facial clipping needs a finite Y plane.");
  if (
    source.hairDomains !== undefined ||
    source.hairContactClosure !== undefined ||
    source.sourcePartition !== undefined ||
    source.sourcePosePlan !== undefined
  )
    throw new Error(
      "Prepare hair domains, contact closure, source partition and source pose plan after facial clipping.",
    );
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
        // An admitted source may contain a repeated-corner triangle. Record
        // correspondence only after confirming that its triangle is emitted.
        if (inside.every(Boolean)) retained.set(offset / 3, indices.length / 3);
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
  // An attachment weight travels like a position: a retained vertex keeps its
  // row, a ring vertex takes the affine blend of its edge ends, and a row that
  // blends to nothing is omitted rather than published as a zero weight.
  if (source.attachments !== undefined)
    surface.attachments = source.attachments.flatMap((attachment) => {
      const weights = new Map<number, number>();
      for (let i = 0; i < attachment.rows.length; i += 2)
        weights.set(attachment.rows[i], attachment.rows[i + 1]);
      const rows: number[] = [];
      stencils.forEach(({ a, b, t }, index) => {
        const weight =
          (1 - t) * (weights.get(a) ?? 0) + t * (weights.get(b) ?? 0);
        if (weight > 0) rows.push(index, weight);
      });
      return rows.length === 0 ? [] : [{ owner: attachment.owner, rows }];
    });
  return { surface, retainedTriangles, correspondence: stencils };
}
