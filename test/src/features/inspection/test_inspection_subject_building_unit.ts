import {
  builtEnvironmentElementBounds,
  describeAutoMovieSubject,
  describeAutoMovieSubjects,
  diffAutoMovieSubjects,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieSubjectArtifact,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";
import {
  subjectInspectionArtifact,
  subjectInspectionIdentityTransform,
  subjectInspectionModel,
} from "../internal/subjectInspectionFixtures";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * One two-vertex model, so every expected box is read off its own numbers.
 */
const MODEL: import("@automovie/interface").IAutoMovieModel =
  subjectInspectionModel({
    id: "unit-model",
    min: { x: -1, y: 0, z: -1 },
    max: { x: 1, y: 2, z: 1 },
  });

/**
 * A whole building unit is a subject a reviewer can open.
 *
 * The scene walk knows nodes and the space tree knows rooms, so between them the one thing nobody could address was the building. That is not a gap in a survey, it is the address the derived observation population already uses: every exterior requirement is written against `building:<environment>/<unit>`, and an id nothing resolves is a review target nobody can open.
 *
 * A unit's extent is measured over the elements it owns rather than over the rooms it contains, because the record states that ownership is total while a space claims no envelope at all. Every box here is read off a model whose mesh is exactly its own two corners and a population whose layout law states its own slot positions, so the expected numbers are arithmetic rather than a reading of what the code produced. The record is an inspection input rather than a validated design: the two-vertex model carries no material colour, and what legality means for a building is settled by its own validator's tests.
 *
 * Scenarios:
 *
 * 1. The enumeration carries one subject per declared building unit.
 * 2. A unit opens by its own id and reports the structural role, the two roots a walk of it starts from, and null for everything it stages itself.
 * 3. Its content box is the union over every element descending from its root, including one two storeys up, and matches those elements' own boxes.
 * 4. A unit whose only content is a compact population measures that population, because the rooms under it already answer for the sets placed in them.
 * 5. A unit that stages nothing reports a null content box rather than an empty or infinite one.
 * 6. An id no declared unit answers for is still refused.
 * 7. Reassigning a unit's space root reshapes that unit and nothing else, so a building takes part in a structural diff as its own subject.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls subject inventory, direct descriptions, element bounds and structural diff; losing building addresses, ignoring descendants/populations or reshaping unrelated subjects fails.
 * @evidence contracts/testing.md#independent-expectations Two authored mesh corners, a four-metre roof offset and a two-by-two grid at independently computed centres define union bounds; no renderer output supplies expectations.
 * @evidence contracts/testing.md#distinguishing-cases Element-bearing, population-only and empty units, unknown ids and a one-unit root reassignment are contrasted; these inspection records do not claim validated design legality or displayed geometry.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_inspection_subject_building_unit entry owns these synchronous portable compiled-record cases and local fact callbacks; resident synthetic records require no production installation, process, browser or GPU.
 */
export function test_inspection_subject_building_unit(): void {
  const record: IAutoMovieBuiltEnvironment = environment();
  const artifact: IAutoMovieSubjectArtifact = compiled(record);
  const tower: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "building:estate/tower");
  const garden: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "building:estate/garden");
  const shed: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "building:estate/shed");

  TestValidator.predicate(
    "every declared unit is one enumerated subject",
    test12ValuesClose(
      describeAutoMovieSubjects(artifact)
        .filter(
          (
            subject: import("@automovie/interface").IAutoMovieSubjectDescription,
          ): boolean => subject.kind === "building",
        )
        .map(
          (
            subject: import("@automovie/interface").IAutoMovieSubjectDescription,
          ): string => subject.id,
        ),
      [
        "building:estate/garden",
        "building:estate/shed",
        "building:estate/tower",
      ],
    ),
  );

  TestValidator.predicate(
    "a unit opens as itself and names the two roots a walk starts from",
    test12ValuesClose(
      {
        kind: tower.kind,
        semanticKind: tower.semanticKind,
        name: tower.name,
        owner: tower.owner,
        placement: tower.placement,
        space: tower.space,
        model: tower.model,
        prototype: tower.prototype,
        transform: tower.transform,
        declared: tower.bounds.declared,
        coordinateSpace: tower.bounds.coordinateSpace,
        materials: tower.materials.length,
        members: tower.members.items,
        total: tower.members.total,
      },
      {
        kind: "building",
        semanticKind: "building",
        name: "tower",
        owner: null,
        placement: "building:estate/tower",
        space: null,
        model: null,
        prototype: null,
        transform: null,
        declared: null,
        coordinateSpace: "world",
        materials: 0,
        members: ["element:estate/tower-root", "space:estate/great-hall"],
        total: 2,
      },
    ),
  );

  TestValidator.predicate(
    "its extent is the union over the elements it owns, not over its rooms",
    test12ValuesClose(
      namedFacts([
        [
          "the base element fills the model's own two corners",
          (): boolean =>
            test12ValuesClose(
              builtEnvironmentElementBounds(record, "tower-base"),
              {
                min: { x: -1, y: 0, z: -1 },
                max: { x: 1, y: 2, z: 1 },
              },
            ),
        ],
        [
          "the cap element is that box lifted four metres",
          (): boolean =>
            test12ValuesClose(
              builtEnvironmentElementBounds(record, "tower-cap"),
              {
                min: { x: -1, y: 4, z: -1 },
                max: { x: 1, y: 6, z: 1 },
              },
            ),
        ],
        [
          "and the unit is exactly the two of them together",
          (): boolean =>
            test12ValuesClose(tower.bounds.content, {
              min: { x: -1, y: 0, z: -1 },
              max: { x: 1, y: 6, z: 1 },
            }),
        ],
        [
          "a unit whose only content is a repeated population still measures it",
          (): boolean =>
            test12ValuesClose(garden.bounds.content, {
              min: { x: 9, y: 0, z: 10 },
              max: { x: 11, y: 0, z: 12 },
            }),
        ],
        [
          "and a unit that stages nothing at all measures nothing",
          (): boolean =>
            shed.bounds.content === null && shed.kind === "building",
        ],
        [
          "and an undeclared unit id is still refused",
          (): boolean =>
            throwsError(
              (): ReturnType<typeof describeAutoMovieSubject> =>
                describeAutoMovieSubject(artifact, "building:estate/nowhere"),
              "does not exist",
            ),
        ],
      ]),
      {
        "the base element fills the model's own two corners": true,
        "the cap element is that box lifted four metres": true,
        "and the unit is exactly the two of them together": true,
        "a unit whose only content is a repeated population still measures it": true,
        "and a unit that stages nothing at all measures nothing": true,
        "and an undeclared unit id is still refused": true,
      },
    ),
  );

  const reassigned: IAutoMovieBuiltEnvironment = environment();
  reassigned.buildings = reassigned.buildings.map(
    (
      building: import("@automovie/interface").IAutoMovieBuildingUnit,
    ): import("@automovie/interface").IAutoMovieBuildingUnit =>
      building.id === "shed" ? { ...building, space: "garden" } : building,
  );
  const diff: import("@automovie/interface").IAutoMovieSubjectDiff =
    diffAutoMovieSubjects(artifact, compiled(reassigned));
  TestValidator.predicate(
    "a unit whose roots move is reshaped, and the rooms under it are not",
    test12ValuesClose(
      {
        reshaped: diff.reshaped.map(
          (
            change: import("@automovie/interface").IAutoMovieSubjectChange,
          ): string => change.id,
        ),
        moved: diff.moved.map(
          (
            change: import("@automovie/interface").IAutoMovieSubjectChange,
          ): string => change.id,
        ),
        added: diff.added.length,
        removed: diff.removed.length,
      },
      {
        reshaped: ["building:estate/shed"],
        moved: [],
        added: 0,
        removed: 0,
      },
    ),
  );
}

/**
 * One estate of three units, one per way a unit can be measured.
 *
 * `tower` stages elements two levels down, `garden` stages nothing but holds a compact population in its room, and `shed` stages nothing at all.
 */
const environment: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: "estate",
    units: "meter",
    buildings: [
      { id: "tower", element: "tower-root", space: "great-hall" },
      { id: "garden", element: "garden-root", space: "garden" },
      { id: "shed", element: "shed-root", space: "shed" },
    ],
    models: [MODEL],
    modelReferences: [],
    elements: [
      {
        id: "tower-root",
        kind: "building",
        parent: null,
        transform: subjectInspectionIdentityTransform(),
        model: null,
        space: "great-hall",
      },
      {
        id: "tower-base",
        kind: "wall",
        parent: "tower-root",
        transform: subjectInspectionIdentityTransform(),
        model: MODEL.id,
        space: "great-hall",
      },
      {
        id: "tower-frame",
        kind: "structure",
        parent: "tower-root",
        transform: subjectInspectionIdentityTransform(),
        model: null,
        space: null,
      },
      {
        id: "tower-cap",
        kind: "roof",
        parent: "tower-frame",
        transform: {
          translation: { x: 0, y: 4, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        model: MODEL.id,
        space: null,
      },
      {
        id: "garden-root",
        kind: "building",
        parent: null,
        transform: subjectInspectionIdentityTransform(),
        model: null,
        space: "garden",
      },
      {
        id: "shed-root",
        kind: "building",
        parent: null,
        transform: subjectInspectionIdentityTransform(),
        model: null,
        space: "shed",
      },
    ],
    spaces: [
      { id: "great-hall", kind: "room", parent: null, cells: [] },
      { id: "garden", kind: "room", parent: null, cells: [] },
      { id: "shed", kind: "room", parent: null, cells: [] },
    ],
    // Four slots of a two-by-two grid at two-metre centres about (10, 0, 10):
    // a column sits at `(column - (columns - 1) / 2) * spacing.x` across and a
    // row at `row * spacing.z` along, so the field spans x 9..11 and z 10..12.
    populations: [
      {
        space: "garden",
        prototypeBounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: 0, z: 0 },
        },
        set: {
          id: "hedge",
          model: "unit-model",
          anchor: { x: 10, y: 0, z: 10 },
          facingDeg: 0,
          seed: 11,
          count: 4,
          layout: {
            kind: "grid",
            rows: 2,
            columns: 2,
            spacing: { x: 2, z: 2 },
          },
          variation: {
            scale: { min: 1, max: 1 },
            palette: ["#808080"],
            traits: [],
          },
        },
      },
    ],
    boundaries: [],
    openings: [],
    connectors: [],
    surfaces: [],
    walkable: [],
  });

/**
 * The compiled artifact staging exactly the elements that carry a model.
 */
const compiled: (
  record: IAutoMovieBuiltEnvironment,
) => IAutoMovieSubjectArtifact = (
  record: IAutoMovieBuiltEnvironment,
): IAutoMovieSubjectArtifact =>
  subjectInspectionArtifact({
    models: [MODEL],
    environment: record,
    nodes: record.elements
      .filter(
        (
          element: import("@automovie/interface").IAutoMovieBuiltElement,
        ): boolean => element.model !== null,
      )
      .map(
        (
          element: import("@automovie/interface").IAutoMovieBuiltElement,
        ): {
          id: string;
          model: string;
          transform: import("@automovie/interface").IAutoMovieTransform;
          motion: null;
          pose: null;
        } => ({
          id: `${record.id}/${element.id}`,
          model: element.model!,
          transform: subjectInspectionIdentityTransform(),
          motion: null,
          pose: null,
        }),
      ),
  });
