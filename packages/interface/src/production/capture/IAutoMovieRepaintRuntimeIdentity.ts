/** Structured identity of the host repaint implementation. */
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
