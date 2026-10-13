/** One passage a staged volume intrudes on. */
export interface IAutoMoviePassageBlockage {
  /** Which passage family the blocked id belongs to. */
  kind: "opening" | "connector";
  /** Stable opening or connector id inside the environment. */
  id: string;
}
