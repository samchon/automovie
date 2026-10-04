/**
 * The head/body partition of the one skin. The neck boundary is registered on
 * source triangles at compile time: `boundaryVertices` are the skin ids of the
 * cut samples, `plane` the recorded recrop convention that froze them. It is
 * a region view for colour, sag and editing scope, not a runtime clip.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationPartition {
  labels: string[];
  plane: string;
  boundaryVertices: number[];
  headTriangles: number;
  bodyTriangles: number;
}
