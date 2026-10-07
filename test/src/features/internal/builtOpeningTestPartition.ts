import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConvexSpaceCell,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { BUILT_OPENING_TEST_NO_ROTATION as NO_ROTATION } from "./BUILT_OPENING_TEST_NO_ROTATION";
import { createModel } from "./fixtures";

const box = (
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

const place = (x = 0, y = 0, z = 0): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: NO_ROTATION,
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * One partition wall carrying every opening family this stage must express.
 *
 * The wall's own frame is the world XY plane, so every planar number below is
 * also a world number and every expectation can be read off by hand. The
 * partition holds a folding double leaf, a double-acting sash, a sliding
 * shutter, a round oculus written as two half turns, and a round-headed arch
 * with no fill at all. None of those is a catalogue entry: each is the same
 * outline-plus-bulge profile and the same one-degree-of-freedom panel.
 */
export const builtOpeningTestPartition = (): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "vestibule",
  units: "meter",
  buildings: [{ id: "unit", element: "root", space: "whole" }],
  models: [{ ...createModel(null), id: "panel" }],
  modelReferences: [],
  elements: [
    {
      id: "root",
      kind: "building",
      parent: null,
      transform: place(),
      model: null,
      space: "whole",
    },
    {
      id: "wall",
      kind: "wall",
      parent: "root",
      transform: place(),
      model: "panel",
      space: "hall",
    },
    {
      id: "door-leaf",
      kind: "door-leaf",
      parent: "root",
      transform: place(1, 0, 0),
      model: "panel",
      space: "hall",
    },
    {
      id: "door-fold",
      kind: "door-leaf",
      parent: "door-leaf",
      transform: place(1, 0, 0),
      model: "panel",
      space: "hall",
    },
    {
      id: "door-frame",
      kind: "frame",
      parent: "root",
      transform: place(1, 0, 0),
      model: "panel",
      space: "hall",
    },
    {
      id: "sash",
      kind: "sash",
      parent: "root",
      transform: place(4, 1, 0),
      model: "panel",
      space: "hall",
    },
    {
      id: "shutter",
      kind: "shutter",
      parent: "root",
      transform: place(6, 0, 0),
      model: "panel",
      space: "hall",
    },
  ],
  spaces: [
    { id: "whole", kind: "building", parent: null, cells: [] },
    {
      id: "hall",
      kind: "room",
      parent: "whole",
      cells: [box("hall-cell", { x: 0, y: 0, z: -4 }, { x: 9, y: 3, z: 0 })],
    },
    {
      id: "yard",
      kind: "court",
      parent: "whole",
      cells: [box("yard-cell", { x: 0, y: 0, z: 0 }, { x: 9, y: 3, z: 4 })],
    },
  ],
  boundaries: [
    {
      id: "partition",
      kind: "wall",
      spaces: ["hall", "yard"],
      elements: ["wall"],
      face: {
        origin: { x: 0, y: 0, z: 0 },
        rotation: NO_ROTATION,
        outline: [
          { x: 0, y: 0 },
          { x: 9, y: 0 },
          { x: 9, y: 3 },
          { x: 0, y: 3 },
        ],
        thickness: 0.2,
      },
    },
    {
      // A boundary with no face at all: the pre-geometry record, kept valid.
      id: "threshold",
      kind: "threshold",
      spaces: ["hall"],
      elements: [],
    },
  ],
  openings: [
    {
      id: "door",
      kind: "door",
      boundary: "partition",
      fill: "door-leaf",
      profile: {
        outline: [
          { x: 1, y: 0 },
          { x: 3, y: 0 },
          { x: 3, y: 2.1 },
          { x: 1, y: 2.1 },
        ],
      },
      operation: {
        panels: [
          {
            id: "outer",
            element: "door-leaf",
            width: 1,
            height: 2.1,
            motion: {
              kind: "revolute",
              axis: { x: 0, y: 1, z: 0 },
              pivot: { x: 0, y: 0, z: 0 },
              min: 0,
              max: Math.PI / 2,
            },
          },
          {
            id: "inner",
            element: "door-fold",
            width: 1,
            height: 2.1,
            motion: {
              kind: "revolute",
              axis: { x: 0, y: 1, z: 0 },
              pivot: { x: 0, y: 0, z: 0 },
              min: 0,
              max: Math.PI / 2,
            },
          },
        ],
        states: [
          {
            id: "closed",
            panels: [
              { panel: "outer", value: 0 },
              { panel: "inner", value: 0 },
            ],
          },
          {
            id: "open",
            panels: [
              { panel: "outer", value: Math.PI / 2 },
              { panel: "inner", value: Math.PI / 2 },
            ],
          },
        ],
        state: "closed",
        hardware: [
          { id: "frame", kind: "frame", element: "door-frame" },
          { id: "handle", kind: "handle", element: null },
        ],
      },
    },
    {
      id: "casement",
      kind: "window",
      boundary: "partition",
      fill: "sash",
      profile: {
        outline: [
          { x: 4, y: 1 },
          { x: 4.8, y: 1 },
          { x: 4.8, y: 2.2 },
          { x: 4, y: 2.2 },
        ],
      },
      operation: {
        panels: [
          {
            id: "leaf",
            element: "sash",
            width: 0.8,
            height: 1.2,
            motion: {
              kind: "revolute",
              axis: { x: 0, y: 1, z: 0 },
              pivot: { x: 0, y: 0, z: 0 },
              min: -Math.PI / 2,
              max: Math.PI / 2,
            },
          },
        ],
        states: [
          { id: "shut", panels: [{ panel: "leaf", value: 0 }] },
          { id: "vent", panels: [{ panel: "leaf", value: Math.PI / 6 }] },
        ],
        state: "shut",
        hardware: [],
      },
    },
    {
      id: "hatch",
      kind: "shutter",
      boundary: "partition",
      fill: "shutter",
      profile: {
        outline: [
          { x: 6, y: 0 },
          { x: 7, y: 0 },
          { x: 7, y: 1 },
          { x: 6, y: 1 },
        ],
      },
      operation: {
        panels: [
          {
            id: "slat",
            element: "shutter",
            width: 1,
            height: 1,
            motion: {
              kind: "prismatic",
              axis: { x: 0, y: 1, z: 0 },
              min: 0,
              max: 1,
            },
          },
        ],
        states: [
          { id: "down", panels: [{ panel: "slat", value: 0 }] },
          { id: "up", panels: [{ panel: "slat", value: 1 }] },
        ],
        state: "down",
        hardware: [],
      },
    },
    {
      // Two corners and two half turns: a circle, not a polygon pretending.
      id: "oculus",
      kind: "window",
      boundary: "partition",
      fill: null,
      profile: {
        outline: [
          { x: 8, y: 2 },
          { x: 8.8, y: 2 },
        ],
        bulges: [1, 1],
      },
    },
    {
      // A round-headed arch: two jambs, a sill, and one bulged head.
      id: "arch",
      kind: "arch",
      boundary: "partition",
      fill: null,
      profile: {
        outline: [
          { x: 1, y: 2.3 },
          { x: 2, y: 2.3 },
          { x: 2, y: 2.4 },
          { x: 1, y: 2.4 },
        ],
        bulges: [0, 0, -1, 0],
      },
    },
    {
      // The pre-geometry record: an opening that states nothing about shape.
      id: "gap",
      kind: "passage",
      boundary: "threshold",
      fill: null,
    },
  ],
  connectors: [
    {
      id: "doorway",
      kind: "passage",
      from: "hall",
      to: "yard",
      bidirectional: true,
      route: [
        { x: 2, y: 0, z: -0.5 },
        { x: 2, y: 0, z: 0.5 },
      ],
      width: 2,
      clearHeight: 2.1,
      elements: [],
    },
  ],
  surfaces: [],
  walkable: [],
});
