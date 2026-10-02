import { TestValidator } from "@nestia/e2e";

import { humanViewerPartBookmarks } from "../../../scripts/human-viewer/humanViewerPartBookmarks";
import { openHumanViewerHref } from "../../../scripts/human-viewer/openHumanViewerHref";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";

/**
 * The part gallery's table is well formed and every entry opens a real address.
 *
 * Scenarios:
 * 1. Bookmark identities are unique, every entry names at least one mesh, and
 *    no mesh is listed twice for one document.
 * 2. Each entry's link parses back to its document with exactly its meshes
 *    isolated, so the gallery and the viewer share one address.
 * 3. Its thumbnail is the same isolation as a small clay frame.
 */
export const test_human_viewer_part_bookmarks = (): void => {
  const ids = humanViewerPartBookmarks.map((item) => item.id);
  TestValidator.equals("unique ids", new Set(ids).size, ids.length);
  const pairs = humanViewerPartBookmarks.flatMap((item) =>
    item.meshes.map((mesh) => `${item.doc}/${mesh}`),
  );
  TestValidator.equals("unique meshes", new Set(pairs).size, pairs.length);
  for (const item of humanViewerPartBookmarks) {
    TestValidator.predicate(`${item.id} names meshes`, item.meshes.length !== 0);
    const href = openHumanViewerHref(item.doc, { parts: item.meshes });
    const opened = parseHumanViewerAddress(href.view.slice("/view#".length));
    TestValidator.equals(`${item.id} opens`, [opened.doc, opened.parts], [item.doc, item.meshes]);
    const thumbnail = parseHumanViewerAddress(href.thumbnail.slice("/render?".length));
    TestValidator.equals(`${item.id} thumbnail`, [thumbnail.parts, thumbnail.pass, thumbnail.size], [item.meshes, "clay", 160]);
  }
};
