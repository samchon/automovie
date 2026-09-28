/** Inspection-only X=0 caps derived from the source triangle intersection. */
import { ShapeUtils, Vector2 } from "three";

import type { IViewerSceneItem } from "./scenePayload";

type Point = readonly [number, number];
const key = (p: readonly number[]): string =>
  p.map((n) => String(Math.round(n * 1e9) / 1e9)).join(",");
const contains = (ring: readonly Point[], p: Point): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!,
      b = ring[j]!;
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
};
/** Preserve holes and source face identity; refuse a non-closed intersection. */
export const sectionCap = (
  item: IViewerSceneItem,
): IViewerSceneItem | undefined => {
  const xs = item.positions.filter((_, i) => i % 3 === 0);
  if (Math.min(...xs) >= -1e-10 || Math.max(...xs) <= 1e-10) return undefined;
  const points = new Map<string, Point>(),
    edges = new Map<string, [string, string]>(),
    edgeCounts = new Map<string, number>();
  const identity = (p: Point): string => {
    for (const [id, q] of points)
      if (Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1])) <= 1e-9)
        return id;
    const id = key(p);
    points.set(id, p);
    return id;
  };
  for (let i = 0; i < item.indices.length; i += 3) {
    const vertices = item.indices
      .slice(i, i + 3)
      .map((n) => item.positions.slice(n * 3, n * 3 + 3));
    if (vertices.every((p) => Math.abs(p[0]!) < 1e-10)) continue;
    const hit = new Map<string, Point>();
    for (let j = 0; j < 3; j++) {
      const a = vertices[j]!,
        b = vertices[(j + 1) % 3]!;
      const ax = Math.abs(a[0]!) < 1e-10 ? 0 : a[0]!,
        bx = Math.abs(b[0]!) < 1e-10 ? 0 : b[0]!;
      if (ax === 0) {
        const p: Point = [a[1]!, a[2]!];
        hit.set(identity(p), p);
      }
      if (ax * bx < 0) {
        const t = -ax / (bx - ax),
          p: Point = [a[1]! + (b[1]! - a[1]!) * t, a[2]! + (b[2]! - a[2]!) * t];
        hit.set(identity(p), p);
      }
    }
    if (hit.size !== 2) continue;
    const [a, b] = [...hit.keys()] as [string, string];
    const v0 = vertices[0]!,
      v1 = vertices[1]!,
      v2 = vertices[2]!;
    const ab = v1.map((v, j) => v - v0[j]!),
      ac = v2.map((v, j) => v - v0[j]!);
    const ny = ab[2]! * ac[0]! - ab[0]! * ac[2]!,
      nz = ab[0]! * ac[1]! - ab[1]! * ac[0]!;
    const pa = hit.get(a)!,
      pb = hit.get(b)!,
      forward = (pb[0] - pa[0]) * -nz + (pb[1] - pa[1]) * ny > 0;
    const edge = a < b ? `${a}/${b}` : `${b}/${a}`,
      sign = (a < b ? 1 : -1) * (forward ? 1 : -1);
    edgeCounts.set(edge, (edgeCounts.get(edge) ?? 0) + sign);
    edges.set(edge, [a, b]);
  }
  // Coincident material seams can subdivide one straight edge differently.
  // Split at every real collinear endpoint before opposite interfaces cancel.
  const splitCounts = new Map<string, number>(),
    splitEdges = new Map<string, [string, string]>();
  for (const [edge, [a, b]] of edges) {
    const count = edgeCounts.get(edge)!;
    if (count === 0) continue;
    const pa = points.get(a)!,
      pb = points.get(b)!,
      dy = pb[0] - pa[0],
      dz = pb[1] - pa[1],
      length2 = dy * dy + dz * dz;
    const cuts: Array<{ id: string; t: number }> = [
      { id: a, t: 0 },
      { id: b, t: 1 },
    ];
    for (const [id, p] of points) {
      const t = ((p[0] - pa[0]) * dy + (p[1] - pa[1]) * dz) / length2;
      if (
        id !== a &&
        id !== b &&
        t > 0 &&
        t < 1 &&
        Math.abs((p[0] - pa[0]) * dz - (p[1] - pa[1]) * dy) <=
          1e-9 * Math.sqrt(length2)
      )
        cuts.push({ id, t });
    }
    cuts.sort((p, q) => p.t - q.t);
    const direction = Math.sign(count) * (a < b ? 1 : -1);
    for (let i = 0; i < cuts.length - 1; i++) {
      const from = cuts[i]!.id,
        to = cuts[i + 1]!.id,
        k = from < to ? `${from}/${to}` : `${to}/${from}`;
      splitCounts.set(
        k,
        (splitCounts.get(k) ?? 0) + direction * (from < to ? 1 : -1),
      );
      splitEdges.set(k, [from, to]);
    }
  }
  edges.clear();
  edgeCounts.clear();
  for (const [edge, count] of splitCounts) {
    edgeCounts.set(edge, count);
    edges.set(edge, splitEdges.get(edge)!);
  }
  for (const [edge, count] of edgeCounts) if (count === 0) edges.delete(edge);
  const outgoing = new Map<string, string[]>(),
    incoming = new Map<string, number>();
  for (const [edge, [a, b]] of edges) {
    const [from, to] = edgeCounts.get(edge)! > 0 === a < b ? [a, b] : [b, a];
    outgoing.set(from, [...(outgoing.get(from) ?? []), to]);
    incoming.set(to, (incoming.get(to) ?? 0) + 1);
  }
  for (const p of new Set([...outgoing.keys(), ...incoming.keys()]))
    if ((outgoing.get(p)?.length ?? 0) !== (incoming.get(p) ?? 0))
      throw Error(
        `open section ${item.id}/${p}: directed boundary mismatch; outgoing=${JSON.stringify(outgoing.get(p) ?? [])} incoming=${JSON.stringify([...outgoing].flatMap(([from, to]) => (to.includes(p) ? [from] : [])))}`,
      );
  const visited = new Set<string>(),
    rings: Point[][] = [];
  for (const [start, targets] of outgoing)
    for (const target of targets) {
      if (visited.has(`${start}/${target}`)) continue;
      const ring: Point[] = [points.get(start)!];
      let previous = start,
        current = target;
      visited.add(`${previous}/${current}`);
      while (current !== start) {
        ring.push(points.get(current)!);
        const p = points.get(previous)!,
          q = points.get(current)!,
          dy = q[0] - p[0],
          dz = q[1] - p[1];
        const candidates = outgoing
          .get(current)!
          .filter((to) => !visited.has(`${current}/${to}`));
        if (candidates.length === 0)
          throw Error(`open section ${item.id}/${current}: exhausted boundary`);
        const turn = (to: string): number => {
          const r = points.get(to)!,
            ey = r[0] - q[0],
            ez = r[1] - q[1];
          return Math.atan2(dy * ez - dz * ey, dy * ey + dz * ez);
        };
        candidates.sort((a, b) => turn(b) - turn(a));
        const next = candidates[0]!;
        visited.add(`${current}/${next}`);
        previous = current;
        current = next;
      }
      rings.push(ring);
    }
  const depths = rings.map(
    (r, i) =>
      rings.filter((outer, j) => i !== j && contains(outer, r[0]!)).length,
  );
  const positions: number[] = [],
    normals: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (const [i, ring] of rings.entries()) {
    if (depths[i]! % 2 !== 0) continue;
    const holes = rings.filter(
      (r, j) => depths[j] === depths[i]! + 1 && contains(ring, r[0]!),
    );
    const points2 = [ring, ...holes].flat(),
      offset = positions.length / 3;
    for (const p of points2) {
      positions.push(0, ...p);
      normals.push(1, 0, 0);
      uvs.push(p[1], p[0]);
    }
    const triangles = ShapeUtils.triangulateShape(
      ring.map((p) => new Vector2(...p)),
      holes.map((h) => h.map((p) => new Vector2(...p))),
    );
    for (const triangle of triangles) {
      const [a, b, c] = triangle as [number, number, number],
        p = points2[a]!,
        q = points2[b]!,
        r = points2[c]!;
      const winding =
        (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      indices.push(
        ...(winding > 0 ? [a, b, c] : [a, c, b]).map((n) => n + offset),
      );
    }
  }
  if (indices.length === 0) return undefined;
  return {
    ...item,
    id: `${item.id}/inspection-section`,
    positions,
    normals,
    uvs,
    indices,
    inspectionSection: true,
  };
};

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
        const from = key(pa),
          to = key(pb);
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
