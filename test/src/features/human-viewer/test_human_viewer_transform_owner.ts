import { TestValidator } from "@nestia/e2e";

import { createHumanViewerTransform } from "../../../scripts/human-viewer/createHumanViewerTransform";

/**
 * Only the complete human runtime source owner receives typia generation.
 * Scenarios:
 * 1. Native and slash paths and Vite query suffixes reach the injected transform.
 * 2. Sibling prefixes, declarations, unrelated and non-TypeScript files do not.
 * 3. Source edits and teardown invalidate the owned transform cache.
 */
export async function test_human_viewer_transform_owner(): Promise<void> {
  const called: string[] = [];
  let resets = 0;
  const plugin = createHumanViewerTransform(
    "D:\\repo\\human\\src\\",
    async (id, text) => {
      called.push(id);
      return { code: text + " generated" };
    },
    () => {
      ++resets;
    },
  );
  TestValidator.equals(
    "source",
    await plugin.transform("source", "D:/repo/human/src/face.ts?import"),
    { code: "source generated" },
  );
  await plugin.transform("source", "D:\\repo\\human\\src\\body.ts");
  for (const id of [
    "D:/repo/human/src2/file.ts",
    "D:/repo/human/src/file.d.ts",
    "D:/repo/human/src/file.js",
    "D:/repo/engine/src/file.ts",
  ])
    TestValidator.equals(
      "unselected",
      await plugin.transform("source", id),
      undefined,
    );
  TestValidator.equals("selected", called, [
    "D:/repo/human/src/face.ts",
    "D:/repo/human/src/body.ts",
  ]);
  plugin.watchChange();
  plugin.closeBundle();
  TestValidator.equals("lifecycle", resets, 2);
}
