/**
 * Request full construction with its separate admission report. Document schema admission still runs; a refused layer construction is inspectable without becoming an accepted preview. Body and person runtimes own different construction capabilities.
 *
 * @evidence contracts/common.md#principled-implementation The construct discriminator requests a separate inspection result while retaining numerical document parsing and the construction owner's admission outcome.
 * @evidence contracts/common.md#clear-and-simple-design The operation and original document form one worker transaction, leaving accepted preview state to its runtime owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction inspection exposes actual refusal instead of disabling validation or treating a draft as accepted geometry.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes document admission, layer inspection and accepted preview, and identifies runtime-specific capability ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased construction request schema chooses no evaluation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The request record neither compiles nor caches a construction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no worker or geometry buffer lifetime.
 *
 * @author Samchon
 */
export interface IConnectedBodyConstructionRequest {
  /** Select full construction with normal admission recorded alongside it. */
  operation: "construct";

  /** Serialized numerical document; the receiving runtime parses it before construction. */
  document: string;
}
