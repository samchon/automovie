/**
 * Append to one transformed human module the statement that records, when
 * the module runs, which compile generation it came from. Each realm (the
 * page and each worker) collects the identities in
 * `globalThis.__humanViewerCompiles`, so after loading it can prove that all
 * of its human modules came from one compile.
 */
export function stampHumanViewerCompile(code: string, compile: string): string {
  return (
    code +
    "\ninterface IHumanViewerCompileGlobals { __humanViewerCompiles?: Set<string>; }\n;((globalThis as IHumanViewerCompileGlobals).__humanViewerCompiles ??= new Set()).add(" +
    JSON.stringify(compile) +
    ");\n"
  );
}
