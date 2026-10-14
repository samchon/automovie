import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtEnvironmentElementPartBounds } from "@automovie/engine";
import { originTransform } from "../internal/envelopeFixtures";
import { makeProp, primitivePart } from "../internal/fixtures";
import { namedFacts, vclose } from "../internal/predicates";

/**
 * Read per-part element boxes and distinguish a working box from undeclared and transform-only null results.
 *
 * Scenarios:
 * 1. An element the record does not hold answers `null`.
 * 2. A group element that stages no model answers `null` for the other reason.
 * 3. A placed unit box answers with the half-metre reach its own placement puts it at, so the refusals are read against a working positive rather than against a record nothing works on.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls builtEnvironmentElementPartBounds for crate, the actual modelless yard-root and the undeclared nowhere id. One returned part box with the selected min/max and the two null results expose omitted placement, invented group geometry or a lookup that fails for every input; no validation success or rendered box is asserted.
 * @evidence contracts/testing.md#independent-expectations The authored unit cube at (2,0,3) reaches (1.5,-0.5,2.5)..(2.5,0.5,3.5) under the original vclose tolerance, and its single drawn part determines count one. Explicit model-null and absent-id records determine the two null controls independently of the product's returned boxes.
 * @evidence contracts/testing.md#distinguishing-cases One drawn part, a real modelless grouping element and an unknown id preserve both absence paths; external-reference origin fallback and animated bones are outside this case.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_element_part_bounds_refusals imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_element_part_bounds_refusals(): void {
  const record: IAutoMovieBuiltEnvironment = pair();
  const drawn: IAutoMovieSubjectBox[] | null =
    builtEnvironmentElementPartBounds(record, "crate");

  TestValidator.equals(
    "a placed unit box reports the one box its own part fills",
    namedFacts([
      [
        "it reports one part",
        (): boolean => drawn !== null && drawn.length === 1,
      ],
      [
        "reaching half a metre either side of its placement",
        (): boolean =>
          drawn !== null &&
          vclose(drawn[0]!.min, { x: 1.5, y: -0.5, z: 2.5 }) &&
          vclose(drawn[0]!.max, { x: 2.5, y: 0.5, z: 3.5 }),
      ],
    ]),
    {
      "it reports one part": true,
      "reaching half a metre either side of its placement": true,
    },
  );

  TestValidator.equals(
    "an undeclared element and a group that draws nothing both answer null",
    {
      undeclared: builtEnvironmentElementPartBounds(record, "nowhere"),
      group: builtEnvironmentElementPartBounds(record, "yard-root"),
    },
    { undeclared: null, group: null },
  );
}

/** One unit box model, placed once under a group that draws nothing itself. */
const pair: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: "yard",
    units: "meter",
    buildings: [{ id: "yard", element: "yard-root", space: "yard-space" }],
    models: [box("crate-model")],
    modelReferences: [],
    elements: [
      {
        id: "yard-root",
        kind: "building",
        parent: null,
        transform: originTransform(),
        model: null,
        space: "yard-space",
      },
      {
        id: "crate",
        kind: "prop",
        parent: "yard-root",
        transform: {
          translation: { x: 2, y: 0, z: 3 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        model: "crate-model",
        space: null,
      },
    ],
    spaces: [{ id: "yard-space", kind: "zone", parent: null, cells: [] }],
    boundaries: [],
    openings: [],
    connectors: [],
    surfaces: [],
    walkable: [],
  });

/** A one-metre cube whose single part is named for readable expectations. */
const box: (id: string) => IAutoMovieModel = (id: string): IAutoMovieModel => ({
  ...makeProp([
    primitivePart("block", { type: "box", width: 1, height: 1, depth: 1 }),
  ]),
  id,
});
