import { TestValidator } from "@nestia/e2e";
import {
  type IAutoMovieMaintenanceDirectoryIO,
  assertAutoMovieMaintenanceMarkdownInventory,
  readAutoMovieDeliveryMaintenanceMarkdownPaths,
  readAutoMovieMaintenanceMarkdownPaths,
} from "automovie";
import path from "node:path";

import { throwsError } from "../internal/predicates";

/**
 *
 * A directory-only walk rejects aliases and closes added/removed siblings.
 *
 * Scenarios:
 * 1. Nested, missing, and non-Markdown entries determine the exact input set.
 * 2. Changed inventories, aliases, escapes, and failed observations refuse.
 * 3. Delivery maintenance includes final screenplays at both observation points.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `readAutoMovieMaintenanceMarkdownPaths`, `readAutoMovieDeliveryMaintenanceMarkdownPaths` and `assertAutoMovieMaintenanceMarkdownInventory` through an `IAutoMovieMaintenanceDirectoryIO` fake and asserts the returned `/`-separated path lists, the number of directory re-checks, and refusals; it catches listing order leaking into the result, a `.ts` file or an `other` entry counted as Markdown, a missing directory treated as an error, a followed link or a parent whose real path leaves the root, a slash or NUL in a child name, a non-`ENOENT` capture failure read as absence, the final screenplay pass left out of delivery, and an added, removed or reordered member accepted.
 * @evidence contracts/testing.md#independent-expectations Expected lists are the fake tree's Markdown files written by hand in name order with nested directories expanded where they sort; delivery order is the three documented layers. The re-check floor of more than ten comes from the rule that no replaced ancestor may be followed: six listed entries under two directories each need the root and their parent confirmed, twelve checks at least; it proves repetition but not that every entry is guarded. Refusals are detected as thrown errors without pinning messages.
 * @evidence contracts/testing.md#distinguishing-cases Positive: two Markdown files, a nested directory, a non-Markdown file and an `other` entry; a missing directory and absent delivery layers yield empty lists; an identical inventory passes. Negative: empty, extended and reordered inventories, four escaping relatives (`.`, `..`, `../outside`, an absolute path outside), six invalid child names, a linked entry, a linked parent, a failing root assertion, a denied capture, and a final-screenplay sibling added between plan and publication. Per-file byte and generation checks belong to test_cli_contract_maintenance_observation.
 */
export const test_cli_maintenance_markdown_inventory = (): void => {
  const root = {
    path: path.resolve("maintenance-project"),
    real: path.resolve("maintenance-project"),
    identity: "root",
  };
  const entries = new Map<
    string,
    ReturnType<IAutoMovieMaintenanceDirectoryIO["list"]>
  >([
    [
      path.join(root.path, "docs"),
      [
        { name: "b.md", kind: "file" },
        { name: "a.md", kind: "file" },
        { name: "extra", kind: "directory" },
        { name: "ignored.ts", kind: "file" },
        { name: "other", kind: "other" },
      ],
    ],
    [path.join(root.path, "docs", "extra"), [{ name: "c.md", kind: "file" }]],
  ]);
  let assertions = 0;
  const io: IAutoMovieMaintenanceDirectoryIO = {
    assert: () => {
      assertions++;
    },
    capture: (target) => {
      if (!entries.has(target))
        throw Object.assign(new Error("absent"), { code: "ENOENT" });
      return { path: target, real: target, identity: target };
    },
    list: (directory) => entries.get(directory)!,
  };
  const files = readAutoMovieMaintenanceMarkdownPaths(root, "docs", io);
  TestValidator.equals("deterministic nested inventory", files, [
    "docs/a.md",
    "docs/b.md",
    "docs/extra/c.md",
  ]);
  TestValidator.predicate(
    "root and parents repeatedly checked",
    assertions > 10,
  );
  TestValidator.equals(
    "missing ordinary directory is empty",
    readAutoMovieMaintenanceMarkdownPaths(root, "missing", io),
    [],
  );
  assertAutoMovieMaintenanceMarkdownInventory(files, [...files]);
  for (const changed of [
    [],
    [...files, "docs/new.md"],
    [files[1]!, files[0]!, files[2]!],
  ])
    TestValidator.predicate(
      "population change refuses",
      throwsError(() =>
        assertAutoMovieMaintenanceMarkdownInventory(files, changed),
      ),
    );
  for (const relative of [
    ".",
    "..",
    "../outside",
    path.resolve(root.path, "../outside"),
  ])
    TestValidator.predicate(
      "lexical escape refuses",
      throwsError(() =>
        readAutoMovieMaintenanceMarkdownPaths(root, relative, io),
      ),
    );
  for (const name of ["", ".", "..", "a/b", "a\\b", "a\0b"])
    TestValidator.predicate(
      "invalid child refuses",
      throwsError(() =>
        readAutoMovieMaintenanceMarkdownPaths(root, "docs", {
          ...io,
          list: () => [{ name, kind: "file" }],
        }),
      ),
    );
  TestValidator.predicate(
    "linked entry refuses",
    throwsError(() =>
      readAutoMovieMaintenanceMarkdownPaths(root, "docs", {
        ...io,
        list: () => [{ name: "dangling", kind: "link" }],
      }),
    ),
  );
  TestValidator.predicate(
    "linked parent refuses",
    throwsError(() =>
      readAutoMovieMaintenanceMarkdownPaths(root, "docs", {
        ...io,
        capture: (target) => ({
          path: target,
          real: path.resolve(root.path, "../elsewhere"),
          identity: "other",
        }),
      }),
    ),
  );
  TestValidator.predicate(
    "changed physical root refuses",
    throwsError(() =>
      readAutoMovieMaintenanceMarkdownPaths(root, "docs", {
        ...io,
        assert: () => {
          throw new Error("changed");
        },
      }),
    ),
  );
  TestValidator.predicate(
    "capture failure is not absence",
    throwsError(() =>
      readAutoMovieMaintenanceMarkdownPaths(root, "docs", {
        ...io,
        capture: () => {
          throw new Error("denied");
        },
      }),
    ),
  );
  TestValidator.equals(
    "absent delivery populations are empty",
    readAutoMovieDeliveryMaintenanceMarkdownPaths(root, io),
    [],
  );
  for (const layer of ["scripts", "screenplays", "final/screenplays"])
    entries.set(path.join(root.path, "docs", layer), [
      { name: "index.md", kind: "file" },
    ]);
  const delivery = readAutoMovieDeliveryMaintenanceMarkdownPaths(root, io);
  TestValidator.equals("all delivery passes participate", delivery, [
    "docs/scripts/index.md",
    "docs/screenplays/index.md",
    "docs/final/screenplays/index.md",
  ]);
  entries.set(path.join(root.path, "docs/final/screenplays"), [
    { name: "index.md", kind: "file" },
    { name: "new.md", kind: "file" },
  ]);
  TestValidator.predicate(
    "final sibling cannot appear between plan and publication",
    throwsError(() =>
      assertAutoMovieMaintenanceMarkdownInventory(
        delivery,
        readAutoMovieDeliveryMaintenanceMarkdownPaths(root, io),
      ),
    ),
  );
};
