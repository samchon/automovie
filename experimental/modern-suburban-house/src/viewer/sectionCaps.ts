/** Inspection-only X=0 caps derived from the source triangle intersection. */

import { vertexKey } from "./vertexKey";
import type { IViewerSceneItem } from "./scenePayload";
import { sectionCap } from "./sectionCap";

/** Join only source patches sharing an open boundary edge before cutting them.
 * A material partition can be open while its physical shell is closed. Closed
 * parts remain independent, including separate solids touching at a face.
 * The cap lists all contributing face ids; it is not a new authored surface.
 */
export const sectionCaps = (
  items: readonly IViewerSceneItem[],
): IViewerSceneItem[] => {
  const parents = items.map((_, i) => i),
    owners = new Map<string, number[]>();
  const boundaries: Array<{
    index: number;
    member: string;
    a: string;
    b: string;
    count: number;
  }> = [];
  const endpoints = new Map<string, Map<string, number[]>>();
  const root = (i: number): number => {
    while (parents[i] !== i) i = parents[i]!;
    return i;
  };
  for (const [i, item] of items.entries()) {
    const boundary = new Map<string, number>();
    const member = item.assemblyMember ?? "",
      points = endpoints.get(member) ?? new Map<string, number[]>();
    endpoints.set(member, points);
    for (let j = 0; j < item.indices.length; j += 3)
      for (let k = 0; k < 3; k++) {
        const a = item.indices[j + k]!,
          b = item.indices[j + ((k + 1) % 3)]!;
        const pa = item.positions.slice(a * 3, a * 3 + 3),
          pb = item.positions.slice(b * 3, b * 3 + 3);
        const from = vertexKey(pa),
          to = vertexKey(pb);
        // Welding a periodic mesh seam can identify both endpoints. That
        // edge has no extent in the welded boundary and contributes no flux.
        if (from === to) continue;
        points.set(from, pa);
        points.set(to, pb);
        const edge = from < to ? `${from}/${to}` : `${to}/${from}`;
        boundary.set(edge, (boundary.get(edge) ?? 0) + (from < to ? 1 : -1));
      }
    for (const [edge, count] of boundary)
      if (count !== 0) {
        const [a, b] = edge.split("/") as [string, string];
        boundaries.push({ index: i, member, a, b, count });
      }
  }
  // Authored patches may have T-junctions: one panel edge can meet several
  // shorter frame edges. Compare their real shared subsegments, not just the
  // unsplit endpoint pairs. Already closed solids have no boundary to join.
  const splitBoundaries = items.map(() => new Map<string, number>());
  for (const { index, member, a, b, count } of boundaries) {
    const points = endpoints.get(member)!,
      pa = points.get(a)!,
      pb = points.get(b)!;
    const delta = pb.map((n, i) => n - pa[i]!),
      length2 = delta.reduce((s, n) => s + n * n, 0);
    const cuts = [
      { id: a, t: 0 },
      { id: b, t: 1 },
    ];
    for (const [id, p] of points) {
      const t =
        p.reduce((s, n, i) => s + (n - pa[i]!) * delta[i]!, 0) / length2;
      if (
        id !== a &&
        id !== b &&
        t > 0 &&
        t < 1 &&
        p.every((n, i) => Math.abs(n - pa[i]! - t * delta[i]!) <= 1e-9)
      )
        cuts.push({ id, t });
    }
    cuts.sort((p, q) => p.t - q.t);
    const split = splitBoundaries[index]!;
    for (let i = 0; i < cuts.length - 1; i++) {
      const from = cuts[i]!.id,
        to = cuts[i + 1]!.id,
        edge = from < to ? `${from}/${to}` : `${to}/${from}`;
      split.set(edge, (split.get(edge) ?? 0) + count * (from < to ? 1 : -1));
    }
  }
  for (const [i, boundary] of splitBoundaries.entries())
    for (const [edge, count] of boundary)
      if (count !== 0) {
        const memberEdge = `${items[i]!.assemblyMember ?? ""}|${edge}`;
        owners.set(memberEdge, [...(owners.get(memberEdge) ?? []), i]);
      }
  for (const group of owners.values())
    for (const i of group.slice(1)) parents[root(i)] = root(group[0]!);
  const groups = new Map<number, IViewerSceneItem[]>();
  for (const [i, item] of items.entries())
    groups.set(root(i), [...(groups.get(root(i)) ?? []), item]);
  const result: IViewerSceneItem[] = [];
  for (const group of groups.values()) {
    const merged = {
      ...group[0]!,
      positions: [] as number[],
      indices: [] as number[],
    };
    for (const item of group) {
      const offset = merged.positions.length / 3;
      merged.positions.push(...item.positions);
      merged.indices.push(...item.indices.map((n) => n + offset));
    }
    const cap = sectionCap(merged);
    if (cap !== undefined) {
      cap.sectionSourceFaces = [
        ...new Set(
          group.flatMap((i) => (i.faceId === undefined ? [] : [i.faceId])),
        ),
      ];
      result.push(cap);
    }
  }
  return result;
};
