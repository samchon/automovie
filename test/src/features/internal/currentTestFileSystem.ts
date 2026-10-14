import type fs from "node:fs";

import { currentAutoMovieFileSystem } from "../../../../packages/production/src/project/currentAutoMovieFileSystem";

/** Read the production scope's current dependency. The existing unit compares the out-of-scope result with Node's actual namespace, so this helper supplies neither an expected reference nor an alternate context store. */
export const currentTestFileSystem: () => typeof fs = (): typeof fs =>
  currentAutoMovieFileSystem();
