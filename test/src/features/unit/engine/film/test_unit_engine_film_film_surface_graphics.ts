import { createBook, createDevice } from "@automovie/archetypes";
import {
  performShot,
  sampleSurfaceGraphicKey,
  stageScene,
  validateShotArtifact,
} from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieModel,
  IAutoMoviePerformShotProps,
  IAutoMoviePerformedShot,
  IAutoMovieScript,
  IAutoMovieStagedSet,
  IAutoMovieSurfaceGraphic,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../../../internal/filmFixtures";

/**
 * A surface graphic track is admitted against the prop's `surface` affordance
 * and shows exactly the key in force at any shot time.
 *
 * Scenarios:
 *
 * 1. A phone's `screen` track with keys at 0 and 0.4 s compiles; sampling at 0.399
 *    s, 0.4 s, 0.9 s and then 0.1 s (a reverse seek) reads keys 0, 1, 1 and 0,
 *    and the compiled shot passes the structural shot artifact gate.
 * 2. Each refusal raises its own diagnostic at its own path: a node that is not
 *    staged, a surface id that is not a `surface` affordance, two tracks for
 *    one node and surface, keys out of order and a first key after zero, a
 *    negative layer corner, a nonpositive layer size, a layer past the face's
 *    right edge, a negative luminance, a text layer
 *    naming a font the shot does not list, a feed of the shot's own camera,
 *    reported as an authoring finding rather than thrown as an engine defect,
 *    and a feed of a camera the scene does not stage.
 * 3. A track on the book's `face`, which rides the `hinge` articulation, is
 *    refused with the articulated-surface diagnostic.
 */
export function test_unit_engine_film_film_surface_graphics(): void {
  const phone: IAutoMovieModel = createDevice({
    id: "phone",
    kind: "phone",
  });
  const book: IAutoMovieModel = createBook({ id: "book" });
  const script: IAutoMovieScript = makeScriptWrite();
  const staged: IAutoMovieStagedSet = stageScene(
    script,
    makeStagingWrite({
      set: [
        { node: "phone-a", model: phone.id, position: { x: 1, y: 1, z: 0 } },
        { node: "novel", model: book.id, position: { x: 2, y: 1, z: 0 } },
      ],
    }),
  );
  if (!staged.success) throw new Error(JSON.stringify(staged.violations));
  const props: IAutoMoviePerformShotProps = {
    script,
    staged,
    performance: makePerformanceWrite({ duration: 1, draft: [] }),
    synthesize: (): null => null,
    skeleton: (): null => null,
    models: [phone, book],
  };
  const graphic: (
    layers?: IAutoMovieSurfaceGraphic["layers"],
    luminance?: number,
  ) => IAutoMovieSurfaceGraphic = (
    layers: IAutoMovieSurfaceGraphic["layers"] = [],
    luminance: number = 200,
  ): IAutoMovieSurfaceGraphic => ({
    emission: { kind: "emissive", luminance },
    background: { r: 0, g: 0, b: 0, a: null, hex: null },
    layers,
  });
  const red: IAutoMovieSurfaceGraphic = graphic([
    {
      kind: "rect",
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.5,
      color: { r: 1, g: 0, b: 0, a: null, hex: null },
    },
  ]);
  const track: IAutoMovieSurfaceGraphicTrack = {
    node: "phone-a",
    surface: "screen",
    keys: [
      { time: 0, graphic: graphic() },
      { time: 0.4, graphic: red },
    ],
  };

  // 1. Admission and the key in force.
  const performed: IAutoMoviePerformedShot = performShot({
    ...props,
    surfaceGraphics: [track],
  });
  if (!performed.success) throw new Error(JSON.stringify(performed.violations));
  const admitted: IAutoMovieSurfaceGraphicTrack =
    performed.shot.surfaceGraphics![0]!;
  TestValidator.equals("admitted copy", admitted, track);
  TestValidator.equals(
    "keys before, at and after the cue, then a reverse seek",
    [0.399, 0.4, 0.9, 0.1].map((seconds: number): number =>
      sampleSurfaceGraphicKey(admitted, seconds),
    ),
    [0, 1, 1, 0],
  );
  TestValidator.equals(
    "the compiled shot passes the structural gate",
    validateShotArtifact(performed.shot, staged.scene, null).success,
    true,
  );

  // 2. Each refusal raises its own diagnostic.
  const refusals: [string, IAutoMovieSurfaceGraphicTrack[], string, string][] =
    [
      [
        "unstaged node",
        [{ ...track, node: "ghost" }],
        "$input.surfaceGraphics[0].node",
        "staged prop node",
      ],
      [
        "not a surface affordance",
        [{ ...track, surface: "grip" }],
        "$input.surfaceGraphics[0].surface",
        '"surface" affordance',
      ],
      [
        "duplicate node and surface",
        [track, track],
        "$input.surfaceGraphics[1].surface",
        "one surface graphic track per node and surface",
      ],
      [
        "keys out of order",
        [{ ...track, keys: [track.keys[0]!, { ...track.keys[1]!, time: 0 }] }],
        "$input.surfaceGraphics[0].keys[1].time",
        "strictly increase",
      ],
      [
        "first key after zero",
        [{ ...track, keys: [{ ...track.keys[1]! }] }],
        "$input.surfaceGraphics[0].keys[0].time",
        "first time must be zero",
      ],
      [
        "negative corner",
        [layerTrack(track, { x: -0.1 })],
        "$input.surfaceGraphics[0].keys[0].graphic.layers[0].x",
        "layer x",
      ],
      [
        "nonpositive size",
        [layerTrack(track, { width: 0 })],
        "$input.surfaceGraphics[0].keys[0].graphic.layers[0].width",
        "layer width",
      ],
      [
        "past the right edge",
        [layerTrack(track, { x: 0.6, width: 0.5 })],
        "$input.surfaceGraphics[0].keys[0].graphic.layers[0].width",
        "x + width must be at most 1",
      ],
      [
        "negative luminance",
        [{ ...track, keys: [{ time: 0, graphic: graphic([], -1) }] }],
        "$input.surfaceGraphics[0].keys[0].graphic.emission.luminance",
        "emissive luminance",
      ],
      [
        "text in a font the shot does not list",
        [
          {
            ...track,
            keys: [
              {
                time: 0,
                graphic: graphic([
                  {
                    kind: "text",
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1,
                    font: "missing",
                    text: "LO",
                    size: 0.1,
                    color: { r: 1, g: 1, b: 1, a: null, hex: null },
                  },
                ]),
              },
            ],
          },
        ],
        "$input.surfaceGraphics[0].keys[0].graphic.layers[0].font",
        "font source the shot lists",
      ],
      [
        "a feed of the shot's own camera",
        [feedTrack(track, performed.shot.camera)],
        "$input.surfaceGraphics[0].keys[0].graphic.layers[0].camera",
        "must not be the shot's own camera",
      ],
      [
        "a feed of a camera the scene does not stage",
        [feedTrack(track, "nowhere")],
        "$input.surfaceGraphics[0].keys[0].graphic.layers[0].camera",
        "camera the scene stages",
      ],
      // 3. The book's face rides its hinge.
      [
        "articulated surface",
        [{ ...track, node: "novel", surface: "face" }],
        "$input.surfaceGraphics[0].surface",
        'rides articulation "hinge"',
      ],
    ];
  for (const [title, tracks, path, text] of refusals) {
    const result: IAutoMoviePerformedShot = performShot({
      ...props,
      surfaceGraphics: tracks,
    });
    TestValidator.predicate(
      `${title} is refused at ${path}`,
      result.success === false &&
        result.violations.some(
          (violation: IAutoMovieConstraintViolation): boolean =>
            violation.path === path && violation.expected.includes(text),
        ),
    );
  }
}

/** The track with one red rect layer whose box fields are overridden. */
function layerTrack(
  track: IAutoMovieSurfaceGraphicTrack,
  box: Partial<{ x: number; y: number; width: number; height: number }>,
): IAutoMovieSurfaceGraphicTrack {
  return {
    ...track,
    keys: [
      {
        time: 0,
        graphic: {
          emission: { kind: "printed" },
          background: null,
          layers: [
            {
              kind: "rect",
              x: 0,
              y: 0,
              width: 0.5,
              height: 0.5,
              ...box,
              color: { r: 1, g: 0, b: 0, a: null, hex: null },
            },
          ],
        },
      },
    ],
  };
}

/** The track with one whole-face feed layer of `camera`. */
function feedTrack(
  track: IAutoMovieSurfaceGraphicTrack,
  camera: string,
): IAutoMovieSurfaceGraphicTrack {
  return {
    ...track,
    keys: [
      {
        time: 0,
        graphic: {
          emission: { kind: "emissive", luminance: 200 },
          background: { r: 0, g: 0, b: 0, a: null, hex: null },
          layers: [
            {
              kind: "feed",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              camera,
              pixels: 64,
            },
          ],
        },
      },
    ],
  };
}
