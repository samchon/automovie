import type { IHumanSourceAttachmentTopology } from "./structures/IHumanSourceAttachmentTopology.ts";

/** Read original oriented triangle incidence without geometry or UV inference. */
export function readHumanSourceAttachmentTopology(
  indices: readonly number[],
  count: number,
): IHumanSourceAttachmentTopology {
  const edges = new Map<string, number[]>();
  const vertexFaces = Array.from({ length: count }, () => new Set<number>());
  const vertexNeighbors = Array.from(
    { length: count },
    () => new Set<number>(),
  );
  const faceNeighbors = Array.from(
    { length: indices.length / 3 },
    () => new Set<number>(),
  );
  for (let triangle = 0; triangle < indices.length / 3; triangle++)
    for (let corner = 0; corner < 3; corner++) {
      const a = indices[3 * triangle + corner],
        b = indices[3 * triangle + ((corner + 1) % 3)];
      const key = a < b ? `${a}:${b}` : `${b}:${a}`,
        faces = edges.get(key) ?? [];
      if (vertexFaces[a] === undefined || vertexFaces[b] === undefined)
        throw new Error("Attachment topology has a nonresident corner.");
      faces.push(triangle);
      edges.set(key, faces);
      vertexFaces[a].add(triangle);
      vertexNeighbors[a].add(b);
      vertexNeighbors[b].add(a);
    }
  for (const faces of edges.values()) {
    if (faces.length > 2)
      throw new Error("Attachment host has a nonmanifold edge.");
    if (faces.length === 2) {
      faceNeighbors[faces[0]].add(faces[1]);
      faceNeighbors[faces[1]].add(faces[0]);
    }
  }
  return { edges, vertexFaces, vertexNeighbors, faceNeighbors };
}
