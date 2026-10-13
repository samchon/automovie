import fs from "node:fs";
import path from "node:path";

import { createViewerDiskSource } from "@automovie/viewer/inspection/createViewerDiskSource";
import { readViewerMaintainedSourceFiles } from "@automovie/viewer/inspection/readViewerMaintainedSourceFiles";
import { readPlaygroundViewerPublishedSource } from "./readPlaygroundViewerPublishedSource.js";

/**
 * Bind the normal Playground to its own source, emitted modules and served
 * application inputs. The root names the checkout used to resolve those paths;
 * the returned receipt and watcher paths belong to this source witness.
 * This receipt belongs to this application, independently
 * of the resident Human inspection server. Package source and compiler output
 * are both retained because linked imports and workers consume different lanes.
 * Maintained source membership follows Git's tracked and untracked files outside
 * ignored runtime output. Emitted modules, assets and public files have separate
 * ordinary filesystem roots; ignoring SDK caches does not omit those inputs.
 * Human's publication lock is an explicit watched input. A pending or retained
 * lock refuses new source admission without replacing the last displayed model.
 *
 * Dependency manifests and the lockfile identify installed versions. This is
 * a declared application disk scope, not a certificate of every SDK file or
 * every transformed browser response. GPU acceptance records those separately.
 *
 * @evidence contracts/common.md#principled-implementation Declared maintained source, emitted modules, data, configuration and version manifests remain separate witnessed inputs; the actual publication lock gates their adoption.
 * @evidence contracts/common.md#clear-and-simple-design One application binding reuses the disk witness and maintained-file reader while keeping source membership and ordinary runtime-output roots explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unresolved publication refuses new candidates without expiring a lock by age or borrowing another host's source authority.
 * @evidence contracts/common.md#meaningful-documentation Names the checkout roots, missing/emitted membership, watcher ownership and limits of SDK/transformed-response coverage.
 */
export function createPlaygroundViewerSource(root: string) {
  const playground = path.join(root, "packages/playground");
  const packages = ["human", "engine", "interface", "viewer", "archetypes", "render"];
  const lockInput = "packages/human/.human-build.lock";
  const publicationLock = path.join(root, lockInput);
  const sourceRoots = [path.join(playground, "src"), ...packages.map((name) => path.join(root, "packages", name, "src"))];
  const source = createViewerDiskSource({
    root,
    directories: [
      path.join(playground, "public"),
      ...packages.flatMap((name) => ["lib", "assets"].map((lane) => path.join(root, "packages", name, lane))),
    ],
    files: () => [...readViewerMaintainedSourceFiles(root, sourceRoots), ...[
      "pnpm-lock.yaml", "pnpm-workspace.yaml", "config/tsconfig.json",
      lockInput,
      "packages/playground/package.json", "packages/playground/tsconfig.json",
      "packages/playground/lint.config.ts", "packages/playground/vite.config.ts",
      ...packages.flatMap((name) => ["package.json", "tsconfig.json"].map((file) => `packages/${name}/${file}`)),
      ...fs.readdirSync(playground).filter((name) => name.endsWith(".html")).map((name) => `packages/playground/${name}`),
    ].map((file) => path.resolve(root, file))],
  });
  // Watching roots admits new members; the source owner rereads membership
  // before publishing their bytes, rather than watching only today's list.
  return {
    ...source,
    current: () => readPlaygroundViewerPublishedSource({
      current: source.current, locked: () => fs.existsSync(publicationLock),
      refresh: () => { source.refresh(); }, lockInput,
    }),
    watched: [...source.watched, ...sourceRoots],
  };
}
