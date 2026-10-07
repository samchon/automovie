import { Vector3 } from "@automovie/engine";
import type { IHumanFaceOcularSurface } from "@automovie/human/face/anatomy/eye/structures/IHumanFaceOcularSurface";
import type { IAutoMovieHumanFaceAttachmentContinuation } from "@automovie/human/face/structures/IAutoMovieHumanFaceAttachmentContinuation";

import type { IHumanSourceMeridianNode } from "./structures/IHumanSourceMeridianNode.ts";

/**
 * Continue one coarse source section on the existing triangle surface.
 * The plane passes through its outer station and contains the actual ocular
 * axis direction. Triangle-plane intersections produce a material polyline;
 * shortest physical polyline length selects a continuation to the first
 * endpoint reaching the unchanged ocular arc target. The original cage
 * annulus is excluded, so the continuation leaves its outer boundary rather
 * than turning back through another station. No global monotonicity of the
 * original station rows, surrogate sphere or changed extent is assumed.
 */
export function traceHumanSourceOcularContinuation(
  column: number,
  start: number,
  target: number,
  indices: readonly number[],
  positions: readonly number[],
  excludedTriangles: ReadonlySet<number>,
  exterior: IHumanFaceOcularSurface,
): IAutoMovieHumanFaceAttachmentContinuation {
  const read = (vertex: number): number[] =>
    positions.slice(3 * vertex, 3 * vertex + 3);
  const origin = read(start),
    radial = Vector3.subtract(Vector3.create(...origin), exterior.center);
  const cross = Vector3.cross(exterior.axis, radial),
    length = Vector3.length(cross);
  if (!(length > 0))
    throw new Error(
      "Source continuation has no meridian plane at its outer station.",
    );
  const normal = [cross.x / length, cross.y / length, cross.z / length];
  const distance = (point: readonly number[]): number =>
    normal.reduce((sum, n, axis) => sum + n * (point[axis] - origin[axis]), 0);
  const nodes = new Map<string, IHumanSourceMeridianNode>();
  const ambiguous = new Set<string>();
  for (let triangle = 0; triangle < indices.length / 3; triangle++) {
    if (excludedTriangles.has(triangle)) continue;
    const corners = indices.slice(3 * triangle, 3 * triangle + 3),
      points = corners.map(read),
      values = points.map(distance);
    if (values.every((value) => value === 0)) {
      corners.forEach((vertex) => ambiguous.add(`v:${vertex}`));
      continue;
    }
    const hits = new Map<string, number[]>();
    for (let corner = 0; corner < 3; corner++) {
      const next = (corner + 1) % 3,
        a = corners[corner],
        b = corners[next],
        da = values[corner],
        db = values[next];
      if (da === 0) {
        const weights = [0, 0, 0];
        weights[corner] = 1;
        hits.set(`v:${a}`, weights);
      }
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        // Evaluate one canonical edge direction so its two incident triangles
        // share exactly the same material cut, without tolerance welding.
        const low = a < b ? corner : next,
          high = a < b ? next : corner;
        const t = values[low] / (values[low] - values[high]),
          weights = [0, 0, 0];
        weights[low] = 1 - t;
        weights[high] = t;
        hits.set(a < b ? `e:${a}:${b}` : `e:${b}:${a}`, weights);
      }
    }
    if (hits.size !== 2) continue;
    const entries = [...hits];
    for (const [id, weights] of entries)
      if (!nodes.has(id)) {
        const point = [0, 1, 2].map((axis) =>
          weights.reduce(
            (sum, weight, corner) => sum + weight * points[corner][axis],
            0,
          ),
        );
        nodes.set(id, {
          point,
          seat: { triangle, weights },
          neighbors: new Map(),
        });
      }
    const [a, b] = entries.map(([id]) => id),
      pa = nodes.get(a)!.point,
      pb = nodes.get(b)!.point;
    const segment = Math.hypot(...pa.map((value, axis) => value - pb[axis]));
    if (!(segment > 0) || !Number.isFinite(segment))
      throw new Error("Source continuation has a collapsed cut segment.");
    nodes.get(a)!.neighbors.set(b, segment);
    nodes.get(b)!.neighbors.set(a, segment);
  }
  const initial = `v:${start}`;
  if (!nodes.has(initial))
    throw new Error(
      "Coarse outer station has no outward source meridian continuation.",
    );
  const arc = (node: IHumanSourceMeridianNode): number =>
    exterior.meridianArc(exterior.project(Vector3.create(...node.point)).point);
  const costs = new Map<string, number>([[initial, 0]]),
    previous = new Map<string, string>(),
    settled = new Set<string>();
  let end: string | undefined;
  while (settled.size < nodes.size) {
    let nearest: string | undefined,
      best = Infinity;
    for (const [id, value] of costs)
      if (!settled.has(id) && value < best) {
        nearest = id;
        best = value;
      }
    if (nearest === undefined) break;
    settled.add(nearest);
    if (ambiguous.has(nearest))
      throw new Error(
        "Source meridian continuation reaches a coplanar triangle; its one-dimensional path is ambiguous.",
      );
    const node = nodes.get(nearest)!;
    if (arc(node) >= target) {
      end = nearest;
      break;
    }
    for (const [neighbor, distance] of node.neighbors) {
      const candidate = best + distance;
      if (candidate < (costs.get(neighbor) ?? Infinity)) {
        costs.set(neighbor, candidate);
        previous.set(neighbor, nearest);
      }
    }
  }
  if (end === undefined)
    throw new Error(
      `Source meridian continuation cannot bracket unchanged tarsal extent at column ${column}.`,
    );
  const path = [end];
  while (path.at(-1) !== initial) path.push(previous.get(path.at(-1)!)!);
  path.reverse();
  return {
    column,
    points: path.map((id) => nodes.get(id)!.seat),
    referenceArcsMetres: path.map((id) => arc(nodes.get(id)!)),
    referenceTargetMetres: target,
  };
}
