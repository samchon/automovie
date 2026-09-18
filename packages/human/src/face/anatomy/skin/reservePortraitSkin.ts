import { portraitFacesInsideLoop } from "../../mesh/portraitFacesInsideLoop";
import { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import { autoMoviePlanarRegionFailure } from "@automovie/engine";

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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Reserves connected host skin large enough for a component's proposed seam without a guessed influence radius.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Grows finite vertex-adjacent face rings until one simple boundary strictly contains the new XY seam, preserving original host data.
 */
export function reservePortraitSkin(
  host: IPortraitComponentHost,
  inner: readonly number[],
  targets: readonly (readonly number[])[],
): { faces: number[]; boundary: number[] } {
  if (
    targets.length !== inner.length ||
    targets.some((point) => point.length !== 3 || !point.every(Number.isFinite))
  )
    throw new Error(
      "Reserved skin needs one finite XYZ target per seam vertex.",
    );
  let selected = new Set(portraitFacesInsideLoop(host, [...inner]));
  const point = (p: readonly number[]) => ({ x: p[0] / 1000, y: p[1] / 1000 });
  for (;;) {
    const edges = new Map<string, { a: number; b: number; count: number }>();
    const vertices = new Set<number>();
    for (const face of selected) {
      const ids = host.indices.slice(3 * face, 3 * face + 3);
      for (let j = 0; j < 3; j++) {
        const a = ids[j],
          b = ids[(j + 1) % 3];
        const key = a < b ? `${a}/${b}` : `${b}/${a}`;
        vertices.add(a);
        const edge = edges.get(key);
        if (edge === undefined) edges.set(key, { a, b, count: 1 });
        else edge.count++;
      }
    }
    const perimeter = [...edges.values()].filter((edge) => edge.count === 1);
    const next = new Map(perimeter.map((edge) => [edge.a, edge.b]));
    const loop: number[] = [];
    if (perimeter.length !== 0 && next.size === perimeter.length) {
      let vertex = perimeter[0].a;
      while (!loop.includes(vertex)) {
        loop.push(vertex);
        // Engine selection has already admitted consistently oriented manifold
        // edges. Their directed boundary has balanced in/out degree; with one
        // outgoing edge per vertex, it is a disjoint union of closed cycles.
        vertex = next.get(vertex)!;
      }
      if (
        loop.length === perimeter.length &&
        inner.every((id) => !loop.includes(id)) &&
        autoMoviePlanarRegionFailure({
          outer: loop.map((id) => point(host.positions[id])),
          holes: [targets.map(point)],
        }) === null
      )
        return { faces: [...selected], boundary: loop };
    }
    const expanded = new Set(selected);
    for (let face = 0; face < host.indices.length / 3; face++)
      if (
        host.indices
          .slice(3 * face, 3 * face + 3)
          .some((id) => vertices.has(id))
      )
        expanded.add(face);
    if (expanded.size === selected.size)
      throw new Error(
        "Host skin cannot reserve a simple containing component boundary.",
      );
    selected = expanded;
  }
}
