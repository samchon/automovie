/** The index range one assembly member occupies in the merged mesh. */
export interface IAutoMovieMeshGroup {
  /** The contributing {@link IAutoMovieMeshPart.id}. */
  id: string;
  /** First index of the member's triangles inside the merged index array. */
  start: number;
  /** How many indices the member contributes; always a multiple of three. */
  count: number;
}
