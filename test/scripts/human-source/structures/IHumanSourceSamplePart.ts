/**
 * One attached part of a sampling run: the binary file of its refitted
 * positions per subdivision level (states x vertices x 3, in `partStates`
 * order) and the vertex count at each level.
 *
 * @author Samchon
 */
export interface IHumanSourceSamplePart {
  id: string;
  files: Record<string, string>;
  vertices: Record<string, number>;
}
