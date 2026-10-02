import { TestValidator } from "@nestia/e2e";

import { createHumanViewerThumbnailStore } from "../../../scripts/human-viewer/createHumanViewerThumbnailStore";
import { createNodeHumanViewerThumbnailDisk } from "../../../scripts/human-viewer/createNodeHumanViewerThumbnailDisk";
import { waitForHumanViewerGeneration } from "../../../scripts/human-viewer/waitForHumanViewerGeneration";

/**
 * The thumbnail folder answers a missing picture with the newest older one,
 * prunes the rest, and a generation wait is bounded.
 *
 * Scenarios:
 * 1. A thumbnail the current revision lacks is found in the newest older
 *    revision that has it, not in an older one, and null when none has it.
 * 2. Prune removes every directory except the current and the newest older one.
 * 3. The Node disk lists directories with their times, treats a missing folder
 *    as empty, and forwards existence and removal to the filesystem.
 * 4. The generation wait returns at once when ready (one trailing step) and
 *    stops at its limit when the source never settles.
 */
export const test_human_viewer_thumbnail_store = async (): Promise<void> => {
  const files = new Set(["t/aaaa/x.png", "t/bbbb/x.png", "t/cccc/y.png"]);
  const removed: string[] = [];
  const store = createHumanViewerThumbnailStore(
    {
      directories: () => [
        { name: "aaaa", mtimeMs: 1 },
        { name: "bbbb", mtimeMs: 2 },
        { name: "cccc", mtimeMs: 3 },
        { name: "current000000000", mtimeMs: 4 },
      ],
      exists: (file) => files.has(file),
      remove: (path) => {
        removed.push(path);
      },
    },
    "t",
    (...parts) => parts.join("/"),
  );
  const revision = "current0000000000ffff";
  TestValidator.equals("newest older that has it", store.stale("t/current0000000000/x.png", revision), "t/bbbb/x.png");
  TestValidator.equals("only the oldest has it", store.stale("t/current0000000000/z.png", revision), null);
  TestValidator.equals("windows separators", store.stale("t\\current0000000000\\y.png", revision), "t/cccc/y.png");
  store.prune(revision);
  TestValidator.equals("prune", removed, ["t/aaaa", "t/bbbb"]);
  const calls: string[] = [];
  const disk = createNodeHumanViewerThumbnailDisk(
    {
      existsSync: (path) => path === "folder",
      readdirSync: () => [{ name: "rev" }],
      statSync: (path) => ({ mtimeMs: path.length }),
      rmSync: (path) => {
        calls.push(path);
      },
    },
    (...parts) => parts.join("/"),
  );
  TestValidator.equals("directories", disk.directories("folder"), [{ name: "rev", mtimeMs: "folder/rev".length }]);
  TestValidator.equals("missing folder", disk.directories("other"), []);
  TestValidator.equals("exists", [disk.exists("folder"), disk.exists("x")], [true, false]);
  disk.remove("folder/rev");
  TestValidator.equals("remove", calls, ["folder/rev"]);
  let pauses = 0;
  await waitForHumanViewerGeneration(() => true, async () => {
    ++pauses;
  });
  TestValidator.equals("ready waits one step", pauses, 1);
  pauses = 0;
  await waitForHumanViewerGeneration(() => false, async () => {
    ++pauses;
  }, 500, 100);
  TestValidator.equals("limit", pauses, 6);
};
