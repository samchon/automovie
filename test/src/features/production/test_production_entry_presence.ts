import { TestValidator } from "@nestia/e2e";
import path from "node:path";
import { readProductionEntryPresence } from "../../../../packages/production/src/production/readProductionEntryPresence";

import { throwsError } from "../internal/predicates";

/**
 * Recovery presence is a physical entry observation, not a nullable text read.
 *
 * Scenarios:
 * 1. Present and absent entries both revalidate current root and parent twice.
 * 2. Root/parent replacement and unreadable entry errors propagate unchanged.
 * 3. Root aliases and lexical escapes are refused before any entry is read.
 *
 * @evidence contracts/testing.md#behavioral-verification Directly calls presence admission and observes its returned boolean and exact capability-call order; throws from either endpoint guard or entry observation must propagate while both presence outcomes remain valid.
 * @evidence contracts/testing.md#independent-expectations A literal five-event contract defines bracketing independently, and injected semantic facts define true/false presence and failure positions. This pins portable capability semantics rather than native link or namespace behavior.
 * @evidence contracts/testing.md#distinguishing-cases Present/absent are positive neighbors, root equality/parent/absolute escapes are negatives, and first/second guard plus one entry failure positions cover both endpoints. Native filesystem incarnation/path checks remain with project owning tests.
 * @evidence contracts/testing.md#execution-ownership The named unit owns all loops and calls the maintained supplied-capability seam without replacing globals, foreign methods or starting a native host; direct source import preserves configured compilation.
 */
export function test_production_entry_presence(): void {
  const root: string = path.resolve("entry-project");
  for (const present of [false, true]) {
    const events: string[] = [];
    const result: boolean = readProductionEntryPresence({
      root,
      relative: "docs/models/hero.review.json.pending",
      assertCurrent: (): void => {
        events.push("current");
      },
      assertParent: (parent: string): void => {
        events.push(
          `parent:${path.relative(root, parent).split(path.sep).join("/")}`,
        );
      },
      exists: (file: string): boolean => {
        events.push(`entry:${path.basename(file)}`);
        return present;
      },
    });
    TestValidator.equals("actual presence retained", result, present);
    TestValidator.equals("observation is bracketed", events, [
      "current",
      "parent:docs/models",
      "entry:hero.review.json.pending",
      "parent:docs/models",
      "current",
    ]);
  }
  const props: Parameters<typeof readProductionEntryPresence>[0] = {
    root,
    relative: "docs/pending",
    assertCurrent: (): void => {},
    assertParent: (_parent: string): void => {},
    exists: (_file: string): boolean => false,
  };
  for (const relative of [
    ".",
    "..",
    "../outside",
    path.resolve(root, "../outside"),
  ])
    TestValidator.predicate(
      "escape rejected",
      throwsError((): boolean => readProductionEntryPresence({ ...props, relative })),
    );
  for (const point of ["assertCurrent", "assertParent", "exists"] as const)
    for (const failAt of point === "exists" ? [1] : [1, 2]) {
      let calls: number = 0;
      TestValidator.predicate(
        `${point} failure ${failAt} propagates`,
        throwsError((): boolean =>
          readProductionEntryPresence({
            ...props,
            [point]: (): boolean => {
              if (++calls === failAt) throw new Error("changed or unreadable");
              return false;
            },
          }),
        ),
      );
    }
}
