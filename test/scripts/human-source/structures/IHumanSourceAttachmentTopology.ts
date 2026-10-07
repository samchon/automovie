/** Actual host incidence reused by material-domain preparation. */
export interface IHumanSourceAttachmentTopology {
  edges: Map<string, number[]>;
  vertexFaces: Set<number>[];
  vertexNeighbors: Set<number>[];
  faceNeighbors: Set<number>[];
}
