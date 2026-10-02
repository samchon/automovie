import { TestValidator } from "@nestia/e2e";

import { humanViewerThumbnailFile } from "../../../scripts/human-viewer/humanViewerThumbnailFile";
import {
  humanViewerThumbnailDirectory,
  planHumanViewerThumbnailPrune,
} from "../../../scripts/human-viewer/planHumanViewerThumbnailPrune";

/**
 * Thumbnails live in a directory of their revision and older ones are pruned.
 *
 * Scenarios:
 * 1. The directory is the first sixteen digits of the revision, and a
 *    thumbnail path sits inside exactly that directory.
 * 2. The current directory and the newest older one are kept; every other
 *    directory and flat file of the earlier layout is stale.
 */
export const test_human_viewer_thumbnail_prune = (): void => {
  const revision = "0123456789abcdef0123456789abcdef";
  TestValidator.equals("directory", humanViewerThumbnailDirectory(revision), "0123456789abcdef");
  const file = humanViewerThumbnailFile("doc=neutral", "store", {
    revision,
    documents: [{ id: "neutral", key: "k" }],
  })!;
  TestValidator.predicate("inside the revision directory", file.replaceAll("\\", "/").includes("/0123456789abcdef/"));
  const at = (name: string, mtimeMs: number) => ({ name, mtimeMs });
  TestValidator.equals(
    "stale set keeps the current and the newest older directory",
    planHumanViewerThumbnailPrune(
      [at("0123456789abcdef", 5), at("aaaaaaaaaaaaaaaa", 4), at("bbbbbbbbbbbbbbbb", 3), at("old.png", 1)],
      revision,
    ),
    ["bbbbbbbbbbbbbbbb", "old.png"],
  );
  TestValidator.equals("only current", planHumanViewerThumbnailPrune([at("0123456789abcdef", 5)], revision), []);
  TestValidator.equals("current and one older", planHumanViewerThumbnailPrune([at("0123456789abcdef", 5), at("aaaaaaaaaaaaaaaa", 4)], revision), []);
  TestValidator.equals("empty folder", planHumanViewerThumbnailPrune([], revision), []);
};
