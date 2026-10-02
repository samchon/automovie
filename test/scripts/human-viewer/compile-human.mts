/**
 * Transform the whole human package with its typia plugin in a process of its
 * own and write the result as JSON: `node compile-human.mts <human-dir> <out>`.
 *
 * The compiler call is synchronous and can run for a minute, so inside the
 * server's process it froze every request, `/health` included. Run here, the
 * server keeps answering while a generation compiles. The file uses only
 * syntax Node strips, so it starts without the project type check that
 * `ttsx` performs. The output holds `{ files, graph }` on success and
 * `{ error }` on failure; the exit code is nonzero only when no output could
 * be written.
 */
import fs from "node:fs";
import path from "node:path";
import { TtscCompiler } from "ttsc";

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
  body =
    result.type === "success"
      ? JSON.stringify({ files: result.typescript, graph: result.graph })
      : JSON.stringify({ error: JSON.stringify(result) });
} catch (error) {
  body = JSON.stringify({
    error: error instanceof Error ? error.message : String(error),
  });
}
fs.writeFileSync(output + ".tmp", body);
fs.renameSync(output + ".tmp", output);
