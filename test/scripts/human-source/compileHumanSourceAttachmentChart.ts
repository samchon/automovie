import type { IAutoMovieHumanFaceAttachmentChart } from "@automovie/human/face/structures/IAutoMovieHumanFaceAttachmentChart";
import type { IAutoMovieHumanFacePeriocularStation } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularStation";

import { compileHumanSourceAttachmentTriangles } from "./compileHumanSourceAttachmentTriangles.ts";

/**
 * Extract one lid's material disk from actual oriented host incidence.
 * The source's posterior/outer station paths and their canthal radial paths
 * own the boundary. Missing intermediate native edges are traced by shortest
 * edge-count paths without crossing another registered anchor or prior path.
 * Flooding across uncut edges selects the component containing the registered
 * interior stations; all stations must survive in that one disk. No positions,
 * texture UVs or closest-point projection determine source correspondence.
 */
export function compileHumanSourceAttachmentChart(
  generation: string,
  surface: string,
  hostIndices: readonly number[],
  sourceSamples: readonly number[],
  stations: readonly IAutoMovieHumanFacePeriocularStation[],
  columns: readonly number[],
): IAutoMovieHumanFaceAttachmentChart {
  const first = stations.find((station) => station.role === "posteriorMargin");
  const last = stations.find((station) => station.role === "outerAttachment");
  if (
    first === undefined ||
    last === undefined ||
    stations.length < 3 ||
    columns.length < 3
  )
    throw new Error(
      "Attachment chart needs posterior and outer source station boundaries.",
    );
  const adjacency = Array.from(
    { length: sourceSamples.length },
    () => new Set<number>(),
  );
  const edgeFaces = new Map<string, number[]>();
  const incident = Array.from(
    { length: sourceSamples.length },
    () => new Set<number>(),
  );
  const key = (a: number, b: number): string =>
    a < b ? `${a}:${b}` : `${b}:${a}`;
  for (let at = 0; at < hostIndices.length; at += 3) {
    for (let corner = 0; corner < 3; corner++) {
      const a = hostIndices[at + corner],
        b = hostIndices[at + ((corner + 1) % 3)];
      if (adjacency[a] === undefined || adjacency[b] === undefined)
        throw new Error("Attachment host index is outside its source map.");
      adjacency[a].add(b);
      adjacency[b].add(a);
      incident[a].add(at / 3);
      const id = key(a, b),
        faces = edgeFaces.get(id) ?? [];
      faces.push(at / 3);
      edgeFaces.set(id, faces);
    }
  }
  const anchors = [
    ...columns.map((column) => first.vertices[column]),
    ...stations.slice(1).map((station) => station.vertices[columns.at(-1)!]),
    ...columns
      .slice(0, -1)
      .reverse()
      .map((column) => last.vertices[column]),
    ...stations
      .slice(1, -1)
      .reverse()
      .map((station) => station.vertices[columns[0]]),
  ];
  if (new Set(anchors).size !== anchors.length)
    throw new Error("Attachment source boundary repeats a physical vertex.");
  const registered = new Set(anchors),
    boundary = [anchors[0]];
  const occupied = new Set<number>(boundary),
    cuts = new Set<string>();
  for (let segment = 0; segment < anchors.length; segment++) {
    const start = anchors[segment],
      end = anchors[(segment + 1) % anchors.length];
    const queue = [start],
      parent = new Map<number, number>([[start, start]]);
    for (let at = 0; at < queue.length && !parent.has(end); at++) {
      for (const neighbor of adjacency[queue[at]]) {
        if (
          parent.has(neighbor) ||
          (neighbor !== end &&
            (registered.has(neighbor) || occupied.has(neighbor)))
        )
          continue;
        parent.set(neighbor, queue[at]);
        queue.push(neighbor);
      }
    }
    if (!parent.has(end))
      throw new Error("Attachment boundary has no uncrossed actual edge path.");
    const path = [end];
    while (path.at(-1) !== start) path.push(parent.get(path.at(-1)!)!);
    path.reverse();
    for (let at = 1; at < path.length; at++) {
      cuts.add(key(path[at - 1], path[at]));
      if (path[at] !== boundary[0]) {
        boundary.push(path[at]);
        occupied.add(path[at]);
      }
    }
  }
  const required = stations.flatMap((station) =>
    columns.map((column) => station.vertices[column]),
  );
  const witness = required.find((vertex) => !occupied.has(vertex));
  if (witness === undefined)
    throw new Error("Attachment patch has no registered interior witness.");
  const seeds = [...incident[witness]];
  if (seeds.length === 0)
    throw new Error("Attachment interior station has no host triangle.");
  const faces = new Set<number>([seeds[0]]),
    queue = [seeds[0]];
  for (let at = 0; at < queue.length; at++) {
    const triangle = hostIndices.slice(3 * queue[at], 3 * queue[at] + 3);
    for (let corner = 0; corner < 3; corner++) {
      const id = key(triangle[corner], triangle[(corner + 1) % 3]);
      if (cuts.has(id)) continue;
      for (const neighbor of edgeFaces.get(id)!)
        if (!faces.has(neighbor)) {
          faces.add(neighbor);
          queue.push(neighbor);
        }
    }
  }
  if (seeds.some((face) => !faces.has(face)))
    throw new Error("Attachment boundary cuts through an interior station.");
  const chart = compileHumanSourceAttachmentTriangles(
    generation,
    surface,
    hostIndices,
    sourceSamples,
    [...faces],
  );
  if (required.some((vertex) => !chart.vertices.includes(vertex)))
    throw new Error("Attachment disk omits a registered station.");
  return chart;
}
