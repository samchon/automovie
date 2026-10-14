/**
 * Restrict runtime code generation to the source owner that actually calls typia. The numerical library is still compiled as a complete package by the injected compiler API; unrelated modules retain Vite's normal TypeScript lowering. Path boundaries, queries and declarations are handled before invoking the compiler. A watcher event invalidates provenance when `affects` says it can change the compile.
 *
 * @evidence contracts/common.md#principled-implementation Only non-declaration TypeScript under the exact source-root boundary uses the injected whole-package transform; relevant watcher changes and bundle close invalidate through the owner reset.
 * @evidence contracts/common.md#clear-and-simple-design Three Vite callbacks adapt path selection, compile transformation and invalidation without owning another compiler or runtime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Query suffixes are removed before ownership checks, sibling roots and declarations are left untouched, and unrelated events do not reset when the supplied predicate refuses them.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes numerical-package transformation from ordinary Vite lowering and describes watcher provenance withdrawal.
 * @evidence contracts/performance.md#efficient-algorithms Dispatch normalizes and checks path strings linearly; expensive complete-package compilation remains with the injected owner and its generation sharing.
 * @evidence contracts/performance.md#reuse-equivalent-work The transform delegates compile equivalence to its owner and only forwards admitted source paths; this adapter maintains no independent transformed-code cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains a root prefix and callbacks for the Vite lifetime; closeBundle invokes reset, while actual child-process and generated-map disposal remain with compiler owners.
 */
export function createHumanViewerTransform<Result>(
  sourceRoot: string,
  transform: (id: string, source: string) => Promise<Result | undefined>,
  reset: () => void,
  affects: (file: string, event: string) => boolean = (): boolean => true,
): {
  name: string;
  enforce: "pre";
  transform: (source: string, id: string) => Promise<Result | undefined>;
  watchChange: (id: string, change: IHumanViewerWatchChange) => void;
  closeBundle: () => void;
} {
  const prefix: string = sourceRoot.replace(/\\/g, "/").replace(/\/$/, "") + "/";
  return {
    name: "human-viewer-typia",
    enforce: "pre" as const,
    transform: async (
      source: string,
      id: string,
    ): Promise<Result | undefined> => {
      const file: string = id.split("?")[0].replace(/\\/g, "/");
      if (
        !file.startsWith(prefix) ||
        !file.endsWith(".ts") ||
        file.endsWith(".d.ts")
      )
        return undefined;
      return transform(file, source);
    },
    watchChange: (id: string, change: IHumanViewerWatchChange): void => {
      if (affects(id, change.event)) reset();
    },
    closeBundle: reset,
  };
}

/**
 * Named local transport for createHumanViewerTransform; member meaning remains with its calculation owner.
 *
 * @author Samchon
 */
interface IHumanViewerWatchChange {
  event: string;
}
