import type { IAutoMovieReferenceIdentity } from "./IAutoMovieReferenceIdentity";

/**
 * The reader's own read-only host port. Native operations supply physical facts;
 * reference policy neither replaces their methods nor reproduces a filesystem.
 *
 * @evidence contracts/common.md#principled-implementation Native pathname and descriptor observations supply read-only physical identity and bounded bytes.
 * @evidence contracts/common.md#clear-and-simple-design One injected host port separates filesystem effects from portable reference policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native methods remain ordinary inputs rather than being patched or recreated in policy tests.
 * @evidence contracts/common.md#meaningful-documentation Members state bigint observations, overflow byte and descriptor close ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-held values retain only their documented fields; implementations own handles and source-lifetime bounds.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceFileSystem {

  /** Windows own-open observations differ from strict metadata on other hosts. */
  readonly platform?: NodeJS.Platform;

  /** Observe the entry itself without following a link.
   *
   * @evidence contracts/common.md#principled-implementation A pathname observation classifies the entry itself and supplies bigint identity/version facts without following a symbolic link.
   * @evidence contracts/common.md#clear-and-simple-design Native observation stays separate from reader admission policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The capability reports current native facts rather than patched filesystem methods or cached fixture identities.
   * @evidence contracts/common.md#meaningful-documentation The member states nonfollowing physical observation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned small observation transfers to the reader; no resident descriptor is required by this pathname operation.
   */
  lstat(location: string): Promise<IAutoMovieReferenceIdentity>;

  /** Observe physical ancestry for declared-path comparison.
   *
   * @evidence contracts/common.md#principled-implementation A pathname resolves to its current physical spelling for declared identity comparison.
   * @evidence contracts/common.md#clear-and-simple-design Resolution supplies facts while the reader decides root and ancestry equivalence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Resolved spelling is not treated as a namespace lock or as authority to normalize an unsafe authored path.
   * @evidence contracts/common.md#meaningful-documentation The member states physical ancestry observation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the resolved path string transfers to the reader; this port owns no resident source bytes.
   */
  realpath(location: string): Promise<string>;

  /** Enumerate child names without reading their content.
   *
   * @evidence contracts/common.md#principled-implementation The capability enumerates current child names without reading their source bodies.
   * @evidence contracts/common.md#clear-and-simple-design Inventory effects are separate from name and physical-identity admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader validates every visible entry rather than trusting a prefiltered fixture population.
   * @evidence contracts/common.md#meaningful-documentation The member states child-name enumeration and omitted content reads.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned name population; the implementation closes native directory enumeration resources.
   */
  list(location: string): Promise<readonly string[]>;

  /** Hold a read-only descriptor through bounded read, recheck and release.
   *
   * @evidence contracts/common.md#principled-implementation One read-only descriptor supplies stat, bounded read and close for the admitted source identity.
   * @evidence contracts/common.md#clear-and-simple-design Descriptor ownership is explicit so the reader can recheck identity while bytes are held.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No write method or source mutation capability is exposed.
   * @evidence contracts/common.md#meaningful-documentation The member and returned ports state identity, maximum-plus-one overflow detection and unconditional close ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The reader closes each successful descriptor in finally on success or refusal, including its Windows corroborating handle.
   */
  open(location: string): Promise<{

    /** Identity observed through the held descriptor. */
    stat(): Promise<IAutoMovieReferenceIdentity>;

    /** At most maximum bytes plus one overflow-detection byte. */
    read(maximum: number): Promise<Uint8Array>;

    /** Release even after a refused or failed read. */
    close(): Promise<void>;
  }>;
}
