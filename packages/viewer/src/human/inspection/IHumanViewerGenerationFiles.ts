/**
 * The two files of the published one-skin person generation in the viewer's ignored storage: the head view and the body view, each opening with the generation id.
 *
 * @evidence contracts/common.md#principled-implementation Names the explicitly paired head/body partition views for the published one-skin generation in resolved mutable storage.
 * @evidence contracts/common.md#clear-and-simple-design Keeps file locations separate from the opening generation/basis identities and byte digests learned by sidecar readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both views must be present and share generation identity; absence refuses or remains pending rather than falling back to unrelated legacy bases.
 * @evidence contracts/common.md#meaningful-documentation Documents head/body roles and common generation premise; the type itself does not certify numerical view schema.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two path strings do no reading; asynchronous facts own hashing/inflation and the pair reader performs fixed identity checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Paired view digests jointly determine person/paired-body tokens and keys; matching generation name alone cannot authorize replaced bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The source owner retains the path pair; byte streams, facts and numerical view lifetimes remain their actual readers' responsibilities.
 *
 * @author Samchon
 */
export interface IHumanViewerGenerationFiles {
  /** Head view of the published generation. */
  head: string;

  /** Body view of the same generation. */
  body: string;
}
