import path from "node:path";

import { serveViewer } from "./serveViewer.ts";

/**
 * Runs an isolated local comparison from explicit manifest, browser asset, renderer and output declarations.
 *
 * @evidence contracts/common.md#principled-implementation Parses unique option/value pairs and delegates admitted local runtime creation to serveViewer.
 * @evidence contracts/common.md#clear-and-simple-design The executable owns option interpretation while the server owns listeners and data admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing required paths refuse execution instead of selecting a hidden dataset or renderer.
 * @evidence contracts/common.md#meaningful-documentation The comment and option names state explicit isolated runtime inputs.
 * @evidence contracts/performance.md#efficient-algorithms Option parsing is linear in argument count; loading and rendering costs stay in their producers.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the shared server implementation without caching a mutable runtime by path alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps one returned runtime and requests its close on termination; the server retains its own lifetime contract.
 */
export async function main(): Promise<void> {
  const args: Map<string, string> = new Map();
  for (let index: number = 2; index < process.argv.length; index += 2) {
    const name: string = process.argv[index];
    const value: string | undefined = process.argv[index + 1];
    if (!name.startsWith("--") || value === undefined || args.has(name))
      throw new Error("Viewer expects unique named option/value pairs");
    args.set(name, value);
  }
  const required: (name: string) => string = (name: string): string => {
    const value: string | undefined = args.get(name);
    if (!value) throw new Error(`Missing viewer option ${name}`);
    return path.resolve(value);
  };
  const runtime: Awaited<ReturnType<typeof serveViewer>> = await serveViewer({
    manifest: required("--manifest"),
    assets: required("--assets"),
    renderer: required("--renderer"),
    output: required("--output"),
    port: Number(args.get("--port") ?? "0"),
  });
  console.log(runtime.url);
  process.once("SIGINT", (): void => {
    void runtime.close();
  });
  process.once("SIGTERM", (): void => {
    void runtime.close();
  });
}
await main();
