import { measureAutoMovieGeometry } from "@automovie/engine";
import {
  AutoMovieGeometryQuery,
  IAutoMovieCamera,
  IAutoMovieClip,
  IAutoMovieCompiledShotSource,
  IAutoMovieGeometryResult,
  IAutoMovieModel,
  IAutoMovieSceneNode,
  IAutoMovieShot,
  IAutoMovieTransform,
  type IAutoMovieVector3,
  IAutoMovieWorldDesign,
} from "@automovie/interface";

import { GEOMETRY_SELECTOR_TEST_WORLD as WORLD } from "./GEOMETRY_SELECTOR_TEST_WORLD";
import {
  createModel,
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "./fixtures";

const place = (
  translation: IAutoMovieVector3,
  rotation = { x: 0, y: 0, z: 0, w: 1 },
  scale = { x: 1, y: 1, z: 1 },
): IAutoMovieTransform => ({ translation, rotation, scale });

/** A two-second clip whose every key holds the root one metre forward. */
const WALK = {
  ...makeMotion(
    [
      keyframe(
        0,
        makePose(
          [joint("leftLowerArm", { flexion: 10 })],
          place({ x: 0, y: 0, z: 1 }),
        ),
      ),
      keyframe(
        2,
        makePose(
          [joint("leftLowerArm", { flexion: 10 })],
          place({ x: 0, y: 0, z: 1 }),
        ),
      ),
    ],
    2,
  ),
  id: "walk",
};

const PROP: IAutoMovieModel = { ...createModel(null), id: "prop" };

const RIGGED: IAutoMovieModel = {
  ...createModel(createSkeleton()),
  id: "rigged",
};

const QUARTER_Y = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };

const node = (
  id: string,
  model: string,
  transform: IAutoMovieTransform,
  extra: Partial<IAutoMovieSceneNode> = {},
): IAutoMovieSceneNode => ({
  id,
  model,
  transform,
  motion: null,
  pose: null,
  ...extra,
});

/** Eight metres along +x over four seconds, under a fixed quarter turn and doubled scale. */
const CART_PATH: IAutoMovieClip = {
  id: "cart-path",
  name: null,
  duration: 4,
  loop: false,
  tracks: [
    {
      channel: { kind: "node", node: "cart", path: "translation" },
      times: [0, 4],
      values: [0, 0, 0, 8, 0, 0],
      interpolation: "linear",
    },
    {
      channel: { kind: "node", node: "cart", path: "rotation" },
      times: [0, 4],
      values: [
        0,
        Math.SQRT1_2,
        0,
        Math.SQRT1_2,
        0,
        Math.SQRT1_2,
        0,
        Math.SQRT1_2,
      ],
      interpolation: "linear",
    },
    {
      channel: { kind: "node", node: "cart", path: "scale" },
      times: [0, 4],
      values: [2, 2, 2, 2, 2, 2],
      interpolation: "linear",
    },
  ],
};

const shot = (
  id: string,
  overrides: Partial<IAutoMovieShot> = {},
): IAutoMovieShot => ({
  id,
  name: null,
  scene: `${id}-scene`,
  camera: "cam",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration: 4,
  ...overrides,
});

const camera: IAutoMovieCamera = {
  id: "cam",
  transform: place({ x: 0, y: 1, z: 10 }),
  fovY: 60,
  near: 0.1,
  far: 100,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
};

const compiled = (
  value: IAutoMovieShot,
  nodes: IAutoMovieSceneNode[],
  models: IAutoMovieModel[],
  motions: IAutoMovieCompiledShotSource["motions"] = [],
): IAutoMovieCompiledShotSource => ({
  eventSamples: [],
  scene: { id: value.scene, name: null, nodes, cameras: [camera], lights: [] },
  motions,
  shot: value,
  models,
  formations: [],
  instanceSets: [],
  formationMotions: [],
  formationSlotMotions: [],
  effects: [],
});

const SHOTS = new Map<string, IAutoMovieCompiledShotSource>([
  [
    "a",
    compiled(
      shot("a", {
        performances: [
          { node: "walker", motion: "walk", startOffset: 0.5 },
          { node: "idle", motion: null, startOffset: 0 },
        ],
        objectMotions: [CART_PATH],
      }),
      [
        node(
          "hero",
          "rigged",
          place({ x: 10, y: 0, z: 0 }, QUARTER_Y, { x: 2, y: 2, z: 2 }),
        ),
        node("crate", "prop", place({ x: 1, y: 2, z: 2 })),
        node("cart", "prop", place({ x: 0, y: 0, z: 0 })),
        node("walker", "rigged", place({ x: 0, y: 0, z: 5 })),
        node("statue", "rigged", place({ x: 3, y: 0, z: 0 }), {
          pose: makePose([joint("leftLowerArm", { flexion: 20 })]),
        }),
        node("idle", "rigged", place({ x: 4, y: 0, z: 0 })),
        node("dancer", "rigged", place({ x: 5, y: 0, z: 0 }), {
          motion: "missing-motion",
        }),
      ],
      [RIGGED, PROP],
      [WALK],
    ),
  ],
  [
    "b",
    compiled(
      shot("b"),
      [node("hero", "rigged", place({ x: 0, y: 0, z: 0 }))],
      [RIGGED],
    ),
  ],
  [
    "c",
    compiled(
      shot("c"),
      [node("ghost", "absent", place({ x: 0, y: 0, z: 0 }))],
      [],
    ),
  ],
]);

/** Evaluate the existing geometry query against the shared compiled shot records. */
export const geometrySelectorTestAsk = (
  request: AutoMovieGeometryQuery,
  world: Pick<
    IAutoMovieWorldDesign,
    "landmarks" | "surfaces" | "routes"
  > | null = WORLD,
): IAutoMovieGeometryResult =>
  measureAutoMovieGeometry({
    request,
    design: {
      production: null,
      world,
      formations: new Map(),
      shots: new Map(),
    },
    compiled: SHOTS,
    timeline: null,
  });
