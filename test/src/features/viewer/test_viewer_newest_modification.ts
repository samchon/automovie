import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { newestModification } from "../../../scripts/viewer/newestModification";

/**
 * The newest modification time is the maximum over every file of the tree,
 * however deep, read through an injected file system.
 *
 * Scenarios:
 * 1. A deep file newer than the shallow ones wins, and a newer shallow file
 *    wins over a deeper older one.
 * 2. Negative twin: the newest file of a sibling directory is found as well,
 *    so the walk is not limited to the first branch.
 * 3. An empty tree, and a tree of only empty directories, report null.
 */
export const test_viewer_newest_modification = (): void => {
  const root = path.join("/r");
  const tree = (files: Record<string, number>) => {
    const own = Object.fromEntries(
      Object.entries(files).map(([file, time]) => [path.join(file), time]),
    );
    const directories = new Set<string>([root]);
    for (const file of Object.keys(own))
      for (
        let up = path.dirname(file);
        up !== root && up !== path.dirname(up);
        up = path.dirname(up)
      )
        directories.add(up);
    return {
      readdirSync: (directory: string) => {
        const names = new Set<string>();
        for (const entry of [...Object.keys(own), ...directories])
          if (path.dirname(entry) === directory && entry !== directory)
            names.add(path.basename(entry));
        return [...names].map((name) => ({
          name,
          isDirectory: () => directories.has(path.join(directory, name)),
        }));
      },
      statMtimeMs: (file: string) => own[file],
    };
  };
  TestValidator.equals(
    "deep file wins",
    newestModification(
      root,
      tree({ "/r/a.ts": 10, "/r/d/e/b.ts": 30, "/r/d/c.ts": 20 }),
    ),
    30,
  );
  TestValidator.equals(
    "shallow file wins",
    newestModification(root, tree({ "/r/a.ts": 50, "/r/d/b.ts": 30 })),
    50,
  );
  TestValidator.equals(
    "sibling directory is searched",
    newestModification(root, tree({ "/r/x/a.ts": 10, "/r/y/b.ts": 70 })),
    70,
  );
  TestValidator.equals("empty", newestModification(root, tree({})), null);
  const onlyDirectories = {
    readdirSync: (directory: string) =>
      directory === root ? [{ name: "empty", isDirectory: () => true }] : [],
    statMtimeMs: () => 0,
  };
  TestValidator.equals(
    "only empty directories",
    newestModification(root, onlyDirectories),
    null,
  );
};
