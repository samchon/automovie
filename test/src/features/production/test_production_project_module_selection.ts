import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { listAutoMovieProjectModules } from "../../../../packages/production/src/production/listAutoMovieProjectModules";

/**
 * Only a project's own loaded modules are selected.
 *
 * The builder evicts this selection before it evaluates source, and the source
 * status reads the same selection afterwards to learn which project files an
 * answer executed. An installed package stays loaded for the life of the
 * process and must never be selected, even when it is installed beneath the
 * project, and nothing outside the project root belongs to it.
 *
 * Scenarios:
 *
 * 1. A shot module and a capture script under the project root are selected, in
 *    their loaded order, including descendant names beginning with two dots.
 * 2. The root itself, a package under the root's `node_modules`, a package under
 *    a nested `node_modules`, a sibling checkout, a path elsewhere on the same
 *    volume, and a path spelled on another Windows drive are not.
 * 3. Empty inventories stay empty and duplicate selected IDs retain loaded order.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual shared project-module predicate and asserts its selected IDs, catching broad two-dot-prefix exclusion without changing parent, sibling or package boundaries.
 * @evidence contracts/testing.md#independent-expectations Native path construction supplies explicit descendants, exact parents, siblings and node_modules segments; the supported lexical descendant policy determines the expected ordered IDs rather than a second implementation of the predicate.
 * @evidence contracts/testing.md#distinguishing-cases Covers ordinary and two-dot descendants, exact root and parent, nested and top-level packages, sibling/foreign paths, an empty population and duplicate IDs. Loader eviction and executed dependency accounting are owned by their build/status tests.
 * @evidence contracts/testing.md#execution-ownership This discoverable exported portable unit passes path strings to the directly imported source; it reads no filesystem, starts no loader or process and dynamically registers no cases.
 */
export function test_production_project_module_selection(): void {
  const root: string = path.join(path.parse(process.cwd()).root, "workspace", "harbor");
  const opening: string = path.join(root, "src", "shots", "opening.ts");
  const capture: string = path.join(root, "scripts", "capture.ts");
  const dotted: string = path.join(root, "..authored", "helper.ts");
  TestValidator.equals(
    "only the project's own modules are selected",
    listAutoMovieProjectModules({
      root,
      loaded: [
        opening,
        root,
        path.join(
          root,
          "node_modules",
          "@automovie",
          "engine",
          "src",
          "index.ts",
        ),
        path.join(
          root,
          "src",
          "vendor",
          "node_modules",
          "left-pad",
          "index.js",
        ),
        capture,
        dotted,
        path.join(root, ".."),
        path.join(root, "..", "harbor-annex", "src", "shots", "opening.ts"),
        path.join(path.parse(root).root, "elsewhere", "helper.ts"),
        "Z:\\cache\\helper.ts",
      ],
    }),
    [opening, capture, dotted],
  );
  TestValidator.equals("empty loader inventory", listAutoMovieProjectModules({ root, loaded: [] }), []);
  TestValidator.equals("duplicate loaded IDs preserve order", listAutoMovieProjectModules({ root, loaded: [dotted, opening, dotted] }), [dotted, opening, dotted]);
}
