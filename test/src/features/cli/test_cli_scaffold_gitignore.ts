import {
  planScaffoldPublication,
  renderScaffoldEntries,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { throwsError } from "../internal/predicates";

/**
 * A pack-safe source marker installs Git's root ignore file without changing
 * authored nested names or granting publication outside the project. Legacy
 * callers may still supply `.gitignore`; two owners of that output refuse.
 *
 * Scenarios:
 *
 * 1. Root marker, ordinary filename and nested marker map independently while
 *    payload substitution and LF normalization preserve caller-owned rules.
 * 2. A legacy ignore file and explicit relative root marker retain their
 *    documented output identities without mutating the source inputs.
 * 3. Competing root identities refuse in either input order, unknown payloads
 *    refuse rendering, and an escaped nested marker refuses publication.
 */
export const test_cli_scaffold_gitignore = (): void => {
  const entries = [
    { relative: "_gitignore", content: "deps/\r\n{{private}}\r\n" },
    { relative: "README.md", content: "project" },
    { relative: "nested/_gitignore", content: "nested-owned/\n" },
  ];
  const original = structuredClone(entries);
  TestValidator.equals(
    "only the root source marker becomes the Git ignore file",
    { ...renderScaffoldEntries(entries, { private: "private-owned/" }) },
    {
      ".gitignore": "deps/\nprivate-owned/\n",
      "README.md": "project",
      "nested/_gitignore": "nested-owned/\n",
    },
  );
  TestValidator.equals(
    "source owners retain their input rules",
    entries,
    original,
  );
  for (const relative of [".gitignore", "./_gitignore"])
    TestValidator.equals(
      "legacy and explicit root identities preserve authored content",
      {
        ...renderScaffoldEntries(
          [{ relative, content: "customer-owned/\n" }],
          {},
        ),
      },
      { ".gitignore": "customer-owned/\n" },
    );
  const competing = [
    { relative: "_gitignore", content: "template/\n" },
    { relative: ".gitignore", content: "customer/\n" },
  ];
  for (const order of [competing, [...competing].reverse()])
    TestValidator.predicate(
      "two source owners cannot overwrite one ignore identity",
      throwsError(
        () => renderScaffoldEntries(order, {}),
        ["collide at rendered path", '".gitignore"', '"_gitignore"'],
      ),
    );
  TestValidator.predicate(
    "unknown ignore payload variables remain refusals",
    throwsError(
      () =>
        renderScaffoldEntries(
          [{ relative: "_gitignore", content: "{{missing}}" }],
          {},
        ),
      ["unknown scaffold variable"],
    ),
  );
  const escaped = renderScaffoldEntries(
    [{ relative: "../_gitignore", content: "outside/\n" }],
    {},
  );
  TestValidator.predicate(
    "marker mapping does not admit an escaped publication target",
    throwsError(() =>
      planScaffoldPublication({
        files: escaped,
        root: path.resolve("synthetic-ignore-root"),
      }),
    ),
  );
};
