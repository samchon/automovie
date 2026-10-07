import type {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieConvexSpaceCell,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { BUILT_TOPOLOGY_TEST_ANNEX_TILT as ANNEX_TILT } from "./BUILT_TOPOLOGY_TEST_ANNEX_TILT";
import { BUILT_TOPOLOGY_TEST_WING_YAW as WING_YAW } from "./BUILT_TOPOLOGY_TEST_WING_YAW";
import type { IBuiltTopologyTestSlabHalf } from "./IBuiltTopologyTestSlabHalf";
import { builtTopologyTestRoll as roll } from "./builtTopologyTestRoll";
import { builtTopologyTestYaw as yaw } from "./builtTopologyTestYaw";
import { createModel } from "./fixtures";

const place = (
  x: number,
  y: number,
  z: number,
  rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 },
  scale: IAutoMovieVector3 = { x: 1, y: 1, z: 1 },
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation,
  scale,
});

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

const slab = (
  id: string,
  parent: string,
  y: number,
  space: string | null,
  half: IBuiltTopologyTestSlabHalf = { x: 6, z: 5 },
): IAutoMovieBuiltElement => ({
  id,
  kind: "floor-slab",
  parent,
  transform: place(0, y, 0, undefined, {
    x: half.x * 2,
    y: 0.2,
    z: half.z * 2,
  }),
  model: "stone",
  space,
});

/**
 * One work holding two independently rooted building units and a sky-bridge.
 *
 * The keep stacks levels that are deliberately not a uniform floor grid: a
 * double-height hall, a mezzanine sharing the hall's own air, a void punched
 * from the second level to the attic, one duplex apartment that owns two slabs,
 * an attic, a rotunda, and a yawed wing. The annex is a second unit tilted on
 * its own root. Nothing here is a floor table: a storey is one `kind` string
 * beside `mezzanine`, `duplex`, `void`, `attic`, and `dome`.
 */
export const builtTopologyTestWork = (): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "citadel",
  units: "meter",
  buildings: [
    { id: "keep", element: "keep-root", space: "keep-whole" },
    { id: "annex", element: "annex-root", space: "annex-whole" },
  ],
  models: [{ ...createModel(null), id: "stone" }],
  modelReferences: ["dome-mesh"],
  elements: [
    {
      id: "keep-root",
      kind: "building",
      parent: null,
      transform: place(0, 0, 0),
      model: null,
      space: "keep-whole",
    },
    slab("keep-hall-slab", "keep-root", 0, "hall"),
    {
      ...slab("keep-mezzanine-slab", "keep-root", 4.5, "mezzanine"),
      kind: "mezzanine-slab",
      transform: place(0, 4.5, 3, undefined, { x: 12, y: 0.2, z: 4 }),
    },
    slab("keep-level-2-slab", "keep-root", 9, "storey-2"),
    slab("keep-duplex-lower-slab", "keep-root", 12.2, "duplex"),
    slab("keep-duplex-upper-slab", "keep-root", 15, "duplex"),
    slab("keep-attic-slab", "keep-root", 18, "attic"),
    {
      id: "keep-wing",
      kind: "wing",
      parent: "keep-root",
      transform: place(6, 9, 0, yaw(WING_YAW)),
      model: null,
      space: null,
    },
    {
      id: "keep-wing-slab",
      kind: "floor-slab",
      parent: "keep-wing",
      transform: place(4, 0, 0, undefined, { x: 6, y: 0.2, z: 4 }),
      model: "stone",
      space: "wing-storey",
    },
    {
      id: "keep-dome",
      kind: "dome",
      parent: "keep-root",
      transform: place(0, 18.2, 0),
      model: "dome-mesh",
      space: "rotunda",
    },
    {
      id: "keep-curtain-wall",
      kind: "envelope",
      parent: "keep-root",
      transform: place(0, 4.5, 5.1),
      model: "stone",
      space: null,
    },
    {
      id: "keep-door-leaf",
      kind: "door-leaf",
      parent: "keep-root",
      transform: place(0, 1, -5),
      model: "stone",
      space: "hall",
    },
    {
      id: "annex-root",
      kind: "building",
      parent: null,
      transform: place(30, 0, 0, roll(ANNEX_TILT)),
      model: null,
      space: "annex-whole",
    },
    {
      id: "annex-ground-slab",
      kind: "floor-slab",
      parent: "annex-root",
      transform: place(6, 0, 0, undefined, { x: 8, y: 0.2, z: 6 }),
      model: "stone",
      space: "annex-storey-0",
    },
    {
      id: "annex-upper-slab",
      kind: "floor-slab",
      parent: "annex-root",
      transform: place(6, 4.2, 0, undefined, { x: 8, y: 0.2, z: 6 }),
      model: "stone",
      space: "annex-storey-1",
    },
  ],
  spaces: [
    { id: "keep-whole", kind: "building", parent: null, cells: [] },
    {
      id: "hall",
      kind: "double-height-hall",
      parent: "keep-whole",
      cells: [box("hall-cell", { x: -6, y: 0, z: -5 }, { x: 6, y: 9, z: 5 })],
    },
    {
      id: "mezzanine",
      kind: "mezzanine",
      parent: "keep-whole",
      cells: [
        box("mezzanine-cell", { x: -6, y: 4.5, z: 1 }, { x: 6, y: 9, z: 5 }),
      ],
    },
    {
      // A void is not a storey with a hole: it is its own region, and the
      // storey around it is written as the two convex cells that remain.
      id: "atrium",
      kind: "void",
      parent: "keep-whole",
      cells: [
        box("atrium-cell", { x: -2, y: 9, z: -2 }, { x: 2, y: 18, z: 2 }),
      ],
    },
    {
      id: "storey-2",
      kind: "storey",
      parent: "keep-whole",
      cells: [
        box("storey-2-west", { x: -6, y: 9, z: -5 }, { x: -2, y: 12.2, z: 5 }),
        box("storey-2-east", { x: 2, y: 9, z: -5 }, { x: 6, y: 12.2, z: 5 }),
      ],
    },
    {
      id: "duplex",
      kind: "duplex",
      parent: "keep-whole",
      cells: [
        box("duplex-cell", { x: -6, y: 12.2, z: -5 }, { x: 6, y: 18, z: 5 }),
      ],
    },
    {
      id: "attic",
      kind: "attic",
      parent: "keep-whole",
      cells: [
        box("attic-cell", { x: -6, y: 18, z: -5 }, { x: 6, y: 20, z: 5 }),
      ],
    },
    {
      // The dome's own volume is only approximated by its bounding cell; the
      // curved shell itself lives in the cited mesh, not in this half-space set.
      id: "rotunda",
      kind: "dome",
      parent: "keep-whole",
      cells: [
        box("rotunda-cell", { x: -3, y: 18.2, z: -3 }, { x: 3, y: 21.2, z: 3 }),
      ],
    },
    { id: "wing-storey", kind: "storey", parent: "keep-whole", cells: [] },
    { id: "annex-whole", kind: "building", parent: null, cells: [] },
    { id: "annex-storey-0", kind: "storey", parent: "annex-whole", cells: [] },
    { id: "annex-storey-1", kind: "storey", parent: "annex-whole", cells: [] },
  ],
  boundaries: [
    {
      id: "hall-wall",
      kind: "wall",
      spaces: ["hall"],
      elements: ["keep-curtain-wall"],
    },
    {
      id: "mezzanine-edge",
      kind: "open-edge",
      spaces: ["hall", "mezzanine"],
      elements: [],
    },
  ],
  openings: [
    {
      id: "front-door",
      kind: "door",
      boundary: "hall-wall",
      fill: "keep-door-leaf",
    },
  ],
  connectors: [
    {
      id: "grand-stair",
      kind: "stair",
      from: "hall",
      to: "mezzanine",
      bidirectional: true,
      route: [
        { x: -4, y: 0, z: 4 },
        { x: -4, y: 4.5, z: 1 },
      ],
      width: 1.6,
      clearHeight: 2.4,
      elements: [],
    },
    {
      id: "duplex-stair",
      kind: "stair",
      from: "storey-2",
      to: "duplex",
      bidirectional: true,
      route: [
        { x: 4, y: 9, z: 0 },
        { x: 4, y: 12.2, z: 0 },
      ],
      width: 1.2,
      clearHeight: 2.2,
      elements: [],
    },
    {
      id: "keep-lift",
      kind: "lift",
      from: "hall",
      to: "attic",
      bidirectional: true,
      route: [
        { x: 5, y: 0, z: -4 },
        { x: 5, y: 18, z: -4 },
      ],
      width: 1.5,
      clearHeight: 2.4,
      elements: [],
    },
    {
      // The one relation a work owns rather than a unit: it lands on two
      // different building units, at two different heights.
      id: "skybridge",
      kind: "bridge",
      from: "storey-2",
      to: "annex-storey-1",
      bidirectional: true,
      route: [
        { x: 6, y: 9, z: 0 },
        { x: 35.61, y: 4.71, z: 0 },
      ],
      width: 2.4,
      clearHeight: 2.6,
      elements: [],
    },
  ],
  surfaces: [
    {
      space: "hall",
      surface: {
        id: "hall-floor",
        kind: "floor",
        polygon: [
          { x: -6, y: 0, z: -5 },
          { x: 6, y: 0, z: -5 },
          { x: 6, y: 0, z: 5 },
          { x: -6, y: 0, z: 5 },
        ],
        anchor: { x: -6, y: 0, z: -5 },
        rampTo: null,
      },
    },
  ],
  walkable: ["hall-floor"],
});
