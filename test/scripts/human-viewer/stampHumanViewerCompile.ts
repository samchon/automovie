/**
 * Append to one transformed human module the statement that records, when
 * the module runs, which compile generation it came from. Each realm (the
 * page and each worker) collects the identities in
 * `globalThis.__humanViewerCompiles`, so after loading it can prove that all
 * of its human modules came from one compile.
 *
 * @evidence contracts/common.md#principled-implementation The record is made by the served code itself, so it reflects exactly what a realm loaded.
 * @evidence contracts/common.md#meaningful-documentation States what is recorded, where and why.
 */
export function stampHumanViewerCompile(code: string, compile: string): string {
  return (
    code +
    "\ninterface IHumanViewerCompileGlobals { __humanViewerCompiles?: Set<string>; }\n;((globalThis as IHumanViewerCompileGlobals).__humanViewerCompiles ??= new Set()).add(" +
    JSON.stringify(compile) +
    ");\n"
  );
}
