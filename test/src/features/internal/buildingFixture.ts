import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { boxCell } from "./boxCell";
import { renderFixtureIdentity } from "./renderFixtureIdentity";

/**
 * The existing two-storey tower: an exterior-connected hall, a sealed vault and a loft joined by one stair.
 *
 * @evidence contracts/testing.md#behavioral-verification Room-visibility, semantic ownership and render-budget units consume the same authored room/element ids; the helper supplies the graph while the named tests assert portal closure and attributed costs.
 * @evidence contracts/testing.md#independent-expectations The hall/vault wall has no opening, the hall facade has a door/window, and the stair joins hall to loft; visibility expectations can be read from those declarations without using the culler's output.
 * @evidence contracts/testing.md#distinguishing-cases Fresh room, boundary and connector records allow existing tests to add doors, overlaps or lift stops without changing another returned graph. Element transforms still share the module identity, and this helper declares no water body or compiled model geometry.
 * @evidence contracts/testing.md#execution-ownership Portable numerical fixture construction for existing discovered units; no renderer, process, filesystem or dynamic test registration is installed.
 */
export const buildingFixture: () => IAutoMovieBuiltEnvironment = (): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "tower",
  units: "meter",
  buildings: [{ id: "unit-a", element: "shell", space: "site" }],
  models: [],
  modelReferences: ["wall-model", "door-model", "slab-model"],
  elements: [
    {
      id: "shell",
      kind: "building",
      parent: null,
      transform: renderFixtureIdentity,
      model: null,
      space: "site",
    },
    {
      id: "hall-wall",
      kind: "wall",
      parent: "shell",
      transform: renderFixtureIdentity,
      model: "wall-model",
      space: "ground-hall",
    },
    {
      id: "vault-wall",
      kind: "wall",
      parent: "shell",
      transform: renderFixtureIdentity,
      model: "wall-model",
      space: "ground-vault",
    },
    {
      id: "hall-door-leaf",
      kind: "door-leaf",
      parent: "hall-wall",
      transform: renderFixtureIdentity,
      model: "door-model",
      space: "ground-hall",
    },
    {
      id: "loft-slab",
      kind: "slab",
      parent: "shell",
      transform: renderFixtureIdentity,
      model: "slab-model",
      space: "upper-loft",
    },
  ],
  spaces: [
    { id: "site", kind: "building", parent: null, cells: [] },
    { id: "ground", kind: "storey", parent: "site", cells: [] },
    { id: "upper", kind: "storey", parent: "site", cells: [] },
    {
      id: "ground-hall",
      kind: "room",
      parent: "ground",
      cells: [boxCell({ id: "hall", min: [0, 0, 0], max: [10, 3, 10] })],
    },
    {
      id: "ground-vault",
      kind: "room",
      parent: "ground",
      cells: [boxCell({ id: "vault", min: [10, 0, 0], max: [16, 3, 10] })],
    },
    {
      id: "upper-loft",
      kind: "room",
      parent: "upper",
      cells: [boxCell({ id: "loft", min: [0, 3, 0], max: [10, 6, 10] })],
    },
  ],
  boundaries: [
    {
      id: "hall-facade",
      kind: "wall",
      spaces: ["ground-hall"],
      elements: ["hall-wall"],
    },
    {
      id: "hall-vault-wall",
      kind: "wall",
      spaces: ["ground-hall", "ground-vault"],
      elements: ["vault-wall"],
    },
  ],
  openings: [
    {
      id: "hall-door",
      kind: "door",
      boundary: "hall-facade",
      fill: "hall-door-leaf",
    },
    { id: "hall-window", kind: "window", boundary: "hall-facade", fill: null },
  ],
  connectors: [
    {
      id: "loft-stair",
      kind: "stair",
      from: "ground-hall",
      to: "upper-loft",
      bidirectional: true,
      route: [
        { x: 1, y: 0, z: 1 },
        { x: 1, y: 3, z: 1 },
      ],
      width: 1.2,
      clearHeight: 2.1,
      elements: [],
    },
  ],
  surfaces: [],
  walkable: [],
});
