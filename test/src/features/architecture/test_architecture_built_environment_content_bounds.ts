import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConvexSpaceCell,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtEnvironmentContainsPoint, builtEnvironmentSpaceContentBounds, builtEnvironmentSpaceNodes, validateBuiltEnvironment } from "@automovie/engine";



import { makeProp, primitivePart } from "../internal/fixtures";
import { namedFacts, throwsError, vclose } from "../internal/predicates";

const place: (
  x: number,
  y: number,
  z: number,
  scale?: IAutoMovieVector3,
) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
  scale: IAutoMovieVector3 = { x: 1, y: 1, z: 1 },
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale,
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

/** The eight corners of a unit cube, as a mesh the record states itself. */
const cubeMeshPart: (transform: IAutoMovieTransform) => IAutoMovieModelPart = (
  transform: IAutoMovieTransform,
): IAutoMovieModelPart => ({
  id: "slab-mesh",
  name: null,
  geometry: {
    type: "mesh",
    mesh: {
      positions: [
        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
        -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
      ],
      normals: null,
      uvs: null,
      indices: null,
      skin: null,
    },
  },
  material: null,
  attachedBone: null,
  transform,
});

const model: (id: string, parts: IAutoMovieModelPart[]) => IAutoMovieModel = (
  id: string,
  parts: IAutoMovieModelPart[],
): IAutoMovieModel => ({
  ...makeProp(parts),
  id,
});

/**
 * A stair hall declared far wider than the tower that actually stands in it.
 *
 * The cell is the one observed in the `#1902` residence experiment (x 3.5..14.5, y 0..4.2, z 5.5..11.5); the tower inside it is written from unit boxes at whole-metre placements so every expected bound is hand arithmetic rather than a snapshot of what the kernel happened to print.
 */
const residence: (doorState?: string) => IAutoMovieBuiltEnvironment = (
  doorState: string = "closed",
): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "residence",
  units: "meter",
  buildings: [
    { id: "residence-unit", element: "residence-root", space: "residence" },
  ],
  models: [
    model("stone", [
      primitivePart("block", { type: "box", width: 1, height: 1, depth: 1 }),
    ]),
    model("leaf", [
      primitivePart("panel", { type: "box", width: 0.1, height: 2, depth: 1 }),
    ]),
    // A stated mesh under a part transform: the other geometry spelling, and
    // the other placement path, measured by the same query.
    model("slab", [cubeMeshPart(place(0, 0, -0.4, { x: 2, y: 0.2, z: 2.6 }))]),
  ],
  modelReferences: ["vault-mesh"],
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
      id: "stair-tower-west",
      kind: "wall",
      parent: "residence-root",
      transform: place(9.5, 2, 8.5, { x: 1, y: 4, z: 5 }),
      model: "stone",
      space: "stair-ground",
    },
    {
      id: "stair-tower-east",
      kind: "wall",
      parent: "residence-root",
      transform: place(13.5, 2, 8.5, { x: 1, y: 4, z: 5 }),
      model: "stone",
      space: "stair-ground",
    },
    {
      id: "stair-door-leaf",
      kind: "door-leaf",
      parent: "residence-root",
      transform: place(9, 1, 8.5),
      model: "leaf",
      space: "stair-ground",
    },
    {
      id: "stair-landing-slab",
      kind: "floor-slab",
      parent: "residence-root",
      transform: place(11, 2, 7.5),
      model: "slab",
      space: "stair-landing",
    },
    {
      id: "stair-vault",
      kind: "vault",
      parent: "residence-root",
      transform: place(11, 3.9, 8),
      model: "vault-mesh",
      space: "stair-landing",
    },
    {
      // A grouping node inside the space that draws nothing: high enough that
      // counting it as content would be visible in the box.
      id: "stair-tower-assembly",
      kind: "assembly",
      parent: "residence-root",
      transform: place(11, 8, 8.5),
      model: null,
      space: "stair-ground",
    },
    {
      id: "hall-table",
      kind: "furniture",
      parent: "residence-root",
      transform: place(5, 0.5, 8),
      model: "stone",
      space: "hall",
    },
    {
      id: "residence-eaves",
      kind: "eaves",
      parent: "residence-root",
      transform: place(20, 6, 20, { x: 2, y: 0.2, z: 2 }),
      model: "stone",
      space: null,
    },
  ],
  spaces: [
    { id: "residence", kind: "building", parent: null, cells: [] },
    {
      id: "stair-ground",
      kind: "stair-hall",
      parent: "residence",
      cells: [
        box(
          "stair-ground-cell",
          { x: 3.5, y: 0, z: 5.5 },
          { x: 14.5, y: 4.2, z: 11.5 },
        ),
      ],
    },
    {
      id: "stair-landing",
      kind: "landing",
      parent: "stair-ground",
      cells: [
        box(
          "stair-landing-cell",
          { x: 9.5, y: 1.5, z: 5.5 },
          { x: 13.5, y: 4.2, z: 9 },
        ),
      ],
    },
    {
      id: "hall",
      kind: "hall",
      parent: "residence",
      cells: [
        box("hall-cell", { x: 0, y: 0, z: 5.5 }, { x: 3.5, y: 4.2, z: 11.5 }),
      ],
    },
    { id: "west-wing", kind: "wing", parent: "residence", cells: [] },
  ],
  boundaries: [
    {
      id: "stair-west-wall",
      kind: "wall",
      spaces: ["stair-ground"],
      elements: ["stair-tower-west"],
    },
  ],
  openings: [
    {
      id: "stair-door",
      kind: "door",
      boundary: "stair-west-wall",
      fill: "stair-door-leaf",
      operation: {
        panels: [
          {
            id: "stair-door-panel",
            element: "stair-door-leaf",
            width: 1,
            height: 2,
            motion: {
              kind: "prismatic",
              axis: { x: -1, y: 0, z: 0 },
              min: 0,
              max: 0.9,
            },
          },
        ],
        states: [
          { id: "closed", panels: [{ panel: "stair-door-panel", value: 0 }] },
          { id: "open", panels: [{ panel: "stair-door-panel", value: 0.9 }] },
        ],
        state: doorState,
        hardware: [],
      },
    },
  ],
  connectors: [],
  surfaces: [],
  walkable: [],
});

/**
 * Measure staged room contents, descendants and current door state separately from declared logical cells.
 *
 * Scenarios:
 * 1. The record validates, so nothing below is read off a malformed building.
 * 2. `stair-ground` is measured at x 8.95..14, y 0..4, z 5.8..11: the two tower walls, the closed door leaf standing 0.05 m proud of the west face, and the landing slab reaching to z 5.8. The unassigned eaves at x 19..21, the hall table in a sibling space, and the modelless assembly node standing at y 8 inside this very space are all absent, which are the three ways an element fails the selection and each would move a bound if it were counted.
 * 3. The declared cell and the content disagree exactly as the experiment found: the corner camera at (4.1, 1.62, 6.1) is inside the space and outside its contents, so the cell could not have answered where to stand.
 * 4. A descendant space contributes: the landing slab and its vault sit below `stair-ground`, and their own box is the same query asked one level down. The slab is a stated mesh under its own part transform, so the other geometry spelling and the other placement path are measured here too.
 * 5. An element citing a runtime model reference the record does not own carries its world origin rather than nothing: the vault at y 3.9 raises the landing's top above the 2.1 the slab alone reaches.
 * 6. The box is measured where the current operating state puts a member, not at rest: opening the sliding leaf 0.9 m widens the same space to x 8.05.
 * 7. A space with nothing placed in it answers `null` rather than refusing or inventing a degenerate box, beside the empty node list of the same space.
 * 8. An undeclared space id is refused by name, exactly as every other query in the file refuses it.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls builtEnvironmentSpaceContentBounds beside containment/node queries and building admission, observing selected min/max coordinates, descendants, origin-only external content, closed/open leaf changes, null emptiness and an unknown-id message fragment. Counting an unassigned/sibling/modelless element or measuring the door at rest would move a tested bound.
 * @evidence contracts/testing.md#independent-expectations Unit primitives, the explicit eight-corner mesh and part transform give authored ground bounds (8.95,0,5.8)..(14,4,11) and landing bounds (10,1.9,5.8)..(12,3.9,8.4); 0.9 m travel moves minimum X to 8.05 under the original vclose tolerance. The camera point has literal X 4.1 below the content minimum, while its logical-cell admission uses the production predicate. External geometry contributes its stated origin only, so these CPU expectations do not enclose loaded vault bytes or a rendered frame.
 * @evidence contracts/testing.md#distinguishing-cases Owned primitives and mesh, referenced geometry, sibling/unassigned/modelless exclusions, descendant content, a cell-only camera point, open/closed leaf, empty space and unknown id distinguish content from declared extent; external model bytes and camera images are unobserved.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_built_environment_content_bounds imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_built_environment_content_bounds(): void {
  const closed: IAutoMovieBuiltEnvironment = residence();
  TestValidator.equals(
    "the stair-hall record validates",
    validateBuiltEnvironment({ environment: closed }).success,
    true,
  );

  const ground: IAutoMovieSubjectBox | null =
    builtEnvironmentSpaceContentBounds(closed, "stair-ground");
  TestValidator.equals(
    "the box is the staged contents, not the declared cell",
    namedFacts([
      ["measured", (): boolean => ground !== null],
      [
        "min",
        (): boolean =>
          ground !== null && vclose(ground.min, { x: 8.95, y: 0, z: 5.8 }),
      ],
      [
        "max",
        (): boolean =>
          ground !== null && vclose(ground.max, { x: 14, y: 4, z: 11 }),
      ],
      [
        "sameElementsAsTheNodeQuery",
        (): boolean =>
          builtEnvironmentSpaceNodes(closed, "stair-ground").join(",") ===
          [
            "residence/stair-tower-west",
            "residence/stair-tower-east",
            "residence/stair-door-leaf",
            "residence/stair-landing-slab",
            "residence/stair-vault",
          ].join(","),
      ],
    ]),
    {
      measured: true,
      min: true,
      max: true,
      sameElementsAsTheNodeQuery: true,
    },
  );

  TestValidator.equals(
    "the declared cell puts a corner camera where the content is not",
    namedFacts([
      [
        "cornerIsInTheSpace",
        (): boolean =>
          builtEnvironmentContainsPoint(closed, "stair-ground", {
            x: 4.1,
            y: 1.62,
            z: 6.1,
          }),
      ],
      [
        "cornerIsOutsideTheContent",
        (): boolean => ground !== null && 4.1 < ground.min.x,
      ],
      [
        "centreOfTheContentIsInTheSpace",
        (): boolean =>
          ground !== null &&
          builtEnvironmentContainsPoint(closed, "stair-ground", {
            x: (ground.min.x + ground.max.x) / 2,
            y: (ground.min.y + ground.max.y) / 2,
            z: (ground.min.z + ground.max.z) / 2,
          }),
      ],
    ]),
    {
      cornerIsInTheSpace: true,
      cornerIsOutsideTheContent: true,
      centreOfTheContentIsInTheSpace: true,
    },
  );

  const landing: IAutoMovieSubjectBox | null =
    builtEnvironmentSpaceContentBounds(closed, "stair-landing");
  TestValidator.equals(
    "a descendant space is measured on its own, referenced models included",
    namedFacts([
      ["measured", (): boolean => landing !== null],
      [
        "min",
        (): boolean =>
          landing !== null && vclose(landing.min, { x: 10, y: 1.9, z: 5.8 }),
      ],
      [
        "max",
        (): boolean =>
          landing !== null && vclose(landing.max, { x: 12, y: 3.9, z: 8.4 }),
      ],
    ]),
    { measured: true, min: true, max: true },
  );

  const opened: IAutoMovieSubjectBox | null =
    builtEnvironmentSpaceContentBounds(residence("open"), "stair-ground");
  TestValidator.equals(
    "an opened leaf is measured where it rests, not where it was authored",
    namedFacts([
      ["measured", (): boolean => opened !== null],
      [
        "min",
        (): boolean =>
          opened !== null && vclose(opened.min, { x: 8.05, y: 0, z: 5.8 }),
      ],
      [
        "max",
        (): boolean =>
          opened !== null && vclose(opened.max, { x: 14, y: 4, z: 11 }),
      ],
    ]),
    { measured: true, min: true, max: true },
  );

  TestValidator.equals(
    "a space holding nothing answers null beside an empty node list",
    {
      bounds: builtEnvironmentSpaceContentBounds(closed, "west-wing"),
      nodes: builtEnvironmentSpaceNodes(closed, "west-wing"),
    },
    { bounds: null, nodes: [] },
  );

  TestValidator.equals(
    "an undeclared logical space is refused by name",
    throwsError(
      (): IAutoMovieSubjectBox | null =>
        builtEnvironmentSpaceContentBounds(closed, "cellar"),
      ['has no logical space "cellar"'],
    ),
    true,
  );
}
