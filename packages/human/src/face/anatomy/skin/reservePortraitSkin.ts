import { autoMoviePlanarRegionFailure } from "@automovie/engine";

import { selectHostFacesInsideLoop } from "../../mesh/selectHostFacesInsideLoop";
import { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";

/**
 * Reserve enough connected host skin to contain a component's proposed outer
 * seam. Original and proposed loops use corresponding resident identities;
 * coordinates are construction millimetres, +Y up and +Z anterior. The engine
 * admits the XY region in metres. Depth remains the original 3D coordinate.
 *
 * Grow through complete vertex-adjacent face rings, not a guessed metric radius
 * or a subject-specific landmark list. The first simple containing boundary
 * wins. Growth is finite: each unsuccessful step adds a face or refuses. A
 * closed or multiply bounded intermediate region is not a usable annulus.
 *
 * The host is never mutated. The caller removes the returned faces, relocates
 * only the now-internal seam, and appends the shared bridge. Other components'
 * reservations remain the assembler's responsibility; overlapping cuts refuse
 * there before attachment. This supplies an unambiguous planar chart, not an
 * anatomical section, tangent match, or arbitrary 3D intersection certificate.
 *
 * @evidence contracts/common.md#principled-implementation Begin with admitted faces inside the native seam and grow complete vertex-adjacent rings until one directed simple boundary strictly contains the proposed XY hole; each failed growth adds a face or explicitly refuses.
 * @evidence contracts/common.md#clear-and-simple-design Reservation owns selected faces and containing boundary only; the component relocates its now-internal seam and appends the shared bridge, while the assembler rejects overlapping component cuts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No guessed radius, subject landmark list or nearest replacement chooses the patch; metre planar admission preserves millimetre XYZ and proves no tangent, anatomy or arbitrary 3D intersection result.
 * @evidence contracts/common.md#meaningful-documentation The prose states shared identities, coordinate conversion, finite growth, single-boundary requirement, read-only host and later ownership of conflicts/attachment.
 * @evidence contracts/performance.md#efficient-algorithms Each growth pass rebuilds selected-edge incidence and scans T host faces for adjacent expansion; at most T unsuccessful face-adding passes give a potentially quadratic scan, plus boundary includes/planar admission. This complete-ring strategy has no claimed heap or linear-time bound.
 * @evidence contracts/performance.md#reuse-equivalent-work Each pass reuses its selected vertex/edge sets to grow the next ring; changed selection requires new perimeter incidence, and different target loops cannot reuse an earlier containment verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Selected/expanded sets are bounded by host T faces and perimeter/vertex records by their native incidence; returned ids are caller-owned, and failure releases local state without cage mutation or external tasks.
 */
export function reservePortraitSkin(
  host: IPortraitComponentHost,
  inner: readonly number[],
  targets: readonly (readonly number[])[],
): { faces: number[]; boundary: number[] } {
  if (
    targets.length !== inner.length ||
    targets.some((point: readonly number[]): boolean  => point.length !== 3 || !point.every(Number.isFinite))
  )
    throw new Error(
      "Reserved skin needs one finite XYZ target per seam vertex.",
    );
  let selected: Set<number> = new Set(selectHostFacesInsideLoop(host, [...inner]));
  const point: (p: readonly number[]) => { x: number; y: number; } = (p: readonly number[]): { x: number; y: number; }  => ({ x: p[0] / 1000, y: p[1] / 1000 });
  for (;;) {
    const edges: Map<string, { a: number; b: number; count: number; }> = new Map<string, { a: number; b: number; count: number }>();
    const vertices: Set<number> = new Set<number>();
    for (const face of selected) {
      const ids: number[] = host.indices.slice(3 * face, 3 * face + 3);
      for (let j: number = 0; j < 3; j++) {
        const a: number = ids[j],
          b: number = ids[(j + 1) % 3];
        const key: string = a < b ? `${a}/${b}` : `${b}/${a}`;
        vertices.add(a);
        const edge: { a: number; b: number; count: number; } | undefined = edges.get(key);
        if (edge === undefined) edges.set(key, { a, b, count: 1 });
        else edge.count++;
      }
    }
    const perimeter: { a: number; b: number; count: number; }[] = [...edges.values()].filter((edge: { a: number; b: number; count: number; }): boolean  => edge.count === 1);
    const next: Map<number, number> = new Map(perimeter.map((edge: { a: number; b: number; count: number; }): [number, number]  => [edge.a, edge.b]));
    const loop: number[] = [];
    if (perimeter.length !== 0 && next.size === perimeter.length) {
      let vertex: number = perimeter[0].a;
      while (!loop.includes(vertex)) {
        loop.push(vertex);
        // Engine selection has already admitted consistently oriented manifold
        // edges. Their directed boundary has balanced in/out degree; with one
        // outgoing edge per vertex, it is a disjoint union of closed cycles.
        vertex = next.get(vertex)!;
      }
      if (
        loop.length === perimeter.length &&
        inner.every((id: number): boolean  => !loop.includes(id)) &&
        autoMoviePlanarRegionFailure({
          outer: loop.map((id: number): { x: number; y: number; }  => point(host.positions[id])),
          holes: [targets.map(point)],
        }) === null
      )
        return { faces: [...selected], boundary: loop };
    }
    const expanded: Set<number> = new Set(selected);
    for (let face: number = 0; face < host.indices.length / 3; face++)
      if (
        host.indices
          .slice(3 * face, 3 * face + 3)
          .some((id: number): boolean  => vertices.has(id))
      )
        expanded.add(face);
    if (expanded.size === selected.size)
      throw new Error(
        "Host skin cannot reserve a simple containing component boundary.",
      );
    selected = expanded;
  }
}
