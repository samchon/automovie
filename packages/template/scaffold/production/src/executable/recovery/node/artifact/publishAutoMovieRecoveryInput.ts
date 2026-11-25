import type { IAutoMovieByteDigest } from "@automovie/interface";

import { writeAutoMovieRecoveryArtifact } from "./writeAutoMovieRecoveryArtifact";

/**
 * Publish an authored recovery input and carry its original typed value with
 * the digest of the exact bytes written. The receipt is frozen. Keep its
 * borrowed value and every nested array unchanged so the digest continues to
 * identify the input you use.
 *
 * @param output A new artifact path.
 * @param value The authored input held for the next recovery operation.
 * @returns The input value and the digest of its publication.
 */
export function publishAutoMovieRecoveryInput<T extends object>(
  output: string,
  value: T,
): publishAutoMovieRecoveryInput.IArtifact<T> {
  const digest: IAutoMovieByteDigest = writeAutoMovieRecoveryArtifact(
    output,
    value,
  );
  return Object.freeze({ ...digest, value });
}

export namespace publishAutoMovieRecoveryInput {
  /** One fixed recovery input and the digest of the bytes that describe it. */
  export interface IArtifact<T extends object>
    extends Readonly<IAutoMovieByteDigest> {
    /** The same typed input supplied to the publication writer. */
    readonly value: T;
  }
}
