import type fs from "node:fs";

import type { ITestFileSystemCall } from "./ITestFileSystemCall";

/**
 * An isolated forwarding adapter and its per-instance operation receipts. The production dependency unit owns concurrent context assertions; this record declares no separate scenario or filesystem handle.
 *
 * @author Samchon
 */
export interface ITestFileSystem {
  /** Mutable test-owned Proxy; unspecified properties forward to Node's unchanged filesystem namespace. */
  fileSystem: typeof fs;

  /** Fresh shallow receipt list in call order; receipt records and argument values are not cloned. */
  calls: () => readonly ITestFileSystemCall[];
}
