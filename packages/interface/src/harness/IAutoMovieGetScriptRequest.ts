/**
 * Query tool: pull the full script (logline, theme, cast, beats).
 *
 * @author Samchon
 */
export interface IAutoMovieGetScriptRequest {
  /** Selects the knowledge query that reads the project script contract. */
  type: "getScript";
}
