import { IAutoMovieFilmEdit } from "./IAutoMovieFilmEdit";

/**
 * Compiler-owned envelope preserving the exact validated authored film edit.
 *
 * @evidence contracts/common.md#principled-implementation Groups the validated authored edit with builder protocol, aggregate input fingerprint and acquired normalized source identity; these records bind admitted compile inputs without attesting every transitive byte executed by the resident Node module.
 * @evidence contracts/common.md#clear-and-simple-design The envelope keeps compiler provenance outside the authored edit value, so timeline construction consumes its validated edit without rewriting the source-owned decision record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Currentness checks compare the stored compile identities rather than accepting stale fingerprints; the normalized source digest is acquired-input provenance, not proof of isolated execution or a complete resident-module cache closure.
 * @evidence contracts/common.md#meaningful-documentation Defines schema, builder identity, aggregate compile input, acquired normalized source address and the edit returned by ordinary Node execution.
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

  /** Schema-admitted authored edit returned by the resident source export. */
  edit: IAutoMovieFilmEdit;
}
