

/**
 * Tracked byte-identity receipt for one content-addressed capture bundle manifest.
 *
 * @evidence contracts/common.md#principled-implementation Binds the normalized bundle address to the digest of the actual serialized manifest bytes; verifiedRenderManifest compares the resident manifest before using its frame records.
 * @evidence contracts/common.md#clear-and-simple-design Retains one compact tracked manifest receipt while capture payloads remain in the render namespace and detailed frame facts remain in the manifest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Receipt spelling alone does not prove resident payload identity or renderer behavior; verification separately checks manifest/frame/semantic evidence and refuses stale bytes.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the bundle-relative address, serialized manifest digest and version-one record from terminal production publication receipts.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This scalar data shape chooses no algorithm; bundle commit and verification own hashing, parsing and payload scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A receipt records one observed byte generation, while current consumers reacquire resident bytes rather than sharing effects based only on its digest string.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One tracked receipt remains repository-owned per bundle; it holds only address/digest strings and no frame buffers, handles or tasks.
 * @author Samchon
 */
export interface IAutoMovieProductionProjectRenderBundleReceipt {
    /** Capture bundle receipt schema version. */
    version: 1;

    /** Canonical render-root relative content-addressed bundle directory. */
    bundle: string;

    /** Digest of published UTF-8 manifest bytes, including their serialization. */
    manifestDigest: string;
}
