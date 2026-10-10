import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * A posed material-region mesh gathered through one frozen person source cut,
 * with its render vertices' source correspondence. Attribute charts may split
 * one source into several residents, so the source list parallels positions
 * rather than the triangle corners. Both arrays belong to the result.
 *
 * @author Samchon
 */
export interface IHumanPersonClippedMesh {
  /** Owned static indexed mesh in the input's posed metre frame. */
  mesh: IAutoMovieMesh;

  /** Frozen cut source identity for each resident mesh vertex. */
  sources: number[];
}
