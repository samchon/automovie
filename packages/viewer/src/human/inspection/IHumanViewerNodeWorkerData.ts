/**
 * Host-owned startup inputs, independent of a personal numerical document.
 *
 * @evidence contracts/common.md#principled-implementation Loopback origin, revision, maintained entry and input digests specify the source authority accepted at numerical startup.
 * @evidence contracts/common.md#clear-and-simple-design Startup authority stays independent of each subsequent numerical document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The worker receives actual host-observed byte membership instead of trusting the entry filename alone.
 * @evidence contracts/common.md#meaningful-documentation The declaration states origin ownership, absolute entry meaning and after-load source matching.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Loopback origin, revision, maintained entry and input digests specify the source authority accepted at numerical startup.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest The worker receives actual host-observed byte membership instead of trusting the entry filename alone.
 * @author Samchon
 */
export interface IHumanViewerNodeWorkerData {
  /**
   * Verified loopback origin serving unchanged digest-checked basis routes.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Keeps the checked numerical realm's basis requests on the verified loopback data provider.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Keeps the checked numerical realm's basis requests on the verified loopback data provider.
   */
  origin: string;

  /**
   * Current source revision selected before startup.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Preserves source identity elected before startup rather than a later catalogue reading.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Preserves source identity elected before startup rather than a later catalogue reading.
   */
  revision: string;

  /**
   * Absolute maintained entry actually launched by this host.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Names the actual maintained absolute numerical entry launched by this host.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Names the actual maintained absolute numerical entry launched by this host.
   */
  entry: string;

  /**
   * Exact host-observed source bytes that must still match after loading.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Keeps the host-observed source membership and byte digests that must still match after loading.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Keeps the host-observed source membership and byte digests that must still match after loading.
   */
  inputs: Record<string, string>;
}
