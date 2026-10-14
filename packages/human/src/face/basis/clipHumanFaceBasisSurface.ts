import type { IAutoMovieHumanFaceBasisClip } from "../structures/IAutoMovieHumanFaceBasisClip";
import type { IAutoMovieHumanFaceBasisSurface as Surface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceClipStencil as Stencil } from "../structures/IAutoMovieHumanFaceClipStencil";
import type { IAutoMovieHumanFaceBasisRegion as IAutoMovieHumanFaceBasisRegionImported } from "../structures/IAutoMovieHumanFaceBasisRegion";
import type { IAutoMovieHumanFaceSurfaceAttachment as IAutoMovieHumanFaceSurfaceAttachmentImported } from "../structures/IAutoMovieHumanFaceSurfaceAttachment";


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
 * Finite edge spans use direct differences; only a difference that overflows
 * between finite endpoints uses half-scaled arithmetic. This preserves tiny
 * represented crossings without changing the neutral plane or frozen stencil.
 *
 * @evidence contracts/common.md#principled-implementation Neutral-Y polygon clipping assigns one canonical undirected-edge affine stencil, then evaluates geometry, sparse endpoints and attachment weights through that same frozen correspondence while retaining corner UV seams.
 * @evidence contracts/common.md#clear-and-simple-design One offline clipping owner returns owned surface data, wholly retained triangle maps and source preimages; callers own revision/dependent binding regeneration and ordinary builders reconstruct normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing hair/source partition or pose metadata refuses to prevent known stale correspondence; the cut remains open, missing attachment triangle mapping is not permission to discard it, and untouched dependent metadata still requires explicit caller rebinding.
 * @evidence contracts/common.md#meaningful-documentation Prose gives metre plane, admitted source premise, canonical edge equation, independent UVs, uncapped cut and the caller's full dependent-binding/revision obligations.
 * @evidence contracts/performance.md#efficient-algorithms T source triangles have bounded clipping polygons; expected-constant edge maps share O(T) stencils. Each endpoint/attachment builds a sparse lookup then scans those output stencils, so complete cost includes their population times retained output vertices.
 * @evidence contracts/performance.md#reuse-equivalent-work Every shared edge reuses one intersection and all geometry/delta/attachment evaluations reuse its frozen stencil; different neutral planes need fresh correspondence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned arrays/maps own the new surface correspondence while unchanged scalar/source metadata remains shared by spread; local lookup maps release on completion and refusals mutate no source or acquire external resources.
 */
export function clipHumanFaceBasisSurface(
  source: Surface,
  minimumY: number,
): IAutoMovieHumanFaceBasisClip {
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
  const vertices: Map<string, number> = new Map<string, number>();
  const resident: (a: number, b?: number, t?: number) => number = (a: number, b: number = a, t: number = 0): number => {
    const key: string = a + "/" + b;
    const previous: number | undefined = vertices.get(key);
    if (previous !== undefined) return previous;
    const index: number = stencils.length;
    stencils.push({ a, b, t });
    vertices.set(key, index);
    return index;
  };
  const height: (v: number) => number = (v: number): number => source.positions[3 * v + 1];
  const retainedTriangles: Map<string, Map<number, number>> = new Map<string, Map<number, number>>();
  const regions: { indices: number[]; uvs: number[] | null; id: string; material: string; }[] = source.regions.map((region: IAutoMovieHumanFaceBasisRegionImported): { indices: number[]; uvs: number[] | null; id: string; material: string; }  => {
    const indices: number[] = [];
    const uvs: number[] | null = region.uvs === null ? null : [];
    const retained: Map<number, number> = new Map<number, number>();
    retainedTriangles.set(region.id, retained);
    for (let offset: number = 0; offset < region.indices.length; offset += 3) {
      const ids: number[] = region.indices.slice(offset, offset + 3);
      const inside: boolean[] = ids.map((v: number): boolean  => height(v) >= minimumY);
      const polygon: { vertex: number; uv: number[] | null }[] = [];
      const uv: (corner: number) => number[] | null = (corner: number): number[] | null =>
        region.uvs === null
          ? null
          : region.uvs.slice((offset + corner) * 2, (offset + corner) * 2 + 2);
      for (let corner: number = 0; corner < 3; corner++) {
        const previous: number = (corner + 2) % 3;
        const a: number = ids[previous];
        const b: number = ids[corner];
        if (inside[previous] !== inside[corner]) {
          const low: number = Math.min(a, b);
          const high: number = Math.max(a, b);
          const span: number = height(high) - height(low);
          const t: number = Number.isFinite(span)
            ? (minimumY - height(low)) / span
            : (minimumY / 2 - height(low) / 2) /
              (height(high) / 2 - height(low) / 2);
          if (!Number.isFinite(t) || t < 0 || t > 1)
            throw new Error("Facial clipping exceeded finite edge arithmetic.");
          const vertex: number =
            t === 0
              ? resident(low)
              : t === 1
                ? resident(high)
                : resident(low, high, t);
          const first: number[] | null = uv(previous);
          const second: number[] | null = uv(corner);
          const fraction: number = a === low ? t : 1 - t;
          polygon.push({
            vertex,
            uv:
              first === null
                ? null
                : first.map(
                    (value: number, k: number): number  =>
                      (1 - fraction) * value + fraction * second![k],
                  ),
          });
        }
        if (inside[corner])
          polygon.push({ vertex: resident(b), uv: uv(corner) });
      }
      for (let corner: number = 1; corner + 1 < polygon.length; corner++) {
        const triangle: { vertex: number; uv: number[] | null; }[] = [polygon[0], polygon[corner], polygon[corner + 1]];
        if (new Set(triangle.map((v: { vertex: number; uv: number[] | null; }): number  => v.vertex)).size < 3) continue;
        // Record correspondence only for emitted faces; repeated-corner
        // triangles above contribute no retained mapping.
        if (inside.every(Boolean)) retained.set(offset / 3, indices.length / 3);
        indices.push(...triangle.map((v: { vertex: number; uv: number[] | null; }): number  => v.vertex));
        if (uvs !== null) uvs.push(...triangle.flatMap((v: { vertex: number; uv: number[] | null; }): number[]  => v.uv!));
      }
    }
    return { ...region, indices, uvs };
  });
  const positions: number[] = stencils.flatMap(({ a, b, t }: Stencil): number[]  =>
    [0, 1, 2].map((k: number): number  =>
      a !== b && k === 1
        ? minimumY
        : (1 - t) * source.positions[3 * a + k] +
          t * source.positions[3 * b + k],
    ),
  );
  const targets: { [k: string]: number[]; } = Object.fromEntries(
    Object.entries(source.targets).map(([name, rows]: [string, number[]]): [string, number[]]  => {
      const values: Map<number, number[]> = new Map<number, number[]>();
      for (let i: number = 0; i < rows.length; i += 4)
        values.set(rows[i], rows.slice(i + 1, i + 4));
      const output: number[] = [];
      for (const [vertex, { a, b, t }] of stencils.entries()) {
        const first: number[] | undefined = values.get(a);
        const second: number[] | undefined = values.get(b);
        const delta: number[] = [0, 1, 2].map(
          (k: number): number  => (1 - t) * (first?.[k] ?? 0) + t * (second?.[k] ?? 0),
        );
        if (delta.some((value: number): boolean  => value !== 0)) output.push(vertex, ...delta);
      }
      return [name, output];
    }),
  );
  const surface: Surface = {
    ...source,
    positions,
    indices: regions.flatMap((region: { indices: number[]; uvs: number[] | null; id: string; material: string; }): number[]  => region.indices),
    regions,
    targets,
  };
  // An attachment weight travels like a position: a retained vertex keeps its
  // row, a ring vertex takes the affine blend of its edge ends, and a row that
  // blends to nothing is omitted rather than published as a zero weight.
  if (source.attachments !== undefined)
    surface.attachments = source.attachments.flatMap((attachment: IAutoMovieHumanFaceSurfaceAttachmentImported): { owner: string; rows: number[]; }[]  => {
      const weights: Map<number, number> = new Map<number, number>();
      for (let i: number = 0; i < attachment.rows.length; i += 2)
        weights.set(attachment.rows[i], attachment.rows[i + 1]);
      const rows: number[] = [];
      stencils.forEach(({ a, b, t }: Stencil, index: number): void  => {
        const weight: number =
          (1 - t) * (weights.get(a) ?? 0) + t * (weights.get(b) ?? 0);
        if (weight > 0) rows.push(index, weight);
      });
      return rows.length === 0 ? [] : [{ owner: attachment.owner, rows }];
    });
  return { surface, retainedTriangles, correspondence: stencils };
}
