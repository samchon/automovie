/**
 * Manifest-owned identity of the exact external motion bytes the author chose.
 *
 * Adoption compares path and byte length with the inspection and checks digest
 * spelling. The digest remains the manifest owner's claim: equal path and
 * length alone do not prove equal byte content, so that owner must bind the
 * digest to the resident bytes before inspection.
 */
export interface IAutoMovieExternalMotionSource {
  /** Manifest path; it must be non-blank and equal the inspected path. */
  path: string;

  /** `sha256:` plus 64 lowercase hex digits, pinned by the production manifest. */
  digest: string;

  /** Resident byte count; a positive safe integer equal to the inspected one. */
  byteLength: number;
}
