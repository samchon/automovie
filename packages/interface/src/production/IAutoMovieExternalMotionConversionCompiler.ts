/**
 * Compiler tool and protocol identity sealed into a motion conversion receipt.
 *
 * @evidence contracts/common.md#principled-implementation productionExternalMotionConversionDraft copies the maintained build-version and protocol constants into each receipt. These are declared version labels, not a hash of loaded implementation bytes or independent proof that one exact compiler executable ran.
 * @evidence contracts/common.md#clear-and-simple-design Two explicit version fields belong to the receipt's builder group rather than repeating compiler identity on every transformation and loss entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A compatible package name does not stand in for the actual builder version, and changed content protocols cannot silently reuse an earlier receipt's interpretation.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes exact compiler package version from the content-protocol revision sealed into the conversion receipt.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionCompiler {
  /** Exact builder package version. */
  packageVersion: string;

  /** Exact builder content-protocol version. */
  protocolVersion: string;
}
