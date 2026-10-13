import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieFilmEdit } from "./IAutoMovieFilmEdit";

/** Compiler-owned envelope preserving the exact validated authored edit. */
export interface IAutoMovieCompiledFilmEdit {
  /** Generated edit format. */
  version: 1;

  /** Compiler protocol that validated the edit. */
  builder: string;

  /** Exact aggregate compile input. */
  inputFingerprint: AutoMovieContentDigest;

  /** Film source provenance. */
  source: {
    /** Project-relative module path. */
    path: string;

    /** Named build export. */
    export: string;

    /** Digest of normalized TypeScript source. */
    digest: AutoMovieContentDigest;
  };

  /** Strict authored edit returned by the deterministic sandbox. */
  edit: IAutoMovieFilmEdit;
}
