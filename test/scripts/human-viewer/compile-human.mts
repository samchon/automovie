/**
 * Transform the whole human package with its typia plugin in a process of its
 * own and write the result as JSON: `node compile-human.mts <human-dir> <out>`.
 *
 * The compiler call is synchronous and can run for a minute, so inside the
 * server's process it froze every request, `/health` included. Run here, the
 * server keeps answering while a generation compiles. The file uses only
 * syntax Node strips, so it starts without the project type check that
 * `ttsx` performs. The output holds `{ files, watch, inputs }` on success and
 * `{ error }` on failure; the exit code is nonzero only when no output could
 * be written.
 *
 * The output is in the form the server uses as is, so it does no per-file
 * work on its request thread: `files` keys are absolute forward-slash paths,
 * `watch` is every file the compile depends on as an absolute path (the
 * transformed files, each import edge's ends, globals, configs, probed
 * resolution candidates and other resolution inputs; type-only dependencies
 * and configs too, so any edit that could change the build invalidates it),
 * and `inputs` is `watch` normalized for comparison (forward slashes, lower
 * case). This file is the one owner of that list.
 */
import fs from "node:fs";
import path from "node:path";
import { TtscCompiler } from "ttsc";

import type { IHumanViewerCompileGraph } from "./IHumanViewerCompileGraph";

const [human, output] = process.argv.slice(2);
if (human === undefined || output === undefined)
  throw new Error("usage: compile-human.mts <human-dir> <output>");
let body: string;
try {
  const compiler = new TtscCompiler({
    cwd: human,
    tsconfig: path.join(human, "tsconfig.json"),
    plugins: [{ transform: "typia/lib/transform" }],
  });
  const result = compiler.transform();
  if (result.type === "success") {
    const absolute = (file: string): string => path.resolve(human, file).replaceAll("\\", "/");
    const files = Object.fromEntries(Object.entries(result.typescript as Record<string, string>)
      .map(([file, source]) => [absolute(file), source]));
    const graph = result.graph as IHumanViewerCompileGraph | undefined;
    const watch = [...new Set([
      ...Object.keys(result.typescript as Record<string, string>),
      ...(graph === undefined ? [] : [
        ...Object.keys(graph.edges),
        ...Object.values(graph.edges).flat(),
        ...graph.globals,
        ...graph.configs,
        ...Object.values(graph.candidates ?? {}).flat(),
        ...(graph.resolutionInputs ?? []),
      ]),
    ].map(absolute))];
    body = JSON.stringify({ files, watch, inputs: watch.map((file) => file.toLowerCase()) });
  } else body = JSON.stringify({ error: JSON.stringify(result) });
} catch (error) {
  body = JSON.stringify({
    error: error instanceof Error ? error.message : String(error),
  });
}
fs.writeFileSync(output + ".tmp", body);
fs.renameSync(output + ".tmp", output);
