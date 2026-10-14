import { IAutoMovieProductionMediaProbe, IAutoMovieProductionRenderManifest } from "@automovie/interface";

/**
 * One deliverable file whose manifest tuple, owner probe, and applicable semantic sidecar binding matched in this review call. A resident size or digest mismatch may already be recorded separately and does not prevent collecting the observed probe.
 *
 * @evidence contracts/common.md#principled-implementation The record joins a manifest file entry with its same-read byte buffer and admitted discriminated media probe. This structural type does not prove the filesystem remains unchanged after the read or remeasure probe facts.
 * @evidence contracts/common.md#clear-and-simple-design The internal three-field record lets timeline validation reuse byte and role admission from finalDeliverableDiagnostics rather than reopening each file for every subtype check.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observed files are only appended after current receipt/probe and applicable semantic-mask admission in the coordinator. The type itself is not a forged receipt or an independent validation result.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish manifest role, borrowed observed bytes, and current structured probe. The comment states the review-call lifetime and absence of an atomic snapshot guarantee.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no byte parsing or traversal; finalDeliverableDiagnostics and probeProductionMedia own those full-input costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The structural record does not implement caching or invalidation. The coordinator reuses its same-read bytes within one deliverable's checks and rereads them on later reviews.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no descriptors or tasks. Its runtime byte buffers are retained by the review coordinator through that deliverable's checks without a byte-count quota.
 *
 * @author Samchon
 */
export interface IProductionDeliveryObservedFile {
  /** Manifest role whose ledger tuple matched an owner receipt; resident digest errors remain separate. */
  file: IAutoMovieProductionRenderManifest["deliverables"][number]["files"][number];

  /** Borrowed bytes read for this validation call; later filesystem changes remain possible. */
  bytes: Uint8Array;

  /** Current structured probe admitted from those same bytes. */
  probe: IAutoMovieProductionMediaProbe;
}
