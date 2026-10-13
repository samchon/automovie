
/**
 * One source or dependency file sealed into an external motion receipt.
 *
 * @evidence contracts/common.md#principled-implementation Canonical project-relative resource path and exact resident SHA-256 pin one primary asset or dependency in the conversion source closure; asset inventory verifies current bytes before the receipt is produced.
 * @evidence contracts/common.md#clear-and-simple-design A two-field byte citation is shared by primary source and dependency entries, while dependency order and interpreted basis belong to the enclosing conversion source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A mutable source URL or filename alone cannot certify a conversion input, and the receipt retains original-byte identity instead of replacing it with converted output hashes.
 * @evidence contracts/common.md#meaningful-documentation States project-relative pinned resource ownership and the digest of exact resident bytes for either source or dependency.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionReceiptResource {
  /** Canonical project-relative path of the pinned source byte file. */
  path: string;

  /** Content digest of the exact resident bytes. */
  digest: string;
}
