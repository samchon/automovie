import {
  compileCameraMove,
  computeModelRestExtentY,
  realizeShotContract,
} from "@automovie/engine";
import type {
  IAutoMovieCamera,
  IAutoMovieCameraAction,
  IAutoMovieClip,
  IAutoMovieFormationDesign,
  IAutoMovieModel,
  IAutoMovieShotContract,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

const NODE: string = "civic/entry-canopy";

/** The deck hangs 8 m above the element origin and is 4 m tall. */
const FLOOR: number = 8;
const HEIGHT: number = 4;
/** Keep this vertical-floor fixture outside every solved camera's near plane. */
const THICKNESS: number = 0.2;

const transform: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * A canopy authored the way a building element is: the element origin sits on
 * the ground where the building was placed, and the geometry it draws stands
 * 8 m up in the air. Nothing about the model is unusual — this is what a
 * lowered `<environment>/<element>` set piece looks like whenever the part is
 * not authored around its own origin.
 */
const canopy: () => IAutoMovieModel = (): IAutoMovieModel => ({
  id: "canopy-model",
  name: null,
  origin: "generated",
  parts: [
    {
      id: "deck",
      name: null,
      geometry: {
        type: "primitive",
        shape: {
          type: "box",
          width: 12,
          height: HEIGHT,
          depth: THICKNESS,
        },
      },
      material: null,
      attachedBone: null,
      transform: transform(0, FLOOR + HEIGHT / 2, 0),
    },
  ],
  skeleton: null,
  body: null,
  materials: [],
  asset: null,
});

const camera: () => IAutoMovieCamera = (): IAutoMovieCamera => ({
  id: "cam",
  transform: transform(0, 2, 40),
  fovY: 40,
  near: 0.1,
  far: 500,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
});

const action: (
  framing: IAutoMovieCameraAction["framing"],
) => IAutoMovieCameraAction = (
  framing: IAutoMovieCameraAction["framing"],
): IAutoMovieCameraAction => ({
  verb: "frame",
  actor: "cam",
  start: 0,
  duration: "auto",
  framing,
  move: "static",
  on: { kind: "node", node: NODE },
});

/**
 * Compile a camera from an explicitly supplied framed base. The test chooses
 * the measured floor itself; this helper does not call performShot.
 */
const solve: (
  framing: IAutoMovieCameraAction["framing"],
  baseY: number,
) => IAutoMovieClip | null = (
  framing: IAutoMovieCameraAction["framing"],
  baseY: number,
): IAutoMovieClip | null =>
  compileCameraMove({
    clipId: "clip",
    camera: camera(),
    entries: [
      {
        action: action(framing),
        subject: { base: { x: 0, y: baseY, z: 0 }, height: HEIGHT, at: null },
      },
    ],
    shotDuration: 2,
    aspect: 16 / 9,
  });

const contract: () => IAutoMovieShotContract = (): IAutoMovieShotContract => ({
  id: "shot-canopy",
  beat: "beat",
  source: { module: "src/shots/canopy.ts", export: "shot" },
  durationSeconds: 2,
  participants: [],
  opening: [],
  closing: [],
  camera: {
    intent: "hold the entry canopy",
    requiredSubjects: [NODE],
    maxOcclusionRatio: 1,
  },
  events: [],
  reviewFrames: [{ id: "mid", time: 1, passes: ["beauty"] }],
});

/**
 * Grade the contract for one staged model under one solved camera, and report
 * what the builder found at each of the three contract samples.
 */
const grade: (
  model: IAutoMovieModel | null,
  cameraMotion: IAutoMovieClip | null,
) => {
  samples: number;
  resolved: number[];
  readable: number[];
  refused: boolean;
} = (
  model: IAutoMovieModel | null,
  cameraMotion: IAutoMovieClip | null,
): {
  samples: number;
  resolved: number[];
  readable: number[];
  refused: boolean;
} => {
  const result: ReturnType<typeof realizeShotContract> = realizeShotContract({
    contract: contract(),
    production: null,
    frameFormat: { width: 1920, height: 1080 },
    world: null,
    formations: new Map<string, IAutoMovieFormationDesign>(),
    compiled: {
      eventSamples: [],
      scene: {
        id: "scene",
        name: null,
        nodes: [
          {
            id: NODE,
            // A node always names a model; `null` here is the staged node
            // whose model is not among the compiled ones, which is the path
            // that falls back to the stand-in span.
            model: model === null ? "unstaged-model" : model.id,
            transform: transform(0, 0, 0),
            pose: null,
            motion: null,
          },
        ],
        cameras: [camera()],
        lights: [],
      },
      motions: [],
      shot: {
        id: "shot-canopy",
        name: null,
        scene: "scene",
        camera: "cam",
        duration: 2,
        performances: [],
        objectMotions: [],
        cameraMotion,
      },
      models: model === null ? [] : [model],
    },
    collisions: [],
  });
  return {
    samples: result.realization.camera.length,
    resolved: result.realization.camera.map(
      (
        entry: ReturnType<
          typeof realizeShotContract
        >["realization"]["camera"][number],
      ): number => entry.resolvedSubjects,
    ),
    readable: result.realization.camera.map(
      (
        entry: ReturnType<
          typeof realizeShotContract
        >["realization"]["camera"][number],
      ): number => entry.readableSubjects,
    ),
    refused: result.diagnostics.length !== 0,
  };
};

/** Every contract sample found the one required subject readable. */
const allRead: (graded: ReturnType<typeof grade>) => boolean = (
  graded: ReturnType<typeof grade>,
): boolean =>
  graded.samples === 3 &&
  graded.resolved.every((count: number): boolean => count === 1) &&
  graded.readable.every((count: number): boolean => count === 1) &&
  graded.refused === false;

/**
 * A required node subject is graded on the box its geometry actually fills,
 * not on one hanging off its node origin.
 *
 * The authored box has a floor 8 metres above the node origin. Compilation
 * receives that floor explicitly, while realizeShotContract independently
 * measures the compiled model. Agreement must persist at each sampled time;
 * a close camera aimed at the origin is the negative twin. This composition
 * does not exercise performShot's selection of the framed base or prove any
 * rendered view, complete enclosure, or occlusion result.
 *
 * Scenarios:
 *
 * 1. The fixture draws where it claims to: the model's rest extent runs 8 … 12,
 *    so every number below is about a floor of exactly 8 m.
 * 2. Every shot size grades the canopy readable at all three contract samples
 *    and raises no diagnostic. `full`, `medium` and `close` are the three that
 *    failed before the floor was carried; `wide` is the control that passed
 *    either way, so a green run at `wide` alone would be no evidence.
 * 3. The negative twin: the same subject under a camera solved as though the
 *    deck stood on the placement reads at no sample and is refused. Carrying
 *    the floor made the two sides agree; it did not make readability
 *    unconditional.
 * 4. A model drawn from its own origin upward has a zero floor, so its grade is
 *    readable under a camera aimed at that origin.
 * 5. A node with no model keeps the stand-in span measured from the placement
 *    itself: neither a rig span nor `DEFAULT_SUBJECT_HEIGHT` states a floor, so
 *    there is none to carry and a camera framed on the placement still reads.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures the canopy's model-space floor and composes compileCameraMove with realizeShotContract to check one required node at the contract's opening, review, and closing samples.
 * @evidence contracts/testing.md#independent-expectations The fixture's four-metre box is centred ten metres above the origin, independently giving the 8..12 extent. Fixed readability counts and diagnostics expectations follow the deliberately matched or mismatched camera floor, not a reused grader result.
 * @evidence contracts/testing.md#distinguishing-cases All four shot sizes must read the raised model; close framing on floor zero must resolve but fail to read it. A grounded model and an absent compiled model distinguish carried geometric floors from zero-floor and stand-in behavior.
 * @evidence contracts/testing.md#execution-ownership Uses local model, scene, camera, and contract records in synchronous engine operations without a renderer, filesystem, process state, clocks, or dependency replacement; the test checks sampled numerical grading and diagnostics only.
 */
export function test_film_camera_node_subject_floor(): void {
  const framings: readonly ["wide", "full", "medium", "close"] = [
    "wide",
    "full",
    "medium",
    "close",
  ];
  const model: IAutoMovieModel = canopy();
  const extent: ReturnType<typeof computeModelRestExtentY> =
    computeModelRestExtentY(model);

  TestValidator.equals(
    "the fixture draws its deck eight metres above the node origin",
    {
      present: extent !== null,
      keys:
        extent === null
          ? []
          : Object.keys(extent).sort((a: string, b: string): number =>
              a < b ? -1 : a > b ? 1 : 0,
            ),
      min: extent !== null && nclose(extent.min, FLOOR),
      max: extent !== null && nclose(extent.max, FLOOR + HEIGHT),
    },
    { present: true, keys: ["max", "min"], min: true, max: true },
  );

  TestValidator.equals(
    "every shot size grades the canopy readable at every sample",
    namedFacts(
      framings.map(
        (
          framing: IAutoMovieCameraAction["framing"],
        ): [string, () => boolean] => [
          framing,
          (): boolean => allRead(grade(model, solve(framing, FLOOR))),
        ],
      ),
    ),
    { wide: true, full: true, medium: true, close: true },
  );

  const misaimed: ReturnType<typeof grade> = grade(model, solve("close", 0));
  TestValidator.equals(
    "a camera aimed at the placement still fails to read the raised deck",
    namedFacts([
      [
        "resolvedEverySample",
        (): boolean => misaimed.resolved.every((c: number): boolean => c === 1),
      ],
      [
        "readAtNoSample",
        (): boolean => misaimed.readable.every((c: number): boolean => c === 0),
      ],
      ["refused", (): boolean => misaimed.refused],
    ]),
    { resolvedEverySample: true, readAtNoSample: true, refused: true },
  );

  const grounded: IAutoMovieModel = {
    ...model,
    id: "grounded-model",
    parts: [{ ...model.parts[0]!, transform: transform(0, HEIGHT / 2, 0) }],
  };
  TestValidator.equals(
    "a model standing on its origin has a zero floor and an unchanged grade",
    namedFacts([
      [
        "zeroFloor",
        (): boolean =>
          nclose(computeModelRestExtentY(grounded)?.min ?? Number.NaN, 0),
      ],
      ["readable", (): boolean => allRead(grade(grounded, solve("close", 0)))],
    ]),
    { zeroFloor: true, readable: true },
  );

  TestValidator.equals(
    "a node with no model keeps the stand-in span at its placement",
    allRead(grade(null, solve("full", 0))),
    true,
  );
}
