/**
 * The scene payload, the screenplay slug plus optional description: where and
 * when the scene lives. The slug is the human-and-diffusion shared address of
 * the location.
 */
export interface IAutoMovieScenePayload {
  /** Interior or exterior. */
  interiorExterior: "INT" | "EXT";

  /** Location name ("hotel lobby"). */
  location: string;

  /** Time of day ("dawn", "night"). */
  timeOfDay: string;

  /** Optional scene-setting prose, or `null`. */
  description: string | null;
}
