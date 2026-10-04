import { TestValidator } from "@nestia/e2e";

import { invalidateHumanViewerGeneration } from "../../../scripts/human-viewer/invalidateHumanViewerGeneration";

/**
 * A type-only edit withdraws all generated runtime schemas of its compiler
 * owner, including modules absent from the changed file's runtime importers.
 *
 * Scenarios:
 * 1. Native paths and query variants are invalidated after compiler reset.
 * 2. Null identities, declarations, siblings and other source owners survive.
 * 3. An empty graph still withdraws the compiler generation.
 */
export const test_human_viewer_generation_invalidation = (): void => {
  const modules: { id: string | null; schema: string }[] = [
    { id: "D:/repo/human/src/builder.ts", schema: "old validator" },
    { id: "D:\\repo\\human\\src\\another.ts?import", schema: "old schema" },
    { id: null, schema: "virtual" },
    { id: "D:/repo/human/src/types.d.ts", schema: "declaration" },
    { id: "D:/repo/human/src/plain.js", schema: "javascript" },
    { id: "D:/repo/human/src2/builder.ts", schema: "sibling" },
    { id: "D:/repo/engine/src/builder.ts", schema: "other owner" },
  ];
  const events: string[] = [];
  const invalidate = (module: (typeof modules)[number]): void => {
    events.push(module.schema);
    module.schema = "withdrawn";
  };
  invalidateHumanViewerGeneration(
    "D:\\repo\\human\\src\\",
    modules,
    () => events.push("compiler reset"),
    invalidate,
  );
  TestValidator.equals("ordered complete owner withdrawal", events, [
    "compiler reset",
    "old validator",
    "old schema",
  ]);
  TestValidator.equals(
    "unrelated modules retained",
    modules.slice(2).map((module) => module.schema),
    ["virtual", "declaration", "javascript", "sibling", "other owner"],
  );
  invalidateHumanViewerGeneration(
    "D:/repo/human/src",
    [],
    () => events.push("empty reset"),
    invalidate,
  );
  TestValidator.equals(
    "empty graph resets generation",
    events[3],
    "empty reset",
  );
  TestValidator.equals("no empty graph invalidation", events.length, 4);
};
