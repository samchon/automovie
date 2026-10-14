/**
 * Transform the whole human package with its typia plugin in a process of its own and write the result as JSON: `node compile-human.ts <human-dir> <out>`.
 *
 * The compiler call is synchronous and can run for a minute, so inside the server's process it froze every request, `/health` included. Run here, the server keeps answering while a generation compiles. The file uses only syntax Node strips, so it starts without the project type check that `ttsx` performs. The output holds `{ files, watch, inputs }` on success and `{ error }` on failure; the exit code is nonzero only when no output could be written.
 *
 * The server consumes the transformed files directly. Files use absolute forward-slash keys; watch combines transformed files with the compiler's supplied graph edges, globals, configurations, resolution candidates and inputs. If graph metadata is absent, only transformed membership is available and this list cannot promise exhaustive invalidation. Inputs normalize watch paths with Windows case folding and POSIX case preservation; this is lexical identity rather than realpath or atomic source-snapshot proof.
 */
import fs from "node:fs";
import path from "node:path";
import { TtscCompiler } from "ttsc";

import type { IHumanViewerCompileGraph } from "./IHumanViewerCompileGraph.js";
import { normalizeHumanViewerCompilePath } from "./normalizeHumanViewerCompilePath.ts";

const [human, output]: string[] = process.argv.slice(2);
if (human === undefined || output === undefined)
  throw new Error("usage: compile-human.ts <human-dir> <output>");
let body: string;
try {
  const compiler: TtscCompiler = new TtscCompiler({
    cwd: human,
    tsconfig: path.join(human, "tsconfig.json"),
    plugins: [{ transform: "typia/lib/transform" }],
  });
  const result: ReturnType<TtscCompiler["transform"]> = compiler.transform();
  if (result.type === "success") {
    const absolute: (file: string) => string = (file: string): string =>
      path.resolve(human, file).replaceAll("\\", "/");
    const files: Record<string, string> = Object.fromEntries(
      Object.entries(result.typescript as Record<string, string>).map(
        ([file, source]: [string, string]): [string, string] => [
          absolute(file),
          source,
        ],
      ),
    );
    const graph: IHumanViewerCompileGraph | undefined = result.graph as
      | IHumanViewerCompileGraph
      | undefined;
    const watch: string[] = [
      ...new Set(
        [
          ...Object.keys(result.typescript as Record<string, string>),
          ...(graph === undefined
            ? []
            : [
                ...Object.keys(graph.edges),
                ...Object.values(graph.edges).flat(),
                ...graph.globals,
                ...graph.configs,
                ...Object.values(graph.candidates ?? {}).flat(),
                ...(graph.resolutionInputs ?? []),
              ]),
        ].map(absolute),
      ),
    ];
    body = JSON.stringify({
      files,
      watch,
      inputs: watch.map(normalizeHumanViewerCompilePath),
    });
  } else body = JSON.stringify({ error: JSON.stringify(result) });
} catch (error) {
  body = JSON.stringify({
    error: error instanceof Error ? error.message : String(error),
  });
}
fs.writeFileSync(output + ".tmp", body);
fs.renameSync(output + ".tmp", output);
