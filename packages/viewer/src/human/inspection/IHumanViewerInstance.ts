/**
 * The address and per-process files of one resident viewer. Several viewers can run beside each other on different ports; each one owns its process record, compilation report, output log and thumbnail folder. Thumbnails are per viewer because each viewer prunes its folder to its own current and previous revision, which would delete another viewer's current pictures in a shared folder. The numerical cache and the inputs stay shared: they are keyed by content and nothing prunes them.
 *
 * @evidence contracts/common.md#principled-implementation Canonicalizes one validated loopback port into origin and per-port record, compile-status, log and thumbnail names.
 * @evidence contracts/common.md#clear-and-simple-design Keeps session-isolated administrative outputs separate from shared content-keyed numerical cache and inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ports outside 1024..65535 refuse at humanViewerInstance; configured names alone cannot establish actual OS process ownership.
 * @evidence contracts/common.md#meaningful-documentation Documents default historical names, distinct-port isolation and resolved mutable storage; thumbnail pruning must not cross another viewer's folder.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This value performs no IO; the resolver parses one numeric option and projects a fixed-size record.
 * @evidence contracts/performance.md#reuse-equivalent-work Unset and explicit default share one canonical naming policy, while different ports retain distinct server ownership and thumbnail populations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns listener/record/log/thumbnail lifetimes; this string/number record creates no directories or process handles.
 *
 * @author Samchon
 */
export interface IHumanViewerInstance {
  /** Loopback TCP port the viewer listens on. */
  port: number;

  /**
   * `http://127.0.0.1:<port>`, the origin every client and the resident page use.
   */
  origin: string;

  /**
   * File name, under the resolved viewer storage, of the owning process record.
   */
  record: string;

  /**
   * File name, under the resolved viewer storage, of the compile process's last report.
   */
  sourceStatus: string;

  /**
   * File name, under the resolved viewer storage, of the server output log a starting client appends to.
   */
  log: string;

  /**
   * Folder name, under the resolved viewer storage, of this viewer's thumbnails.
   */
  thumbnails: string;
}
