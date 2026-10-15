import {
  type IAutoMovieSubjectContribution,
  builtEnvironmentSpaceContentBounds,
  builtEnvironmentSpaceFidelity,
  builtEnvironmentSpaceNodes,
  builtEnvironmentSpacePopulations,
  lowerBuiltEnvironment,
  validateBuiltEnvironment,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
  IAutoMovieConvexSpaceCell,
  IAutoMovieInstanceSetDesign,
  IAutoMovieModel,
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeProp, primitivePart } from "../internal/fixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";

const place: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const box: (
  id: string,
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
) => IAutoMovieConvexSpaceCell = (
  id: string,
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
): IAutoMovieConvexSpaceCell => ({
  id,
  planes: [
    { normal: { x: 1, y: 0, z: 0 }, offset: max.x },
    { normal: { x: -1, y: 0, z: 0 }, offset: -min.x },
    { normal: { x: 0, y: 1, z: 0 }, offset: max.y },
    { normal: { x: 0, y: -1, z: 0 }, offset: -min.y },
    { normal: { x: 0, y: 0, z: 1 }, offset: max.z },
    { normal: { x: 0, y: 0, z: -1 }, offset: -min.z },
  ],
});

const unitBox: (id: string) => IAutoMovieModel = (
  id: string,
): IAutoMovieModel => ({
  ...makeProp([
    primitivePart("block", { type: "box", width: 1, height: 1, depth: 1 }),
  ]),
  id,
});

/** One compact field laid on a whole-metre grid, so every bound is arithmetic. */
const field: (input: {
  id: string;
  space: string;
  anchor: IAutoMovieVector3;
  columns: number;
  rows: number;
  count: number;
  spacing: { x: number; z: number };
}) => IAutoMovieBuiltPopulation = (input: {
  id: string;
  space: string;
  anchor: IAutoMovieVector3;
  columns: number;
  rows: number;
  count: number;
  spacing: { x: number; z: number };
}): IAutoMovieBuiltPopulation => ({
  space: input.space,
  prototypeBounds: {
    min: { x: -0.5, y: 0, z: -0.5 },
    max: { x: 0.5, y: 1, z: 0.5 },
  },
  set: {
    id: input.id,
    model: `${input.id}-model`,
    count: input.count,
    layout: {
      kind: "grid",
      rows: input.rows,
      columns: input.columns,
      spacing: input.spacing,
    },
    anchor: input.anchor,
    facingDeg: 0,
    seed: 7,
    variation: {
      scale: { min: 1, max: 1 },
      palette: ["#808080"],
      traits: [],
    },
  } satisfies IAutoMovieInstanceSetDesign,
});

/**
 * A residence whose rooms are furnished by populations as much as by elements.
 *
 * Every population is a whole-metre grid centred on its own anchor, so each expected box is hand arithmetic over `(column - (columns - 1) / 2) * spacing.x` and `row * spacing.z` rather than a transcript of what the query printed.
 */
const residence: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: "residence",
    units: "meter",
    buildings: [
      { id: "residence-unit", element: "residence-root", space: "residence" },
    ],
    models: [unitBox("stone")],
    modelReferences: [],
    elements: [
      {
        id: "residence-root",
        kind: "building",
        parent: null,
        transform: place(0, 0, 0),
        model: null,
        space: "residence",
      },
      {
        id: "hall-table",
        kind: "furniture",
        parent: "residence-root",
        transform: place(5, 0.5, 4),
        model: "stone",
        space: "great-hall",
      },
      {
        id: "solar-chest",
        kind: "furniture",
        parent: "residence-root",
        transform: place(15, 0.5, 4),
        model: "stone",
        space: "solar",
      },
    ],
    populations: [
      // The hall's own flagging: 3 columns by 2 rows about (5, 0, 2), so
      // x runs 5 - 2 .. 5 + 2 and z runs 2 .. 2 + 2.
      field({
        id: "hall-flags",
        space: "great-hall",
        anchor: { x: 5, y: 0, z: 2 },
        columns: 3,
        rows: 2,
        count: 6,
        spacing: { x: 2, z: 2 },
      }),
      // The undercroft holds nothing but casks: the boundary case where a room
      // is furnished entirely by a population.
      field({
        id: "undercroft-casks",
        space: "undercroft",
        anchor: { x: 2, y: -2.5, z: 3 },
        columns: 2,
        rows: 2,
        count: 4,
        spacing: { x: 1.5, z: 1.5 },
      }),
      // The slate covers the whole work, so it names the building's own space
      // rather than any one room beneath it.
      field({
        id: "roof-slate",
        space: "residence",
        anchor: { x: 10, y: 9, z: 0 },
        columns: 4,
        rows: 3,
        count: 12,
        spacing: { x: 5, z: 5 },
      }),
      // One authored paving run crossing a room boundary, declared as the two
      // populations it actually is.
      field({
        id: "paving-hall",
        space: "great-hall",
        anchor: { x: 3, y: 0, z: 6 },
        columns: 2,
        rows: 2,
        count: 4,
        spacing: { x: 2, z: 2 },
      }),
      field({
        id: "paving-porch",
        space: "porch",
        anchor: { x: 3, y: 0, z: 10 },
        columns: 2,
        rows: 2,
        count: 4,
        spacing: { x: 2, z: 2 },
      }),
    ],
    spaces: [
      { id: "residence", kind: "building", parent: null, cells: [] },
      {
        id: "great-hall",
        kind: "hall",
        parent: "residence",
        cells: [
          box("great-hall-cell", { x: 0, y: 0, z: 0 }, { x: 10, y: 5, z: 8 }),
        ],
      },
      {
        id: "undercroft",
        kind: "cellar",
        parent: "residence",
        cells: [
          box("undercroft-cell", { x: 0, y: -3, z: 0 }, { x: 10, y: 0, z: 8 }),
        ],
      },
      {
        id: "solar",
        kind: "room",
        parent: "residence",
        cells: [
          box("solar-cell", { x: 12, y: 0, z: 0 }, { x: 20, y: 5, z: 8 }),
        ],
      },
      {
        id: "porch",
        kind: "porch",
        parent: "residence",
        cells: [
          box("porch-cell", { x: 0, y: 0, z: 8 }, { x: 10, y: 5, z: 12 }),
        ],
      },
    ],
    boundaries: [],
    openings: [],
    connectors: [],
    surfaces: [],
    walkable: [],
  });

/** The same work with its populations removed, for the regression comparison. */
const unpopulated: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => {
    const bare: IAutoMovieBuiltEnvironment = residence();
    delete bare.populations;
    return bare;
  };

/**
 * Fold compact population membership into room content bounds, node identities and lowered sets without per-member expansion.
 *
 * Scenarios:
 * 1. The record validates, so nothing below is read off a malformed building.
 * 2. A room furnished only by a population is measured rather than reported empty: `undercroft` holds no element at all and answers x 0.75..3.25, y -2.5..-1.5, z 2.5..5, including each cask's local box rather than only its origin.
 * 3. The element-only solar box matches the authored unit chest and the same record with populations stripped under the existing vector tolerance.
 * 4. A room holding both is the union: `great-hall` reaches x 1.5..7.5, y 0..1, z 1.5..8.5 from one table, one flagging field, and its half of the paving.
 * 5. The negative pair. That answer excludes the undercroft's casks two and a half metres below it, the porch's paving two metres beyond it, and the slate nine metres above it, each of which would move a bound if declared membership leaked.
 * 6. The root-owned roof field is excluded from the queried rooms and contributes to root bounds Y -2.5..10 and Z -0.5..12.5 together with all descendant content.
 * 7. `builtEnvironmentSpacePopulations` names which sets a space owns, folding descendants exactly as the bounds query does.
 * 8. `builtEnvironmentSpaceNodes` lists the two elements and five population owner ids without expanding the authored 30 members.
 * 9. Empty content reports null, and the tested hall fidelity stays exact with or without these populations.
 * 10. Lowering hands the populations to the world as the compact sets they are, while a record without populations omits the key entirely.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls space content/population/node/fidelity queries and lowering after validating the populated record. Authored min/max, ordered set/node ids, null emptiness, fidelity labels and compact set/count/key observations expose missing population content, sibling/root leaks or per-member set-piece expansion.
 * @evidence contracts/testing.md#independent-expectations Local grid arithmetic (column-(columns-1)/2)*spacing.x and row*spacing.z plus anchors and prototype extents gives each literal box under the original vclose limits; hall exclusion coordinates use nclose tolerance zero. Counts 6+4+12+4+4=30 and the two model elements determine compact output observations. The population-stripped solar relation shares the lowerer, and authored prototype bounds are a geometric premise rather than independently measured model meshes.
 * @evidence contracts/testing.md#distinguishing-cases Population-only, element-only, mixed and empty spaces, sibling/root membership, descendant selection, fidelity and omitted-versus-present lowering keys expose leaks without reading renderer objects; the declared prototype bounds are the geometric premise.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_built_environment_populations imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_built_environment_populations(): void {
  const work: IAutoMovieBuiltEnvironment = residence();
  TestValidator.equals(
    "the populated record validates",
    validateBuiltEnvironment({ environment: work }).success,
    true,
  );

  const undercroft: IAutoMovieSubjectBox | null =
    builtEnvironmentSpaceContentBounds(work, "undercroft");
  TestValidator.equals(
    "a room furnished only by a population is measured, not reported empty",
    namedFacts([
      ["measured", (): boolean => undercroft !== null],
      [
        "min",
        (): boolean =>
          undercroft !== null &&
          vclose(undercroft.min, { x: 0.75, y: -2.5, z: 2.5 }),
      ],
      [
        "max",
        (): boolean =>
          undercroft !== null &&
          vclose(undercroft.max, { x: 3.25, y: -1.5, z: 5 }),
      ],
    ]),
    { measured: true, min: true, max: true },
  );

  const solar: IAutoMovieSubjectBox | null = builtEnvironmentSpaceContentBounds(
    work,
    "solar",
  );
  const solarBefore: IAutoMovieSubjectBox | null =
    builtEnvironmentSpaceContentBounds(unpopulated(), "solar");
  TestValidator.equals(
    "a room holding only elements answers what it always answered",
    namedFacts([
      ["measured", (): boolean => solar !== null],
      [
        "min",
        (): boolean =>
          solar !== null && vclose(solar.min, { x: 14.5, y: 0, z: 3.5 }),
      ],
      [
        "max",
        (): boolean =>
          solar !== null && vclose(solar.max, { x: 15.5, y: 1, z: 4.5 }),
      ],
      [
        "unchangedByTheFieldExisting",
        (): boolean =>
          solar !== null &&
          solarBefore !== null &&
          vclose(solar.min, solarBefore.min) &&
          vclose(solar.max, solarBefore.max),
      ],
    ]),
    {
      measured: true,
      min: true,
      max: true,
      unchangedByTheFieldExisting: true,
    },
  );

  const hall: IAutoMovieSubjectBox | null = builtEnvironmentSpaceContentBounds(
    work,
    "great-hall",
  );
  TestValidator.equals(
    "a room holding both is their union, and only theirs",
    namedFacts([
      ["measured", (): boolean => hall !== null],
      [
        "min",
        (): boolean =>
          hall !== null && vclose(hall.min, { x: 1.5, y: 0, z: 1.5 }),
      ],
      [
        "max",
        (): boolean =>
          hall !== null && vclose(hall.max, { x: 7.5, y: 1, z: 8.5 }),
      ],
      [
        "theCellarBelowDidNotLeakIn",
        (): boolean => hall !== null && nclose(hall.min.y, 0, 0),
      ],
      [
        "thePorchBeyondDidNotLeakIn",
        (): boolean => hall !== null && nclose(hall.max.z, 8.5, 0),
      ],
      [
        "theSlateAboveDidNotLeakIn",
        (): boolean => hall !== null && nclose(hall.max.y, 1, 0),
      ],
    ]),
    {
      measured: true,
      min: true,
      max: true,
      theCellarBelowDidNotLeakIn: true,
      thePorchBeyondDidNotLeakIn: true,
      theSlateAboveDidNotLeakIn: true,
    },
  );

  const whole: IAutoMovieSubjectBox | null = builtEnvironmentSpaceContentBounds(
    work,
    "residence",
  );
  TestValidator.equals(
    "the work's own space carries the field that covers the work",
    namedFacts([
      ["measured", (): boolean => whole !== null],
      [
        "min",
        (): boolean =>
          whole !== null && vclose(whole.min, { x: 0.75, y: -2.5, z: -0.5 }),
      ],
      [
        "max",
        (): boolean =>
          whole !== null && vclose(whole.max, { x: 18, y: 10, z: 12.5 }),
      ],
    ]),
    { measured: true, min: true, max: true },
  );

  TestValidator.equals(
    "each space owns exactly the populations declared on it",
    {
      hall: builtEnvironmentSpacePopulations(work, "great-hall").map(
        (population: IAutoMovieBuiltPopulation): string => population.set.id,
      ),
      undercroft: builtEnvironmentSpacePopulations(work, "undercroft").map(
        (population: IAutoMovieBuiltPopulation): string => population.set.id,
      ),
      solar: builtEnvironmentSpacePopulations(work, "solar").map(
        (population: IAutoMovieBuiltPopulation): string => population.set.id,
      ),
      omitted: builtEnvironmentSpacePopulations(unpopulated(), "solar").map(
        (population: IAutoMovieBuiltPopulation): string => population.set.id,
      ),
      porch: builtEnvironmentSpacePopulations(work, "porch").map(
        (population: IAutoMovieBuiltPopulation): string => population.set.id,
      ),
      whole: builtEnvironmentSpacePopulations(work, "residence").map(
        (population: IAutoMovieBuiltPopulation): string => population.set.id,
      ),
    },
    {
      hall: ["hall-flags", "paving-hall"],
      undercroft: ["undercroft-casks"],
      solar: [],
      omitted: [],
      porch: ["paving-porch"],
      whole: [
        "hall-flags",
        "undercroft-casks",
        "roof-slate",
        "paving-hall",
        "paving-porch",
      ],
    },
  );

  TestValidator.equals(
    "a population is named once, by the owner id the render side uses",
    {
      hall: builtEnvironmentSpaceNodes(work, "great-hall"),
      undercroft: builtEnvironmentSpaceNodes(work, "undercroft"),
      solar: builtEnvironmentSpaceNodes(work, "solar"),
      whole: builtEnvironmentSpaceNodes(work, "residence"),
    },
    {
      hall: [
        "residence/hall-table",
        "instance-set:hall-flags",
        "instance-set:paving-hall",
      ],
      undercroft: ["instance-set:undercroft-casks"],
      solar: ["residence/solar-chest"],
      whole: [
        "residence/hall-table",
        "residence/solar-chest",
        "instance-set:hall-flags",
        "instance-set:undercroft-casks",
        "instance-set:roof-slate",
        "instance-set:paving-hall",
        "instance-set:paving-porch",
      ],
    },
  );

  const empty: IAutoMovieBuiltEnvironment = residence();
  empty.elements = empty.elements.filter(
    (element: IAutoMovieBuiltElement): boolean => element.model === null,
  );
  empty.populations = [];
  TestValidator.equals(
    "empty content remains null and population content does not alter fidelity",
    {
      empty: builtEnvironmentSpaceContentBounds(empty, "solar"),
      populatedFidelity: builtEnvironmentSpaceFidelity(work, "great-hall"),
      bareFidelity: builtEnvironmentSpaceFidelity(unpopulated(), "great-hall"),
    },
    { empty: null, populatedFidelity: "exact", bareFidelity: "exact" },
  );

  const lowered: IAutoMovieSubjectContribution = lowerBuiltEnvironment(work);
  const loweredBare: IAutoMovieSubjectContribution =
    lowerBuiltEnvironment(unpopulated());
  TestValidator.predicate(
    "lowering contributes the compact sets and never expands them",
    ((): boolean => {
      const observed: {
        sets: string[];
        slots: number;
        setPieces: number;
        bareOmitsTheKey: boolean;
      } = {
        sets: (lowered.instanceSets ?? []).map(
          (set: IAutoMovieInstanceSetDesign): string => set.id,
        ),
        slots: (lowered.instanceSets ?? []).reduce(
          (total: number, set: IAutoMovieInstanceSetDesign): number =>
            total + set.count,
          0,
        ),
        setPieces: lowered.set?.length ?? 0,
        bareOmitsTheKey: Object.hasOwn(loweredBare, "instanceSets"),
      };
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 4 &&
        Object.hasOwn(observed, "sets") &&
        Array.isArray(observed["sets"]) &&
        observed["sets"].length === 5 &&
        observed["sets"][0] === "hall-flags" &&
        observed["sets"][1] === "undercroft-casks" &&
        observed["sets"][2] === "roof-slate" &&
        observed["sets"][3] === "paving-hall" &&
        observed["sets"][4] === "paving-porch" &&
        Object.hasOwn(observed, "slots") &&
        typeof observed["slots"] === "number" &&
        Number.isInteger(observed["slots"]) &&
        nclose(observed["slots"], 30, 0) &&
        Object.hasOwn(observed, "setPieces") &&
        typeof observed["setPieces"] === "number" &&
        Number.isInteger(observed["setPieces"]) &&
        nclose(observed["setPieces"], 2, 0) &&
        Object.hasOwn(observed, "bareOmitsTheKey") &&
        observed["bareOmitsTheKey"] === false
      );
    })(),
  );
}
