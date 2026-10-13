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
 *
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Per-port process files and thumbnails remain isolated while content-keyed inputs and numerical caches retain shared ownership.
 *
 * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Port and per-process file names travel together, so a record always names the viewer that wrote it.
 * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Per-port process files and thumbnails remain isolated while content-keyed inputs and numerical caches retain shared ownership.
 *
 * @author Samchon
 */
export interface IHumanViewerInstance {
  /**
   * Loopback TCP port the viewer listens on.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Identifies the public port whose process record and runtime files belong to this viewer.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Identifies the public port whose process record and runtime files belong to this viewer.
   */
  port: number;

  /**
   * `http://127.0.0.1:<port>`, the origin every client and the resident page use.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Keeps clients and the resident page on the same selected loopback instance.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Keeps clients and the resident page on the same selected loopback instance.
   */
  origin: string;

  /**
   * File name, under the resolved viewer storage, of the owning process record.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Selects the per-instance process record used to verify explicit control ownership.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Selects the per-instance process record used to verify explicit control ownership.
   */
  record: string;

  /**
   * File name, under the resolved viewer storage, of the compile process's last report.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Keeps this instance's compiler report separate from another viewer's serving authority.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Keeps this instance's compiler report separate from another viewer's serving authority.
   */
  sourceStatus: string;

  /**
   * File name, under the resolved viewer storage, of the server output log a starting client appends to.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Selects this instance's startup/output log without sharing another process's diagnostics.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Selects this instance's startup/output log without sharing another process's diagnostics.
   */
  log: string;

  /**
   * Folder name, under the resolved viewer storage, of this viewer's thumbnails.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Isolates thumbnail retention by viewer so one instance cannot prune another one's current pictures.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Isolates thumbnail retention by viewer so one instance cannot prune another one's current pictures.
   */
  thumbnails: string;
}
