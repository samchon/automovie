import path from "node:path";

import { renderSequenceAndSeeCommand as main } from "../../template/scaffold/production/src/executable/render/node/capture/renderSequenceAndSeeCommand";

export { renderSequenceAndSeeCommand as main } from "../../template/scaffold/production/src/executable/render/node/capture/renderSequenceAndSeeCommand";

if (path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
