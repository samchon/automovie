/**
 * Restrict runtime code generation to the source owner that actually calls
 * typia. The numerical library is still compiled as a complete package by the
 * injected compiler API; unrelated modules retain Vite's normal TypeScript
 * lowering. Path boundaries, queries and declarations are handled before
 * invoking the compiler. A watcher event invalidates provenance when
 * `affects` says it can change the compile.
 *
 * @evidence contracts/common.md#principled-implementation A path-segment boundary selects one complete source owner without treating sibling prefixes as members.
 * @evidence contracts/common.md#clear-and-simple-design Selection and lifecycle are pure adapters; the public compiler API owns transformation and proof.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses an injected supported transform operation rather than replacing dependency methods.
 * @evidence contracts/common.md#meaningful-documentation Explains runtime-transform ownership independently of canonical type and lint validation.
 */
export function createHumanViewerTransform<Result>(
  sourceRoot: string,
  transform: (id: string, source: string) => Promise<Result | undefined>,
  reset: () => void,
  affects: (file: string, event: string) => boolean = () => true,
) {
  const prefix = sourceRoot.replace(/\\/g, "/").replace(/\/$/, "") + "/";
  return {
    name: "human-viewer-typia",
    enforce: "pre" as const,
    transform: async (
      source: string,
      id: string,
    ): Promise<Result | undefined> => {
      const file = id.split("?")[0].replace(/\\/g, "/");
      if (
        !file.startsWith(prefix) ||
        !file.endsWith(".ts") ||
        file.endsWith(".d.ts")
      )
        return undefined;
      return transform(file, source);
    },
    watchChange: (id: string, change: { event: string }): void => {
      if (affects(id, change.event)) reset();
    },
    closeBundle: reset,
  };
}
