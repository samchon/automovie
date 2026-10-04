/**
 * The address and per-process files of one resident viewer. Several viewers
 * can run beside each other on different ports; each one owns its own process
 * record and compilation report, while the numerical cache, thumbnails and
 * inputs stay shared because they are keyed by content.
 *
 * @evidence contracts/common.md#principled-implementation Port and per-process file names travel together, so a record always names the viewer that wrote it.
 * @evidence contracts/common.md#clear-and-simple-design One record carries what server, clients and control script need to find one viewer.
 * @evidence contracts/common.md#meaningful-documentation States which files are per viewer and which stay shared.
 * @author Samchon
 */
export interface IHumanViewerInstance {
  /** Loopback TCP port the viewer listens on. */
  port: number;

  /** `http://127.0.0.1:<port>`, the origin every client and the resident page use. */
  origin: string;

  /** File name, under `.shots/human-viewer`, of the owning process record. */
  record: string;

  /** File name, under `.shots/human-viewer`, of the compile process's last report. */
  sourceStatus: string;
}
