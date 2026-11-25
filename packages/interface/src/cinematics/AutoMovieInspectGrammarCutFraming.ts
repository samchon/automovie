import type { IAutoMovieCameraIntent } from "./IAutoMovieCameraIntent";

/** A shot's size at one boundary, or null when it cannot be measured. */
export type AutoMovieInspectGrammarCutFraming =
  | IAutoMovieCameraIntent["framing"]
  | null;
