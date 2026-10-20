/**
 * Declared provider, model, version and execution boundary of an intended repaint implementation.
 *
 * @evidence contracts/common.md#principled-implementation A literal protocol and closed execution union constrain the declared identity shape; provider, model and version are plain strings without nonblank validation or canonicalization.
 * @evidence contracts/common.md#clear-and-simple-design Five explicit identity fields distinguish implementation revisions without embedding credentials or provider invocation arguments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record names a declared implementation but does not hash a remote deployment, promise deterministic output or compare a reported adapter identity; no retained execution host enforces that comparison.
 * @evidence contracts/common.md#meaningful-documentation Defines protocol, provider/model/version and local, API or explicit other execution authority.
 */
export interface IAutoMovieRepaintRuntimeIdentity {
  /** Identity protocol. */
  protocolVersion: "automovie.repaint-runtime.v1";

  /** Adapter/provider family. */
  provider: string;

  /** Exact model id. */
  model: string;

  /** Exact model or deployment version. */
  version: string;

  /** Local, API, or another explicit execution boundary. */
  execution: "local" | "api" | "other";
}
