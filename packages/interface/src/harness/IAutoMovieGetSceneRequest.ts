/**
 * Query tool: pull the staged scene (placements, cameras, lights, couplings).
 *
 * @author Samchon
 */
export interface IAutoMovieGetSceneRequest {
  /** Selects the knowledge query that reads the staged scene contract. */
  type: "getScene";
}
