import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConvexSpaceCell,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { BUILT_CONNECTOR_TEST_HELIX_RADIUS as HELIX_RADIUS } from "./BUILT_CONNECTOR_TEST_HELIX_RADIUS";
import { BUILT_CONNECTOR_TEST_HELIX_RISE as HELIX_RISE } from "./BUILT_CONNECTOR_TEST_HELIX_RISE";
import { BUILT_CONNECTOR_TEST_HELIX_TURNS as HELIX_TURNS } from "./BUILT_CONNECTOR_TEST_HELIX_TURNS";
import { BUILT_CONNECTOR_TEST_NO_ROTATION as NO_ROTATION } from "./BUILT_CONNECTOR_TEST_NO_ROTATION";
import { builtConnectorTestYaw as yaw } from "./builtConnectorTestYaw";
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
 * Four spaces joined by every connector family this stage must express.
 *
 * The spiral stair is the case the old position-only route could not state at
 * all: its stations sit on a helix whose facing turns a quarter each tread, and
 * without a per-station quaternion two treads a quarter turn apart are the same
 * record. The corridor states a varying section instead of a scalar, the ramp
 * states a slope its own route must agree with, and the escalator is its own
 * traversal family rather than a mislabelled stair.
 */
export const builtConnectorTestLevels = (): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "levels",
  units: "meter",
  buildings: [{ id: "unit", element: "root", space: "whole" }],
  models: [{ ...createModel(null), id: "tread" }],
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
      id: "stair-flight",
      kind: "stair-flight",
      parent: "root",
      transform: place(0, 0, 0),
      model: "tread",
      space: "lower",
    },
  ],
  spaces: [
    { id: "whole", kind: "building", parent: null, cells: [] },
    {
      id: "lower",
      kind: "hall",
      parent: "whole",
      cells: [box("lower-cell", { x: -8, y: 0, z: -8 }, { x: 8, y: 3, z: 8 })],
    },
    {
      id: "upper",
      kind: "gallery",
      parent: "whole",
      cells: [box("upper-cell", { x: -8, y: 3, z: -8 }, { x: 8, y: 6, z: 8 })],
    },
    {
      id: "wing",
      kind: "wing",
      parent: "whole",
      cells: [box("wing-cell", { x: 8, y: 0, z: -8 }, { x: 24, y: 3, z: 8 })],
    },
  ],
  boundaries: [],
  openings: [],
  connectors: [
    {
      // A helix: the centre route barely moves in plan, so only the facing
      // tells one tread from the next.
      id: "spiral",
      kind: "stair",
      from: "lower",
      to: "upper",
      bidirectional: true,
      route: Array.from({ length: HELIX_TURNS + 1 }, (_, index) => ({
        x: HELIX_RADIUS * Math.cos((index * Math.PI) / 2),
        y: index * HELIX_RISE,
        z: HELIX_RADIUS * Math.sin((index * Math.PI) / 2),
      })),
      orientations: Array.from({ length: HELIX_TURNS + 1 }, (_, index) =>
        yaw((index * Math.PI) / 2),
      ),
      width: 1.2,
      clearHeight: 2.1,
      elements: ["stair-flight"],
    },
    {
      // A corridor that narrows in the middle and widens again.
      id: "corridor",
      kind: "passage",
      from: "lower",
      to: "wing",
      bidirectional: true,
      route: [
        { x: 0, y: 0, z: 0 },
        { x: 8, y: 0, z: 0 },
        { x: 16, y: 0, z: 0 },
      ],
      sections: [
        { at: 0, width: 3, clearHeight: 2.6 },
        { at: 0.5, width: 1.5, clearHeight: 2.2 },
        { at: 1, width: 3, clearHeight: 2.6 },
      ],
      elements: [],
    },
    {
      id: "ramp",
      kind: "ramp",
      from: "lower",
      to: "upper",
      bidirectional: true,
      route: [
        { x: 4, y: 0, z: 4 },
        { x: 4, y: 3, z: 7 },
      ],
      width: 1.8,
      clearHeight: 2.4,
      slope: Math.PI / 4,
      elements: [],
    },
    {
      id: "flight",
      kind: "stair",
      from: "lower",
      to: "upper",
      bidirectional: true,
      route: [
        { x: -4, y: 0, z: 0 },
        { x: -4, y: 3, z: 4 },
      ],
      width: 1.4,
      clearHeight: 2.2,
      steps: { count: 20, rise: 0.15, run: 0.2 },
      elements: [],
    },
    {
      id: "escalator",
      kind: "escalator",
      from: "lower",
      to: "upper",
      bidirectional: false,
      route: [
        { x: 6, y: 0, z: -6 },
        { x: 6, y: 3, z: -1.5 },
      ],
      width: 1,
      clearHeight: 2.3,
      elements: [],
    },
    {
      id: "travelator",
      kind: "moving-walk",
      from: "lower",
      to: "wing",
      bidirectional: false,
      route: [
        { x: 0, y: 0, z: 6 },
        { x: 12, y: 0, z: 6 },
      ],
      width: 1.2,
      clearHeight: 2.5,
      elements: [],
    },
  ],
  surfaces: [],
  walkable: [],
});
