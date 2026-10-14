/**
 * Host-owned startup inputs, independent of a personal numerical document.
 *
 * @evidence contracts/common.md#principled-implementation Pins the host's loopback source origin, selected revision, absolute maintained entry and checked input byte witnesses before child initialization.
 * @evidence contracts/common.md#clear-and-simple-design Keeps startup source facts separate from personal numerical document/basis/operation input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The origin string is configured host authority, not validated by this interface; loaded witnesses must match and plain record casts cannot certify bytes.
 * @evidence contracts/common.md#meaningful-documentation Documents actual launched entry and original host-observed digests, whose values are hashes rather than embedded source byte buffers.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no IO; the checked authority owner reads actual project/loader/input bytes after entry load.
 * @evidence contracts/performance.md#reuse-equivalent-work One startup witness is shared within its owned session and current host values are compared again before commands.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Session lifetime retains this witness without a separate byte/count cap; no model, photograph or native process handle is embedded.
 *
 * @author Samchon
 */
export interface IHumanViewerNodeWorkerData {
  /** Host-selected loopback origin of digest-checked basis routes; this type performs no origin validation. */
  origin: string;

  /** Current source revision selected before startup. */
  revision: string;

  /** Absolute maintained entry actually launched by this host. */
  entry: string;

  /** Host-observed digest per maintained input; the loaded realm must still match these byte and membership witnesses. */
  inputs: Record<string, string>;
}
