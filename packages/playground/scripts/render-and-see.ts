import { renderAndSeeCommand as main } from "@automovie/render";
import path from "node:path";

export { renderAndSeeCommand as main } from "@automovie/render";

if (path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
