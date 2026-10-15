import { ShapeUtils, Vector2 } from "three";
import type { IViewerSceneItem } from "./IViewerSceneItem";
import { vertexKey } from "./vertexKey";
import { RingPoint } from "./RingPoint";
import { ringContains } from "./ringContains";

/** Preserve holes and source face identity; refuse a non-closed intersection. */
export const sectionCap = (
  item: IViewerSceneItem
): IViewerSceneItem | undefined => {
  const xs = item.positions.filter((_, i) => i % 3 === 0);
  if (Math.min(...xs) >= -1e-10 || Math.max(...xs) <= 1e-10) return undefined;
  const points = new Map<string, RingPoint>(), edges = new Map<string, [string, string]>(), edgeCounts = new Map<string, number>();
  const identity = (p: RingPoint): string => {
    for (const [id, q] of points)
      if (Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1])) <= 1e-9)
        return id;
    const id = vertexKey(p);
    points.set(id, p);
    return id;
  };
  for (let i = 0; i < item.indices.length; i += 3) {
    const vertices = item.indices
      .slice(i, i + 3)
      .map((n) => item.positions.slice(n * 3, n * 3 + 3));
    if (vertices.every((p) => Math.abs(p[0]!) < 1e-10)) continue;
    const hit = new Map<string, RingPoint>();
    for (let j = 0; j < 3; j++) {
      const a = vertices[j]!, b = vertices[(j + 1) % 3]!;
      const ax = Math.abs(a[0]!) < 1e-10 ? 0 : a[0]!, bx = Math.abs(b[0]!) < 1e-10 ? 0 : b[0]!;
      if (ax === 0) {
        const p: RingPoint = [a[1]!, a[2]!];
        hit.set(identity(p), p);
      }
      if (ax * bx < 0) {
        const t = -ax / (bx - ax), p: RingPoint = [a[1]! + (b[1]! - a[1]!) * t, a[2]! + (b[2]! - a[2]!) * t];
        hit.set(identity(p), p);
      }
    }
    if (hit.size !== 2) continue;
    const [a, b] = [...hit.keys()] as [string, string];
    const v0 = vertices[0]!, v1 = vertices[1]!, v2 = vertices[2]!;
    const ab = v1.map((v, j) => v - v0[j]!), ac = v2.map((v, j) => v - v0[j]!);
    const ny = ab[2]! * ac[0]! - ab[0]! * ac[2]!, nz = ab[0]! * ac[1]! - ab[1]! * ac[0]!;
    const pa = hit.get(a)!, pb = hit.get(b)!, forward = (pb[0] - pa[0]) * -nz + (pb[1] - pa[1]) * ny > 0;
    const edge = a < b ? `${a}/${b}` : `${b}/${a}`, sign = (a < b ? 1 : -1) * (forward ? 1 : -1);
    edgeCounts.set(edge, (edgeCounts.get(edge) ?? 0) + sign);
    edges.set(edge, [a, b]);
  }
  // Coincident material seams can subdivide one straight edge differently.
  // Split at every real collinear endpoint before opposite interfaces cancel.
  const splitCounts = new Map<string, number>(), splitEdges = new Map<string, [string, string]>();
  for (const [edge, [a, b]] of edges) {
    const count = edgeCounts.get(edge)!;
    if (count === 0) continue;
    const pa = points.get(a)!, pb = points.get(b)!, dy = pb[0] - pa[0], dz = pb[1] - pa[1], length2 = dy * dy + dz * dz;
    const cuts: Array<{ id: string; t: number; }> = [
      { id: a, t: 0 },
      { id: b, t: 1 },
    ];
    for (const [id, p] of points) {
      const t = ((p[0] - pa[0]) * dy + (p[1] - pa[1]) * dz) / length2;
      if (id !== a &&
        id !== b &&
        t > 0 &&
        t < 1 &&
        Math.abs((p[0] - pa[0]) * dz - (p[1] - pa[1]) * dy) <=
        1e-9 * Math.sqrt(length2))
        cuts.push({ id, t });
    }
    cuts.sort((p, q) => p.t - q.t);
    const direction = Math.sign(count) * (a < b ? 1 : -1);
    for (let i = 0; i < cuts.length - 1; i++) {
      const from = cuts[i]!.id, to = cuts[i + 1]!.id, k = from < to ? `${from}/${to}` : `${to}/${from}`;
      splitCounts.set(
        k,
        (splitCounts.get(k) ?? 0) + direction * (from < to ? 1 : -1)
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
  const outgoing = new Map<string, string[]>(), incoming = new Map<string, number>();
  for (const [edge, [a, b]] of edges) {
    const [from, to] = edgeCounts.get(edge)! > 0 === a < b ? [a, b] : [b, a];
    outgoing.set(from, [...(outgoing.get(from) ?? []), to]);
    incoming.set(to, (incoming.get(to) ?? 0) + 1);
  }
  for (const p of new Set([...outgoing.keys(), ...incoming.keys()]))
    if ((outgoing.get(p)?.length ?? 0) !== (incoming.get(p) ?? 0))
      throw new Error(
        `open section ${item.id}/${p}: directed boundary mismatch; outgoing=${JSON.stringify(outgoing.get(p) ?? [])} incoming=${JSON.stringify([...outgoing].flatMap(([from, to]) => (to.includes(p) ? [from] : [])))}`
      );
  const visited = new Set<string>(), rings: RingPoint[][] = [];
  for (const [start, targets] of outgoing)
    for (const target of targets) {
      if (visited.has(`${start}/${target}`)) continue;
      const ring: RingPoint[] = [points.get(start)!];
      let previous = start, current = target;
      visited.add(`${previous}/${current}`);
      while (current !== start) {
        ring.push(points.get(current)!);
        const p = points.get(previous)!, q = points.get(current)!, dy = q[0] - p[0], dz = q[1] - p[1];
        const candidates = outgoing
          .get(current)!
          .filter((to) => !visited.has(`${current}/${to}`));
        if (candidates.length === 0)
          throw new Error(`open section ${item.id}/${current}: exhausted boundary`);
        const turn = (to: string): number => {
          const r = points.get(to)!, ey = r[0] - q[0], ez = r[1] - q[1];
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
    (r, i) => rings.filter((outer, j) => i !== j && ringContains(outer, r[0]!)).length
  );
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (const [i, ring] of rings.entries()) {
    if (depths[i]! % 2 !== 0) continue;
    const holes = rings.filter(
      (r, j) => depths[j] === depths[i]! + 1 && ringContains(ring, r[0]!)
    );
    const points2 = [ring, ...holes].flat(), offset = positions.length / 3;
    for (const p of points2) {
      positions.push(0, ...p);
      normals.push(1, 0, 0);
      uvs.push(p[1], p[0]);
    }
    const triangles = ShapeUtils.triangulateShape(
      ring.map((p) => new Vector2(...p)),
      holes.map((h) => h.map((p) => new Vector2(...p)))
    );
    for (const triangle of triangles) {
      const [a, b, c] = triangle as [number, number, number], p = points2[a]!, q = points2[b]!, r = points2[c]!;
      const winding = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      indices.push(
        ...(winding > 0 ? [a, b, c] : [a, c, b]).map((n) => n + offset)
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
