import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** One exact legacy path considered by a production import plan. */
export interface IAutoMovieLegacyImportInventoryEntry {
  /** Legacy-root-relative canonical POSIX path. */
  path: string;

  /** Exact bytes, or zero when a registered asset is absent. */
  bytes: number;

  /** Exact content digest, or null when a registered asset is absent. */
  digest: AutoMovieContentDigest | null;

  /** Why this file belongs to the import boundary. */
  kind: "project" | "asset";
}
