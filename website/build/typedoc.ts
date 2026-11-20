// Generates the API reference of every package into `public/api/`, which the
// export serves at `/api/`. The options live in `typedoc.config.mjs`.
//
//   pnpm run typedoc
//
// TypeDoc writes every page at once; a reference this large opens more files
// than Windows allows (EMFILE), so the writes are queued behind a fixed
// number of open files before TypeDoc loads.
import fs from "node:fs";

/** How many pages are written at once. */
const OPEN_FILES: number = 64;

const queue = (): void => {
  const write: typeof fs.promises.writeFile = fs.promises.writeFile;
  const waiting: (() => void)[] = [];
  let open: number = 0;
  fs.promises.writeFile = (async (
    ...args: Parameters<typeof fs.promises.writeFile>
  ): Promise<void> => {
    if (open >= OPEN_FILES)
      await new Promise<void>((resolve) => waiting.push(resolve));
    ++open;
    try {
      await write(...args);
    } finally {
      --open;
      waiting.shift()?.();
    }
  }) as typeof fs.promises.writeFile;
};

const main = async (): Promise<void> => {
  queue();
  const td = await import("typedoc");
  const app = await td.Application.bootstrapWithPlugins({}, [
    new td.TypeDocReader(),
    new td.PackageJsonReader(),
    new td.TSConfigReader(),
  ]);
  const project = await app.convert();
  if (project === undefined || app.logger.hasErrors()) process.exit(1);
  await app.generateOutputs(project);
  if (app.logger.hasErrors()) process.exit(1);
};
main().catch((error: unknown): never => {
  console.error(error);
  process.exit(1);
});
