import { IAutoMovieGeneratedFile } from "./IAutoMovieGeneratedFile";

/**
 * Manifest recording builder identity, compile input and exact generated output ownership.
 *
 * @evidence contracts/common.md#principled-implementation The builder records its package and protocol versions, aggregate compile fingerprint and path-sorted byte-digested files; production ownership checks compare canonical manifest content and file bytes before trusting this record.
 * @evidence contracts/common.md#clear-and-simple-design One versioned manifest ties all generated members to a single compile rather than giving every file an independent builder or input ledger.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shape alone does not establish current input/member/byte agreement. Inspection compares the current expected result and reports mismatches; writable repair may refresh expected-path files or absent/stale manifests, while unexpected non-owned files and unsafe paths block. These sequential observations require the transaction's later currentness and output checks rather than establishing an atomic snapshot.
 * @evidence contracts/common.md#meaningful-documentation Defines format and compiler identities, aggregate input fingerprint and builder-owned file entries; the record supplies claims verified by production gates.
 * @author Samchon
 */
export interface IAutoMovieGeneratedManifest {
  /** Generated-manifest format. */
  version: 1;

  /** Compiler identity. */
  builder: {
    /** Package version. */
    packageVersion: string;

    /** Content protocol version. */
    protocolVersion: string;
  };

  /** Ordered design and source input fingerprint. */
  inputFingerprint: string;

  /** Compiler-owned files. */
  files: IAutoMovieGeneratedFile[];
}
