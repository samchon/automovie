import { IAutoMovieGeneratedFile } from "./IAutoMovieGeneratedFile";

/** One materialized builder file and its write status. */
export interface IAutoMovieMaterializedFile extends IAutoMovieGeneratedFile {
  /** Whether bytes were first created, updated, or already current. */
  status: "created" | "updated" | "unchanged";
}
