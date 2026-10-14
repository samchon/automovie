import {
  IAutoMovieBlocking,
  IAutoMovieClip,
  IAutoMovieLight,
  IAutoMoviePerformance,
  IAutoMovieProductionDesign,
  IAutoMovieProductionLighting,
  IAutoMovieShotBuildContext,
  IAutoMovieShotContract,
  IAutoMovieShotProgram,
  IAutoMovieShotStoryTime,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieCompiledDefinedShot } from "@automovie/engine";
import { compileDefinedShot } from "@automovie/engine";
import { defineShot } from "@automovie/engine";
import { inheritProductionLighting } from "@automovie/engine";
import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { IDENTITY_TRANSFORM, createSkeleton } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

/**
 * The story span the production's source travels across, in story seconds.
 */
const SPAN: number = 600;

/**
 * The production's one declared source, carried at story time zero.
 */
const key: IAutoMovieLight = {
  id: "key",
  type: "directional",
  transform: IDENTITY_TRANSFORM,
  color: { r: 1, g: 1, b: 1, a: null, hex: null },
  intensity: 3,
};

/**
 * A light the scene stages for itself, which the production never addresses.
 */
const practical: IAutoMovieLight = {
  id: "practical",
  type: "point",
  transform: IDENTITY_TRANSFORM,
  color: { r: 1, g: 0.9, b: 0.7, a: null, hex: null },
  intensity: 1.4,
  range: 4,
};

const productionLighting: () => IAutoMovieProductionLighting =
  (): IAutoMovieProductionLighting => ({
    id: "span-light",
    name: null,
    lights: [key],
    motions: [
      {
        id: "keyFades",
        name: null,
        duration: SPAN,
        loop: false,
        tracks: [
          {
            channel: {
              kind: "pointer",
              pointer: "/lights/key/intensity",
              valueType: "scalar",
            },
            times: [0, SPAN],
            values: [3, 1],
            interpolation: "linear",
          },
        ],
      },
    ],
  });

const productionDesign: (
  lighting?: IAutoMovieProductionLighting,
) => IAutoMovieProductionDesign = (
  lighting?: IAutoMovieProductionLighting,
): IAutoMovieProductionDesign => ({
  id: "span",
  title: "One source across a span",
  logline: "A production states its light once and every shot reads it.",
  targetRuntimeSeconds: 8,
  visualDelivery: "deterministic",
  storyClock: {
    units: "second",
    epoch: "Story time zero is the instant the span opens.",
  },
  ...(lighting === undefined ? {} : { lighting }),
  frameFormat: { width: 1920, height: 1080, fps: 24, colorSpace: "srgb" },
  artDirection: {
    style: "primitive-3d",
    palette: ["#101010", "#f0f0f0"],
    silhouettePriority: "Keep every required subject separable from the set.",
    scaleGrammar: "Read scale from the shared ground plane.",
  },
  deliverables: [{ id: "preview", kind: "preview", required: true }],
});

const pinnedContract: (
  id: string,
  storyTime: IAutoMovieShotStoryTime,
) => IAutoMovieShotContract = (
  id: string,
  storyTime: IAutoMovieShotStoryTime,
): IAutoMovieShotContract => ({
  id,
  beat: `beat-${id}`,
  source: { module: `src/shots/${id}.ts`, export: id },
  durationSeconds: 4,
  storyTime,
  participants: [],
  opening: [],
  closing: [],
  camera: {
    intent: "Hold the required subject readable.",
    requiredSubjects: ["knightA"],
    maxOcclusionRatio: 0.2,
  },
  events: [],
  reviewFrames: [{ id: `${id}-entry`, time: 0, passes: ["beauty"] }],
});

/**
 * Assemble the contract and optional lighting fields explicitly for this unit;
 * this constructor does not execute the production builder's context assembly.
 */
const buildContext: (
  design: IAutoMovieProductionDesign,
  contract: IAutoMovieShotContract,
) => Pick<IAutoMovieShotBuildContext, "contract" | "lighting"> = (
  design: IAutoMovieProductionDesign,
  contract: IAutoMovieShotContract,
): Pick<IAutoMovieShotBuildContext, "contract" | "lighting"> => ({
  contract,
  lighting: design.lighting,
});

/**
 * What one shot is lit by at its own opening moment.
 */
const openingLights: (
  context: Pick<IAutoMovieShotBuildContext, "contract" | "lighting">,
  staged: readonly IAutoMovieLight[],
) => IAutoMovieLight[] = (
  context: Pick<IAutoMovieShotBuildContext, "contract" | "lighting">,
  staged: readonly IAutoMovieLight[],
): IAutoMovieLight[] =>
  inheritProductionLighting({
    lighting: context.lighting ?? null,
    lights: staged,
    pin: context.contract.storyTime ?? null,
    seconds: 0,
  });

const intensityOf: (
  lights: readonly IAutoMovieLight[],
  id: string,
) => number = (lights: readonly IAutoMovieLight[], id: string): number =>
  lights.find((light: IAutoMovieLight): boolean => light.id === id)!.intensity;

/**
 * The shot program the engine ladder compiles, with room for a light clip.
 */
const shotProgram: (
  lightMotions?: IAutoMovieClip[],
) => IAutoMovieShotProgram & { lightMotions?: IAutoMovieClip[] } = (
  lightMotions?: IAutoMovieClip[],
): IAutoMovieShotProgram & { lightMotions?: IAutoMovieClip[] } => {
  const blocking: IAutoMovieBlocking = makeBlockingWrite();
  const performance: IAutoMoviePerformance = makePerformanceWrite();
  blocking.camera.framing = "full";
  blocking.rationale =
    "full static keeps both required actor roots readable throughout.";
  for (const action of performance.draft)
    if (action.verb === "frame") action.framing = "full";
  return {
    actors: [
      { node: "knightA", model: "knightA", speed: 1, eyeHeight: 1.6 },
      { node: "knightB", model: "knightB", speed: 1, eyeHeight: 1.6 },
    ],
    script: makeScriptWrite(),
    stage: makeStagingWrite(),
    blocking,
    performance,
    eventSamples: [],
    ...(lightMotions === undefined ? {} : { lightMotions }),
  };
};

/**
 * A clip dimming the staged source over this shot's own two seconds.
 */
const dim: () => IAutoMovieClip = (): IAutoMovieClip => ({
  id: "sunDims",
  name: null,
  duration: 2,
  loop: false,
  tracks: [
    {
      channel: {
        kind: "pointer",
        pointer: "/lights/sun/intensity",
        valueType: "scalar",
      },
      times: [0, 2],
      values: [1, 0.25],
      interpolation: "linear",
    },
  ],
});

const compileWith: (
  lightMotions?: IAutoMovieClip[],
) => IAutoMovieCompiledDefinedShot = (
  lightMotions?: IAutoMovieClip[],
): IAutoMovieCompiledDefinedShot => {
  const program: IAutoMovieShotProgram & { lightMotions?: IAutoMovieClip[] } =
    shotProgram(lightMotions);
  return compileDefinedShot({
    shot: defineShot("SB-LIGHT", {
      scene: "scene-duel",
      contract: {
        beat: "beat-1",
        durationSeconds: 2,
        participants: [
          { kind: "actor", id: "knightA" },
          { kind: "actor", id: "knightB" },
        ],
        opening: [],
        closing: [],
        camera: {
          intent: "Keep both figures readable.",
          requiredSubjects: ["knightA", "knightB"],
          maxOcclusionRatio: 0.2,
        },
        events: [],
        reviewFrames: [{ id: "middle", time: 1, passes: ["beauty"] }],
      },
      build: (): IAutoMovieShotProgram & { lightMotions?: IAutoMovieClip[] } =>
        program,
    }),
    context: undefined,
    runtime: {
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
      frameFormat: { width: 1920, height: 1080 },
      // Pass the authored optional field through the real engine runtime seam.
      lightMotions: program.lightMotions,
    },
  });
};

/**
 * Resolves story lighting from explicitly assembled context fields and compiles shot programs with or without lightMotions, checking resulting intensities, identities and clip admission.
 *
 * Scenarios:
 * 1. Resolve two explicitly assembled story contexts and preserve practical intensity.
 * 2. Preserve staged light identity/order/count when production lighting is absent.
 * 3. Compile authored and omitted shot lightMotions, checking clip identity and pointer kind.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves story lighting from explicitly assembled context fields and compiles shot programs with or without lightMotions, checking resulting intensities, identities and clip admission.
 * @evidence contracts/testing.md#independent-expectations A source intensity ramp 3 to 1 gives 2 at half span within canonical nclose; authored pins and light ids determine expectations. The test constructs buildContext itself and does not prove production-builder context assembly. Compilation checks clip id/count and pointer kind, without independently checking its pointer text, values or rendered light animation.
 * @evidence contracts/testing.md#distinguishing-cases Retains two story moments, unchanged practical light, omitted production lighting and authored/absent shot light clips. Context assembly is test-owned; this unit exercises the portable Engine seams.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_production_lighting_wiring unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_production_lighting_wiring(): void {
  const design: IAutoMovieProductionDesign =
    productionDesign(productionLighting());
  const opening: Pick<IAutoMovieShotBuildContext, "contract" | "lighting"> =
    buildContext(
      design,
      pinnedContract("opening", {
        originSeconds: 0,
      }),
    );
  const later: Pick<IAutoMovieShotBuildContext, "contract" | "lighting"> =
    buildContext(
      design,
      pinnedContract("later", {
        originSeconds: SPAN / 2,
      }),
    );
  const staged: IAutoMovieLight[] = [key, practical];
  TestValidator.predicate(
    "one declared source lights two shots differently at different story times",
    opening.lighting !== undefined &&
      later.lighting !== undefined &&
      nclose(intensityOf(openingLights(opening, staged), "key"), 3) &&
      nclose(intensityOf(openingLights(later, staged), "key"), 2) &&
      nclose(intensityOf(openingLights(later, staged), "practical"), 1.4),
  );

  const unlit: Pick<IAutoMovieShotBuildContext, "contract" | "lighting"> =
    buildContext(
      productionDesign(),
      pinnedContract("unlit", { originSeconds: 0 }),
    );
  TestValidator.equals(
    "a production stating no lighting leaves the staged lights unchanged",
    namedFacts([
      ["declares nothing", (): boolean => unlit.lighting === undefined],
      [
        "same lights, in order",
        (): boolean =>
          openingLights(unlit, staged).every(
            (light: IAutoMovieLight, index: number): boolean =>
              light === staged[index],
          ),
      ],
      ["same count", (): boolean => openingLights(unlit, staged).length === 2],
    ]),
    {
      "declares nothing": true,
      "same lights, in order": true,
      "same count": true,
    },
  );

  const lit: IAutoMovieCompiledDefinedShot = compileWith([dim()]);
  const dark: IAutoMovieCompiledDefinedShot = compileWith();
  TestValidator.equals(
    "a shot's own light clips reach the compiled shot",
    namedFacts([
      ["compiles", (): boolean => lit.success],
      [
        "carries one clip",
        (): boolean =>
          lit.success && lit.source.shot.lightMotions?.length === 1,
      ],
      [
        "carries the authored clip",
        (): boolean =>
          lit.success && lit.source.shot.lightMotions?.[0]?.id === "sunDims",
      ],
      [
        "preserves pointer channel kind",
        (): boolean =>
          lit.success &&
          lit.source.shot.lightMotions?.[0]?.tracks[0]?.channel.kind ===
            "pointer",
      ],
      ["a program stating none compiles", (): boolean => dark.success],
      [
        "and carries no light field",
        (): boolean =>
          dark.success && "lightMotions" in dark.source.shot === false,
      ],
    ]),
    {
      compiles: true,
      "carries one clip": true,
      "carries the authored clip": true,
      "preserves pointer channel kind": true,
      "a program stating none compiles": true,
      "and carries no light field": true,
    },
  );
}
