/**
 * Host-owned startup inputs, independent of a personal numerical document.
 *
 * @evidence contracts/common.md#principled-implementation Loopback origin, revision, maintained entry and input digests specify the source authority accepted at numerical startup.
 * @evidence contracts/common.md#clear-and-simple-design Startup authority stays independent of each subsequent numerical document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The worker receives actual host-observed byte membership instead of trusting the entry filename alone.
 * @evidence contracts/common.md#meaningful-documentation The declaration states origin ownership, absolute entry meaning and after-load source matching.
 *
 * @author Samchon
 */
export interface IHumanViewerNodeWorkerData {
  /** Verified loopback origin serving unchanged digest-checked basis routes. */
  origin: string;

  /** Current source revision selected before startup. */
  revision: string;

  /** Absolute maintained entry actually launched by this host. */
  entry: string;

  /** Exact host-observed source bytes that must still match after loading. */
  inputs: Record<string, string>;
}
