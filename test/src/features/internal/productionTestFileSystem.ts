import type fs from "node:fs";

import { productionFileSystem } from "../../../../packages/production/src/project/productionFileSystem";

/** Return the actual production dispatcher singleton. Its get trap resolves the current AsyncLocalStorage dependency per access; this helper opens no file, caches no filesystem answer and leaves the concurrent routing assertions with the existing unit. */
export const productionTestFileSystem: () => typeof fs = (): typeof fs =>
  productionFileSystem;
