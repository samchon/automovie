import { builtEnvironmentDescendantSpaces } from "../../../../packages/engine/src/architecture/builtEnvironmentDescendantSpaces";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { boxCell, originTransform } from "../internal/envelopeFixtures";
import { namedFacts, throwsError } from "../internal/predicates";

/**
 * Query a stable-id logical subtree in code-unit order and refuse an undeclared root.
 *
 * Scenarios:
 * 1. A root names itself and everything beneath it, at every depth.
 * 2. A leaf names only itself, so descent has a floor rather than an exception.
 * 3. An intermediate space names its own subtree and nothing above or beside it.
 * 4. The order is code-unit order rather than authored order, so two callers comparing populations compare the same list.
 * 5. A space the record does not hold is refused by name rather than answered with an empty subtree, which would read as a real room containing nothing.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls builtEnvironmentDescendantSpaces for house, upper, gallery and the missing cellar, comparing the complete sorted root list, joined middle/leaf lists and named throw fragments. A one-level walk, authored-order output or ancestor/sibling inclusion changes these observations.
 * @evidence contracts/testing.md#independent-expectations The authored parent links place wing/hall under house and attic/gallery under upper, so explicit expected root, middle and leaf lists follow the graph without calling another descendant fold.
 * @evidence contracts/testing.md#distinguishing-cases Root, intermediate and singleton leaf populations plus unknown-space refusal separate descent from authored order and ancestor/sibling inclusion; cyclic graph admission belongs to building validation.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_descendant_spaces imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_descendant_spaces(): void {
  const record: IAutoMovieBuiltEnvironment = storeys();

  TestValidator.equals("a root names its whole subtree in code-unit order", builtEnvironmentDescendantSpaces(record, "house"), ["attic", "gallery", "hall", "house", "upper", "wing"]);

  TestValidator.equals(
    "descent has a floor and a middle, and refuses what it does not hold",
    namedFacts([
      [
        "a leaf names only itself",
        (): boolean =>
          builtEnvironmentDescendantSpaces(record, "gallery").join(",") ===
          "gallery",
      ],
      [
        "an intermediate space names its own subtree alone",
        (): boolean =>
          builtEnvironmentDescendantSpaces(record, "upper").join(",") ===
          "attic,gallery,upper",
      ],
      [
        "and an absent space is refused by name",
        (): boolean =>
          throwsError(
            (): string[] => builtEnvironmentDescendantSpaces(record, "cellar"),
            ["storeys", "cellar"],
          ),
      ],
    ]),
    {
      "a leaf names only itself": true,
      "an intermediate space names its own subtree alone": true,
      "and an absent space is refused by name": true,
    },
  );
}

/**
 * One unit whose spaces nest three deep and are authored out of order.
 *
 * `wing` and `hall` sit directly under the root, `upper` above `hall`, and `attic` and `gallery` above `upper`, so a fold that stopped at one level or kept authored order would answer differently from this one.
 */
const storeys: () => IAutoMovieBuiltEnvironment = (): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "storeys",
  units: "meter",
  buildings: [{ id: "house", element: "house-root", space: "house" }],
  models: [],
  modelReferences: [],
  elements: [
    {
      id: "house-root",
      kind: "building",
      parent: null,
      transform: originTransform(),
      model: null,
      space: "house",
    },
  ],
  spaces: [
    { id: "wing", kind: "zone", parent: "house", cells: [] },
    { id: "gallery", kind: "room", parent: "upper", cells: [] },
    { id: "attic", kind: "room", parent: "upper", cells: [] },
    {
      id: "house",
      kind: "building",
      parent: null,
      cells: [boxCell("shell", { x: 0, y: 0, z: 0 }, { x: 8, y: 9, z: 8 })],
    },
    { id: "upper", kind: "storey", parent: "hall", cells: [] },
    { id: "hall", kind: "storey", parent: "house", cells: [] },
  ],
  boundaries: [],
  openings: [],
  connectors: [],
  surfaces: [],
  walkable: [],
});
