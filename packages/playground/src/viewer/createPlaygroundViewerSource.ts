import { createViewerDiskSource } from "@automovie/viewer/inspection/createViewerDiskSource";
import { readViewerMaintainedSourceFiles } from "@automovie/viewer/inspection/readViewerMaintainedSourceFiles";
import fs from "node:fs";
import path from "node:path";

import { readPlaygroundViewerPublishedSource } from "./readPlaygroundViewerPublishedSource.js";

/**
 * Bind the normal Playground's source witness to this checkout's maintained source, Human browser output, package assets, public files, HTML entries and configuration. Workspace exports consume maintained source except Human's browser condition, which consumes lib/browser. Maintained membership follows tracked/untracked Git files outside ignored output; consumed emitted/data roots are separately walked. Source edits do not prove Human browser output was rebuilt.
 *
 * Human's publication lock is an explicit watched input and refuses new candidates while the host retains its current page. Manifests/lockfile identify declared dependencies, not every installed SDK file. External caller-owned source-URL payloads and transformed browser responses lie outside this disk scope; hardware frame acceptance is separate and this receipt proves no model health.
 *
 * @evidence contracts/common.md#principled-implementation Canonical maintained-file discovery and disk byte/membership reading cover workspace source exports, Human browser exports and declared assets, while the existing publication guard excludes supported Human publication transactions.
 * @evidence contracts/common.md#clear-and-simple-design One witness supplies current/refresh/watched paths to the retained host; producer lock ownership, Vite watching and completed-page admission remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Git ignores do not hide separately declared emitted/data roots, source freshness does not certify rebuilt output and outside-scope SDK/network/transformed response bytes remain unclaimed.
 * @evidence contracts/common.md#meaningful-documentation The comment names membership provenance, declared lanes, publication exclusion and the limits of checkout-disk certification.
 * @evidence contracts/performance.md#efficient-algorithms Each actual refresh includes Git maintained-membership discovery, HTML/directory traversal, sorted file paths and reading/hashing B bytes across F inputs, retaining the disk owner's O(F log F+B) cost plus discovery/IO. Startup also enumerates explicit watcher paths; no mtime shortcut is used.
 * @evidence contracts/performance.md#reuse-equivalent-work The source owner retains one latest receipt, current reads reuse it outside lock invalidation and a witnessed released lock requests fresh membership/bytes. Stable revision does not avoid refresh byte reads or merge distinct publication effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This owner retains one receipt and declared paths without source history, open file handles or its own watcher/task. File count/bytes are uncapped; the host owns actual watcher/event streams and external input URL lifetime remains caller-owned.
 *
 * @author Samchon
 */
export function createPlaygroundViewerSource(
  root: string,
): ReturnType<typeof createViewerDiskSource> {
  const playground: string = path.join(root, "packages/playground");
  const packages: readonly string[] = [
    "human",
    "engine",
    "interface",
    "viewer",
    "archetypes",
    "render",
  ];
  const lockInput: string = "packages/human/.human-build.lock";
  const publicationLock: string = path.join(root, lockInput);
  const sourceRoots: string[] = [
    path.join(playground, "src"),
    ...packages.map((name: string): string =>
      path.join(root, "packages", name, "src"),
    ),
  ];
  const source: ReturnType<typeof createViewerDiskSource> =
    createViewerDiskSource({
      root,
      directories: [
        path.join(playground, "public"),
        path.join(root, "packages/human/lib/browser"),
        ...packages.map((name: string): string =>
          path.join(root, "packages", name, "assets"),
        ),
      ],
      files: (): string[] => [
        ...readViewerMaintainedSourceFiles(root, sourceRoots),
        ...[
          "pnpm-lock.yaml",
          "pnpm-workspace.yaml",
          "config/tsconfig.json",
          lockInput,
          "packages/playground/package.json",
          "packages/playground/tsconfig.json",
          "packages/playground/lint.config.ts",
          "packages/playground/vite.config.ts",
          ...packages.flatMap((name: string): string[] =>
            ["package.json", "tsconfig.json"].map(
              (file: string): string => `packages/${name}/${file}`,
            ),
          ),
          ...fs
            .readdirSync(playground)
            .filter((name: string): boolean => name.endsWith(".html"))
            .map((name: string): string => `packages/playground/${name}`),
        ].map((file: string): string => path.resolve(root, file)),
      ],
    });
  // Watching roots admits new members; the source owner rereads membership
  // before publishing their bytes, rather than watching only today's list.
  return {
    ...source,
    current: (): ReturnType<typeof source.current> =>
      readPlaygroundViewerPublishedSource({
        current: source.current,
        locked: (): boolean => fs.existsSync(publicationLock),
        refresh: (): void => {
          source.refresh();
        },
        lockInput,
      }),
    watched: [...source.watched, ...sourceRoots],
  };
}
