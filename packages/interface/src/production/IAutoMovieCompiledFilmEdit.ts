import { IAutoMovieFilmEdit } from "./IAutoMovieFilmEdit";

/**
 * Compiler-owned envelope preserving the exact validated authored film edit.
 *
 * @evidence contracts/common.md#principled-implementation The authored edit is sealed with builder protocol, aggregate input fingerprint and normalized source identity, tying persisted edit content to the exact deterministic source generation admitted by compilation.
 * @evidence contracts/common.md#clear-and-simple-design The envelope keeps compiler provenance outside the authored edit value, so timeline construction consumes its validated edit without rewriting the source-owned decision record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A persisted edit cannot borrow a current builder fingerprint while retaining stale source identity; source path, named export and digest identify the real producing declaration.
 * @evidence contracts/common.md#meaningful-documentation Defines schema, builder identity, aggregate compile input, normalized TypeScript source address and the preserved sandbox-produced edit.
 * @author Samchon
 */
export interface IAutoMovieCompiledFilmEdit {
  /** Generated edit format. */
  version: 1;

  /** Compiler protocol that validated the edit. */
  builder: string;

  /** Exact aggregate compile input. */
  inputFingerprint: string;

  /** Film source provenance. */
  source: {
    /** Project-relative module path. */
    path: string;

    /** Named build export. */
    export: string;

    /** Digest of normalized TypeScript source. */
    digest: string;
  };

  /** Strict authored edit returned by the deterministic sandbox. */
  edit: IAutoMovieFilmEdit;
}
