import path from "node:path";

import { renderAndSeeCommand as main } from "../../template/scaffold/production/src/executable/render/node/capture/renderAndSeeCommand";

export { renderAndSeeCommand as main } from "../../template/scaffold/production/src/executable/render/node/capture/renderAndSeeCommand";

if (path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
