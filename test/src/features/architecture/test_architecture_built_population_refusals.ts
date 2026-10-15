import { validateBuiltEnvironment } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
  IAutoMovieInstanceSetDesign,
} from "@automovie/interface";

import { assertArchitectureBuiltPopulationRefusalsPart1 } from "../internal/assertArchitectureBuiltPopulationRefusalsPart1";
import { assertArchitectureBuiltPopulationRefusalsPart2 } from "../internal/assertArchitectureBuiltPopulationRefusalsPart2";
import { assertArchitectureBuiltPopulationRefusalsPart3 } from "../internal/assertArchitectureBuiltPopulationRefusalsPart3";
import { assertArchitectureBuiltPopulationRefusalsPart4 } from "../internal/assertArchitectureBuiltPopulationRefusalsPart4";
import { hasViolation } from "../internal/predicates";

const population: (
  input?: Partial<IAutoMovieInstanceSetDesign>,
  space?: string,
  prototypeBounds?: IAutoMovieBuiltPopulation["prototypeBounds"],
) => IAutoMovieBuiltPopulation = (
  input: Partial<IAutoMovieInstanceSetDesign> = {},
  space: string = "place",
  prototypeBounds: IAutoMovieBuiltPopulation["prototypeBounds"] = {
    min: { x: -0.5, y: 0, z: -0.5 },
    max: { x: 0.5, y: 1, z: 0.5 },
  },
): IAutoMovieBuiltPopulation => ({
  space,
  prototypeBounds,
  set: {
    id: "casks",
    model: "cask",
    count: 4,
    layout: { kind: "grid", rows: 2, columns: 2, spacing: { x: 1, z: 1 } },
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    seed: 3,
    variation: { scale: { min: 1, max: 1 }, palette: ["#808080"], traits: [] },
    ...input,
  },
});

const work: (
  populations: IAutoMovieBuiltPopulation[],
) => IAutoMovieBuiltEnvironment = (
  populations: IAutoMovieBuiltPopulation[],
): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "work",
  units: "meter",
  buildings: [{ id: "unit", element: "root", space: "place" }],
  models: [],
  modelReferences: [],
  elements: [
    {
      id: "root",
      kind: "building",
      parent: null,
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      model: null,
      space: "place",
    },
  ],
  populations,
  spaces: [{ id: "place", kind: "building", parent: null, cells: [] }],
  boundaries: [],
  openings: [],
  connectors: [],
  surfaces: [],
  walkable: [],
});

const refuses: (
  populations: IAutoMovieBuiltPopulation[],
  path: string,
  kind?: "type" | "range",
) => boolean = (
  populations: IAutoMovieBuiltPopulation[],
  path: string,
  kind: "type" | "range" = "range",
): boolean =>
  hasViolation(
    validateBuiltEnvironment({ environment: work(populations) }),
    kind,
    path,
  );

/**
 * Validate the building-owned subset of population identity, membership, prototype bounds and placement arithmetic.
 *
 * Scenarios:
 * 1. A population naming a space the record never declared is refused, because nothing could ever fold it in.
 * 2. A blank identity and a repeated one are both refused: two populations answering to one name cannot be told apart by the node listing that names them.
 * 3. A prototype-local box may collapse onto an axis or a point, but an inverted or non-finite axis is refused.
 * 4. `along-route` is refused by layout kind. A route is a production-world fact and this record carries no field that reaches one.
 * 5. The facts every layout needs are checked: a non-integer or non-positive slot count, a non-finite anchor, a non-finite heading, and a non-positive scatter radius.
 * 6. Scale ranges are finite, positive and ordered; rotation ranges are finite and ordered, with negative rotations allowed.
 * 7. A grid refuses rows zero, columns NaN, X spacing zero, Z spacing NaN and insufficient capacity. The malformed column case must not add a whole-layout capacity complaint.
 * 8. A lattice's extra axis is checked the same way, layers and rise together.
 * 9. An explicit block must state one transform per slot, and each translation, rotation, and scale must be usable by the local-to-world bounds fold.
 * 10. A well-formed population, including a point-like prototype, validates, so none of the above passes by refusing everything.
 * 11. The population query refuses an undeclared space id by its existing message fragment.
 *
 * @evidence contracts/testing.md#behavioral-verification The four ordered parts call validateBuiltEnvironment and the population query using this entry's authored builders. Validation kind/path membership, clean ordinary/point baselines, capacity-diagnostic exclusion, owned set count and unknown-id throw distinguish specific malformed placement fields from blanket refusal; paths may have other findings beside the required one.
 * @evidence contracts/testing.md#independent-expectations A hand-authored four-slot grid supplies the coherent baseline; each existing mutation names its literal required kind/path, and NaN columns must not also emit the whole-layout capacity path. Point bounds remain admitted, rotation (0,0,0,2) fails unit norm and a three-slot explicit count with one transform is incomplete. Expected diagnostics do not come from the validator's current output, and the query observes set count rather than complete returned record identity.
 * @evidence contracts/testing.md#distinguishing-cases Unknown/duplicate/blank set identity, inverted/nonfinite versus point bounds, route layout, count/anchor/heading, scale/rotation intervals, grid/lattice capacity and explicit count/translation/rotation/scale retain their original refusing and working cases. Seed, jitter, explicit transform-id uniqueness and the full production model/variation schema are outside these assertions.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_built_population_refusals is the discoverable entry and owns the ordered cases delegated to assertArchitectureBuiltPopulationRefusalsPart1, assertArchitectureBuiltPopulationRefusalsPart2, assertArchitectureBuiltPopulationRefusalsPart3, assertArchitectureBuiltPopulationRefusalsPart4; those helpers are called explicitly, with no dynamic registration, native artifact build, process, browser or GPU host.
 */
export function test_architecture_built_population_refusals(): void {
  assertArchitectureBuiltPopulationRefusalsPart1(population, work, refuses);
  assertArchitectureBuiltPopulationRefusalsPart2(population, refuses);
  assertArchitectureBuiltPopulationRefusalsPart3(population, work, refuses);
  assertArchitectureBuiltPopulationRefusalsPart4(population, work, refuses);
}
