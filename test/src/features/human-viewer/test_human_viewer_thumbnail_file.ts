import { TestValidator } from "@nestia/e2e";

import { humanViewerThumbnailFile } from "../../../scripts/human-viewer/humanViewerThumbnailFile";

/**
 * Thumbnail identity follows render inputs and numerical document authority.
 *
 * Scenarios:
 * 1. Queue lanes share one frame identity while camera and source changes do not.
 * 2. Unknown documents, invalid addresses and an empty inventory refuse a path.
 */
export const test_human_viewer_thumbnail_file = (): void => {
  const inventory = { revision: "display-one", documents: [{ id: "neutral", key: "basis-one" }] };
  const identify = (search: string): string | null =>
    humanViewerThumbnailFile(search, "local-thumbnails", inventory);
  const first = identify("doc=neutral&size=320&lane=bulk");
  TestValidator.predicate("published frame has path", first !== null);
  TestValidator.equals("lane does not change pixels", first,
    identify("doc=neutral&size=320&lane=ui"));
  TestValidator.predicate("view changes frame key", first !==
    identify("doc=neutral&size=320&view=left"));
  TestValidator.predicate("size changes frame key", first !==
    identify("doc=neutral&size=900"));
  inventory.revision = "display-two";
  TestValidator.predicate("display source changes frame key", first !==
    identify("doc=neutral&size=320"));
  const afterDisplay = identify("doc=neutral&size=320");
  inventory.documents[0].key = "basis-two";
  TestValidator.predicate("new numerical result changes authority", afterDisplay !==
    identify("doc=neutral&size=320"));
  TestValidator.equals("unknown document", identify("doc=missing"), null);
  TestValidator.equals("invalid address", identify("doc=neutral&size=-1"), null);
  TestValidator.equals("empty inventory", humanViewerThumbnailFile(
    "doc=neutral", "local-thumbnails", { revision: "display", documents: [] }), null);
};
