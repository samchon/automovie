import {
  builtEnvironmentUnclaimedElements,
  validateBuiltEnvironment,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeProp, primitivePart } from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";

/**
 * The logical-space index names hierarchy roots with no space assignment.
 *
 * Logical spaces index the element hierarchy without having to claim every exterior or structural element. A child remains reachable through its parent, while an unassigned root needs a separate listing.
 *
 * The admitted fixture contains two transform-only roots, claimed and unclaimed, plus unclaimed descendants under both a drawn parent and a group. Rendered model membership cannot substitute for these authored parent/space links.
 *
 * Scenarios:
 *
 * 1. A unit root no space claims is named even though its building unit owns it.
 * 2. A unit root a space claims is not named: that space lists it.
 * 3. An element with a parent is never named, whether or not a space claims it
 *    and whether or not the builder drew its parent, because its parent lists
 *    it.
 * 4. The fixture carrying all three is a legal building, so the rule is read
 *    off a record the engine accepts rather than off an invented one.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates the authored environment and calls the actual unclaimed-element query, requiring exactly the namespaced garden root and excluding each claimed or parented neighbor. It catches listing unassigned descendants as detached roots or silently omitting an unassigned group root.
 * @evidence contracts/testing.md#independent-expectations Literal parent and space links leave garden-wall-root as the sole element with neither a parent nor a space assignment, while its building unit still owns it. The environment id supplies the expected namespace; expected ids do not come from lowered scene output or the query itself.
 * @evidence contracts/testing.md#distinguishing-cases Retains claimed/unclaimed roots, a claimed child, an unassigned child of a drawn model and an unassigned child of a transform-only group in one validator-admitted graph. Invalid parent links, cycles, empty records and ordering across several unclaimed roots are outside this entry.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_architecture_unclaimed_elements entry owns its local cases and uses portable actual validation/query functions plus input builders; it starts no host, process, browser or GPU and builds no artifact.
 */
export function test_architecture_unclaimed_elements(): void {
  const record: IAutoMovieBuiltEnvironment = environment();

  TestValidator.equals(
    "the fixture is a legal building",
    validateBuiltEnvironment({ environment: record }).success,
    true,
  );

  TestValidator.equals(
    "only a root no space claims is left over",
    builtEnvironmentUnclaimedElements(record),
    ["residence/garden-wall-root"],
  );

  TestValidator.equals(
    "every other element is named by something else",
    namedFacts([
      [
        "a root a space claims is not left over",
        (): boolean =>
          builtEnvironmentUnclaimedElements(record).includes(
            "residence/residence-root",
          ) === false,
      ],
      [
        "an unassigned element under a drawn parent is not left over",
        (): boolean =>
          builtEnvironmentUnclaimedElements(record).includes(
            "residence/wall-buttress",
          ) === false,
      ],
      [
        "an unassigned element under a group is not left over either",
        (): boolean =>
          builtEnvironmentUnclaimedElements(record).includes(
            "residence/great-hall-chair-seat",
          ) === false,
      ],
      [
        "and neither is an element a space claims outright",
        (): boolean =>
          builtEnvironmentUnclaimedElements(record).includes(
            "residence/great-hall-chair",
          ) === false,
      ],
    ]),
    {
      "a root a space claims is not left over": true,
      "an unassigned element under a drawn parent is not left over": true,
      "an unassigned element under a group is not left over either": true,
      "and neither is an element a space claims outright": true,
    },
  );
}

const place: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const boxModel: (id: string) => IAutoMovieModel = (
  id: string,
): IAutoMovieModel => ({
  ...makeProp([
    primitivePart(`${id}-box`, { type: "box", width: 1, height: 1, depth: 1 }),
  ]),
  id,
});

/**
 * One residence whose two units answer the rule from both sides.
 *
 * The residence root is claimed by the great hall, while the garden root carries no space. Both are transform-only groups; descendants distinguish hierarchy reach from direct logical-space assignment and drawn-model membership.
 */
const environment: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: "residence",
    units: "meter",
    buildings: [
      { id: "residence", element: "residence-root", space: "great-hall" },
      { id: "garden", element: "garden-wall-root", space: "garden" },
    ],
    models: [boxModel("cube-model")],
    modelReferences: [],
    elements: [
      {
        id: "residence-root",
        kind: "building",
        parent: null,
        transform: place(0, 0, 0),
        model: null,
        space: "great-hall",
      },
      {
        id: "great-hall-chair",
        kind: "furniture",
        parent: "residence-root",
        transform: place(1, 0, 0),
        model: null,
        space: "great-hall",
      },
      {
        id: "great-hall-chair-seat",
        kind: "furniture",
        parent: "great-hall-chair",
        transform: place(1, 0.5, 0),
        model: "cube-model",
        space: null,
      },
      {
        id: "outer-wall",
        kind: "wall",
        parent: "residence-root",
        transform: place(3, 0.5, 0),
        model: "cube-model",
        space: null,
      },
      {
        id: "wall-buttress",
        kind: "structure",
        parent: "outer-wall",
        transform: place(4, 0.5, 0),
        model: "cube-model",
        space: null,
      },
      {
        id: "garden-wall-root",
        kind: "building",
        parent: null,
        transform: place(10, 0, 0),
        model: null,
        space: null,
      },
      {
        id: "garden-wall",
        kind: "wall",
        parent: "garden-wall-root",
        transform: place(10, 0.5, 0),
        model: "cube-model",
        space: null,
      },
    ],
    spaces: [
      { id: "great-hall", kind: "room", parent: null, cells: [] },
      { id: "garden", kind: "room", parent: null, cells: [] },
    ],
    boundaries: [],
    openings: [],
    connectors: [],
    surfaces: [],
    walkable: [],
  });
