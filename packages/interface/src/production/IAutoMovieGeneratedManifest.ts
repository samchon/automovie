import { IAutoMovieGeneratedFile } from "./IAutoMovieGeneratedFile";

/**
 * Manifest recording builder identity, compile input and exact generated output ownership.
 *
 * @evidence contracts/common.md#principled-implementation The builder records its package and protocol versions, aggregate compile fingerprint and path-sorted byte-digested files; production ownership checks compare canonical manifest content and file bytes before trusting this record.
 * @evidence contracts/common.md#clear-and-simple-design One versioned manifest ties all generated members to a single compile rather than giving every file an independent builder or input ledger.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching manifest shape alone is insufficient: current input identity, exact member inventory and bytes are checked, including empty output; arbitrary existing files are not adopted.
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
