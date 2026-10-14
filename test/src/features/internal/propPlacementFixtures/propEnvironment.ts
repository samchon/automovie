import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { IDENTITY_TRANSFORM, createModel } from "../fixtures";

/**
 * One furnished room, sized so every declared relation is also geometrically true.
 *
 * The room cell spans `x, z in [-5, 5]` and `y in [-1, 4]`; the annex is a deliberately cell-less semantic partition. The doorway's leaf occupies `x in [3.5, 4.5]`, `y in [0, 2]`, `z in [-0.05, 0.05]`, and the stair sweeps `x in [-5.2, -3.8]`, `y in [0, 2.2]`, `z in [-4.7, -1.3]`. The staged door fills that opening by declaration; the other registry placements clear the filled opening and stair sweep.
 *
 * The three props that name a support bear on it exactly: the table and the cabinet stand on the floor patch at `y = 0`, and the lamp stands on the table's own top face at `y = 0.6`. So a support case is one staged height away from resting, in either direction.
 *
 * Behavior: Builds the original room/annex, opening fill, route and floor records queried and validated by placement, passage and support tests.
 * Expectation basis: Literal cell planes, proxy dimensions and surface heights define independent fixture geometry; shared identity transforms remain input references and no external asset bytes are loaded.
 * Cases: Keeps the bounded room, cell-less annex, filled/open openings, swept stair and constant elevated annex floor, with caller-selected environment id.
 * Execution: The existing owning entries call propEnvironment during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function propEnvironment(
  id: string = "house",
): IAutoMovieBuiltEnvironment {
  return {
    version: 1,
    id,
    units: "meter",
    buildings: [{ id: "main", element: "root", space: "room" }],
    models: [
      {
        ...createModel(null),
        id: "leaf-box",
        parts: [
          {
            id: "leaf",
            name: null,
            geometry: {
              type: "primitive",
              shape: { type: "box", width: 1, height: 2, depth: 0.1 },
            },
            material: "mat-1",
            attachedBone: null,
            transform: null,
          },
        ],
      },
    ],
    modelReferences: [],
    elements: [
      {
        id: "root",
        kind: "building",
        parent: null,
        transform: IDENTITY_TRANSFORM,
        model: null,
        space: "room",
      },
      {
        id: "wall",
        kind: "wall",
        parent: "root",
        transform: IDENTITY_TRANSFORM,
        model: null,
        space: "room",
      },
      {
        id: "ceiling",
        kind: "ceiling",
        parent: "root",
        transform: IDENTITY_TRANSFORM,
        model: null,
        space: "room",
      },
      {
        id: "door-leaf",
        kind: "door-leaf",
        parent: "root",
        transform: {
          translation: { x: 4, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        model: "leaf-box",
        space: "room",
      },
      {
        id: "annex-wall",
        kind: "wall",
        parent: "root",
        transform: IDENTITY_TRANSFORM,
        model: null,
        space: "annex",
      },
    ],
    spaces: [
      {
        id: "room",
        kind: "room",
        parent: null,
        cells: [
          {
            id: "room-cell",
            planes: [
              { normal: { x: 1, y: 0, z: 0 }, offset: 5 },
              { normal: { x: -1, y: 0, z: 0 }, offset: 5 },
              { normal: { x: 0, y: 1, z: 0 }, offset: 4 },
              { normal: { x: 0, y: -1, z: 0 }, offset: 1 },
              { normal: { x: 0, y: 0, z: 1 }, offset: 5 },
              { normal: { x: 0, y: 0, z: -1 }, offset: 5 },
            ],
          },
        ],
      },
      { id: "annex", kind: "room", parent: "room", cells: [] },
    ],
    boundaries: [
      {
        id: "room-wall",
        kind: "wall",
        spaces: ["room", "annex"],
        elements: ["wall"],
      },
      {
        id: "bare-boundary",
        kind: "threshold",
        spaces: ["room"],
        elements: [],
      },
    ],
    openings: [
      { id: "doorway", kind: "door", boundary: "room-wall", fill: "door-leaf" },
      { id: "arch", kind: "arch", boundary: "room-wall", fill: null },
    ],
    connectors: [
      {
        id: "stair",
        kind: "stair",
        from: "room",
        to: "annex",
        bidirectional: true,
        route: [
          { x: -4.5, y: 0, z: -4 },
          { x: -4.5, y: 0, z: -2 },
        ],
        width: 1.4,
        clearHeight: 2.2,
        elements: [],
      },
    ],
    surfaces: [
      {
        space: "room",
        surface: {
          id: "floor",
          kind: "floor",
          polygon: [
            { x: -5, y: 0, z: -5 },
            { x: 5, y: 0, z: -5 },
            { x: 5, y: 0, z: 5 },
            { x: -5, y: 0, z: 5 },
          ],
          anchor: { x: 0, y: 0, z: 0 },
          rampTo: null,
        },
      },
      {
        space: "annex",
        surface: {
          id: "annex-floor",
          kind: "floor",
          polygon: [
            { x: 5, y: 0, z: -5 },
            { x: 10, y: 0, z: -5 },
            { x: 10, y: 0, z: 5 },
            { x: 5, y: 0, z: 5 },
          ],
          height: { kind: "constant", value: 0.5 },
        },
      },
    ],
    walkable: ["floor", "annex-floor"],
  };
}
