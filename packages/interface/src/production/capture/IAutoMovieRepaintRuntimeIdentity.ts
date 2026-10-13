/**
 * Canonical provider, model, version and execution boundary of the adopted host repaint implementation.
 *
 * @evidence contracts/common.md#principled-implementation Canonicalization admits exactly protocol v1 and nonblank provider, model and version with a closed execution boundary, producing the structured adapter identity compared against the production adoption.
 * @evidence contracts/common.md#clear-and-simple-design Five explicit identity fields distinguish implementation revisions without embedding credentials or provider invocation arguments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record names an exact declared implementation but does not hash a remote deployment or promise deterministic provider output; the host rejects a mismatching reported identity instead of substituting a default adapter.
 * @evidence contracts/common.md#meaningful-documentation Defines protocol, provider/model/version and local, API or explicit other execution authority.
 * @author Samchon
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
