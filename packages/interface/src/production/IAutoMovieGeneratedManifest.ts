import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieGeneratedFile } from "./IAutoMovieGeneratedFile";

/** Manifest proving the identity and ownership of generated output. */
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
  inputFingerprint: AutoMovieContentDigest;

  /** Compiler-owned files. */
  files: IAutoMovieGeneratedFile[];
}
