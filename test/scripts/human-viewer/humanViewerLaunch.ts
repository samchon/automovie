/**
 * The agreement between the starting launcher and the viewer server it
 * builds. The launcher owns the public port and the process record from its
 * first moment; the server it starts listens on the free internal port the
 * launcher found for it (strictly: a port taken in between fails the start
 * loudly), prints that port on a line of its own once it listens, and reports the launcher's pid as the
 * owner in `/health`, so status, stop and ensure judge ownership by one pid.
 * The module has no runtime imports and uses only syntax Node strips, so the
 * plain-Node launcher can load it.
 *
 * @evidence contracts/common.md#clear-and-simple-design One module names the environment and output line both sides use.
 * @evidence contracts/common.md#meaningful-documentation States the ownership split and how the internal port is announced.
 * @author Samchon
 */
export const humanViewerLaunch = {
  /** Environment variable carrying the launcher's pid; set only for a server a launcher started. */
  ownerVariable: "HUMAN_VIEWER_OWNER_PID",

  /** Environment variable carrying the free internal port the launcher reserved for the server. */
  internalVariable: "HUMAN_VIEWER_INTERNAL_PORT",

  /** Prefix of the server's output line announcing that it listens on its internal port. */
  upstreamPrefix: "HUMAN_VIEWER_UPSTREAM ",
} as const;
