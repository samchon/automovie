/**
 * The address and per-process files of one resident viewer. Several viewers
 * can run beside each other on different ports; each one owns its process
 * record, compilation report, output log and thumbnail folder. Thumbnails are
 * per viewer because each viewer prunes its folder to its own current and
 * previous revision, which would delete another viewer's current pictures in
 * a shared folder. The numerical cache and the inputs stay shared: they are
 * keyed by content and nothing prunes them.
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

  /** File name, under the resolved viewer storage, of the owning process record. */
  record: string;

  /** File name, under the resolved viewer storage, of the compile process's last report. */
  sourceStatus: string;

  /** File name, under the resolved viewer storage, of the server output log a starting client appends to. */
  log: string;

  /** Folder name, under the resolved viewer storage, of this viewer's thumbnails. */
  thumbnails: string;
}
