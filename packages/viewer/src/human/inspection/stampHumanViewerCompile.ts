/**
 * Append a JSON-escaped compile-label registration to transformed TypeScript. Ordinary Vite TypeScript lowering erases its local interface assertion, and execution records the label in that page/worker realm's `globalThis.__humanViewerCompiles`. Only executed modules contribute; a singleton label set does not prove a complete dependency closure, unexecuted module identity or appearance validity.
 *
 * @evidence contracts/common.md#principled-implementation Appends a JSON-escaped compile identifier registration to transformed TypeScript so each executing realm records only the Human modules it actually evaluated.
 * @evidence contracts/common.md#clear-and-simple-design The injected registration has one realm-local Set and leaves full source-graph identity and candidate interpretation with compiler/generation owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching set of observed compile labels is not a complete dependency closure, proof of all module execution or appearance validity; unexecuted modules contribute nothing.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies executed-module scope, JSON-safe literal encoding, ordinary TypeScript lowering and the limits of realm-local labels.
 * @evidence contracts/performance.md#efficient-algorithms String concatenation allocates the transformed code plus a small registration suffix; execution adds one compile label with expected constant-time Set insertion.
 * @evidence contracts/performance.md#reuse-equivalent-work Modules of one compilation share one realm-local label entry, but distinct compilations remain distinct labels and do not authorize sharing mixed-generation effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The realm retains encountered compile labels until that page/worker realm ends, with no independent label-count cap or explicit reset in this suffix.
 */
export function stampHumanViewerCompile(code: string, compile: string): string {
  return (
    code +
    "\ninterface IHumanViewerCompileGlobals { __humanViewerCompiles?: Set<string>; }\n;((globalThis as IHumanViewerCompileGlobals).__humanViewerCompiles ??= new Set()).add(" +
    JSON.stringify(compile) +
    ");\n"
  );
}
