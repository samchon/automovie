import { type IAutoMovieVector3, IAutoMovieConvexSpaceCell, IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { createModel } from "./fixtures";
import { builtEnvironmentTestTransform as transform } from "./builtEnvironmentTestTransform";


const boxCell = (
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


/** Create the independently linked visible, logical and traversal graphs of the tower. */
export const builtEnvironmentTestBuilding = (): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "tower",
  units: "meter",
  buildings: [{ id: "tower-a", element: "root", space: "whole" }],
  models: [{ ...createModel(null), id: "slab" }],
  modelReferences: ["external-stone"],
  elements: [
    {
      id: "root",
      kind: "building",
      parent: null,
      transform: transform(10),
      model: null,
      space: "whole",
    },
    {
      id: "ground-slab",
      kind: "slab",
      parent: "root",
      transform: transform(
        2,
        0,
        0,
        { x: 0, y: 0, z: 0, w: 1 },
        {
          x: 4,
          y: 0.2,
          z: 3,
        },
      ),
      model: "slab",
      space: "ground",
    },
    {
      id: "bridge",
      kind: "skybridge",
      parent: "root",
      transform: transform(0, 4, 0, {
        x: 0,
        y: 0,
        z: Math.SQRT1_2,
        w: Math.SQRT1_2,
      }),
      model: "external-stone",
      space: "upper",
    },
    {
      id: "helipad",
      kind: "roof-helipad",
      parent: "root",
      transform: transform(0, 7, 0),
      model: "slab",
      space: "roof",
    },
    {
      id: "curtain-wall",
      kind: "envelope",
      parent: "root",
      transform: transform(5, 3.5, 0),
      model: "slab",
      space: null,
    },
  ],
  spaces: [
    { id: "whole", kind: "building", parent: null, cells: [] },
    {
      id: "ground",
      kind: "double-height-hall",
      parent: "whole",
      cells: [
        boxCell("ground-cell", { x: 5, y: 0, z: -5 }, { x: 15, y: 4, z: 5 }),
      ],
    },
    {
      id: "upper",
      kind: "mezzanine",
      parent: "whole",
      cells: [
        boxCell("upper-cell", { x: 5, y: 4, z: -5 }, { x: 15, y: 7, z: 5 }),
      ],
    },
    {
      id: "roof",
      kind: "roof-deck",
      parent: "whole",
      cells: [
        boxCell("roof-cell", { x: 5, y: 7, z: -5 }, { x: 15, y: 8, z: 5 }),
      ],
    },
  ],
  boundaries: [
    {
      id: "mezzanine-edge",
      kind: "open-edge",
      spaces: ["ground", "upper"],
      elements: ["bridge"],
    },
    {
      id: "facade",
      kind: "wall",
      spaces: ["ground"],
      elements: [],
    },
  ],
  openings: [
    {
      id: "arched-door",
      kind: "arch",
      boundary: "facade",
      fill: null,
    },
  ],
  connectors: [
    {
      id: "grand-stair",
      kind: "stair",
      from: "ground",
      to: "upper",
      bidirectional: true,
      route: [
        { x: 8, y: 0, z: 0 },
        { x: 10, y: 4, z: 0 },
      ],
      width: 2,
      clearHeight: 3,
      elements: ["bridge"],
    },
    {
      id: "service-lift",
      kind: "lift",
      from: "ground",
      to: "roof",
      bidirectional: true,
      route: [
        { x: 13, y: 0, z: 0 },
        { x: 13, y: 7, z: 0 },
      ],
      width: 1.5,
      clearHeight: 2.4,
      elements: [],
    },
    {
      id: "facade-ladder",
      kind: "ladder",
      from: "roof",
      to: "upper",
      bidirectional: false,
      route: [
        { x: 15, y: 7, z: 0 },
        { x: 15, y: 4, z: 0 },
      ],
      width: 0.5,
      clearHeight: 2,
      elements: [],
    },
  ],
  surfaces: [
    {
      space: "ground",
      surface: {
        id: "ground-floor",
        kind: "floor",
        polygon: [
          { x: 5, y: 0, z: -5 },
          { x: 15, y: 0, z: -5 },
          { x: 15, y: 0, z: 5 },
          { x: 5, y: 0, z: 5 },
        ],
        anchor: { x: 5, y: 0, z: -5 },
        rampTo: null,
      },
    },
    {
      space: "upper",
      surface: {
        id: "upper-floor",
        kind: "floor",
        polygon: [
          { x: 5, y: 0, z: -5 },
          { x: 15, y: 0, z: -5 },
          { x: 15, y: 0, z: 5 },
          { x: 5, y: 0, z: 5 },
        ],
        anchor: { x: 5, y: 4, z: -5 },
        rampTo: null,
      },
    },
    {
      space: "roof",
      surface: {
        id: "helipad-deck",
        kind: "platform",
        polygon: [
          { x: 7, y: 0, z: -3 },
          { x: 13, y: 0, z: -3 },
          { x: 13, y: 0, z: 3 },
          { x: 7, y: 0, z: 3 },
        ],
        anchor: { x: 7, y: 7, z: -3 },
        rampTo: null,
      },
    },
  ],
  walkable: ["ground-floor", "upper-floor"],
});
