import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** One builder-owned generated file. */
export interface IAutoMovieGeneratedFile {
  /** Project-relative generated path. */
  path: string;

  /** Ownership marker. */
  owner: "builder";

  /** File-byte digest. */
  digest: AutoMovieContentDigest;

  /** Design or source targets that produced the file. */
  sourceTargets: string[];
}
