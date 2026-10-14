import type {
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledShotSource,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionSoundEvent,
  IAutoMovieProductionSoundPlan,
  IAutoMovieShotContract,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { materializeCompiledFormation } from "../../../../packages/engine/src/populationRuntime/materializeCompiledFormation";
import { materializeCompiledInstanceSet } from "../../../../packages/engine/src/populationRuntime/materializeCompiledInstanceSet";
import type { IAutoMovieRenderedProductionSound } from "../../../../packages/engine/src/sound/IAutoMovieRenderedProductionSound";
import { deriveProductionSoundPlan } from "../../../../packages/engine/src/sound/deriveProductionSoundPlan";
import { renderProductionSound } from "../../../../packages/engine/src/sound/renderProductionSound";
import { nclose } from "../internal/predicates";

const digest: string =
  "sha256:0000000000000000000000000000000000000000000000000000000000000000" as string;

/** Construct the authored identity-oriented emitter placement. */
const transform: (
  x: number,
  y: number,
  z: number,
) => {
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
} = (
  x: number,
  y: number,
  z: number,
): {
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
} => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * Two units share a footprint and differ only in member count.
 *
 * A `line` places slot `s` at `x = (s - (files - 1)/2) * lateral`, `z = 0`, so a one-rank line is centered on its anchor and reaches `((files - 1)/2) * lateral` to either side. Picking `4 x 2.65625` and `256 x 0.03125` makes both reaches exactly `3.984375` m, and every value here is a dyadic rational, so the two boxes are bit-identical rather than nearly so. That is the whole point of the fixture: centroid, distance, spread and attenuation are held fixed, and `memberCount` is the only thing left that can move the level.
 */
const unit: (
  id: string,
  count: number,
  lateral: number,
) => IAutoMovieCompiledFormation = (
  id: string,
  count: number,
  lateral: number,
): IAutoMovieCompiledFormation =>
  materializeCompiledFormation({
    formation: {
      id,
      modelRecipe: `${id}-model`,
      count,
      layout: {
        kind: "line",
        ranks: 1,
        files: count,
        spacing: { lateral, depth: 1 },
      },
      anchor: { x: 0, y: 0, z: -30 },
      facingDeg: 0,
      seed: 1,
      capabilities: [],
      heroOverrides: [],
    },
  });

const SMALL_COUNT: number = 4;
const LARGE_COUNT: number = 256;
const CROWD_COUNT: number = 100;

/** Half the shared footprint: `(4 - 1)/2 * 2.65625 = (256 - 1)/2 * 0.03125`. */
const HALF_WIDTH: number = 3.984375;

/** Declare the three original event subjects; unrelated shot fields remain unused by this planner test. */
const contract: () => IAutoMovieShotContract = (): IAutoMovieShotContract =>
  ({
    id: "density-shot",
    events: [
      { id: "small", subjects: ["small-unit"] },
      { id: "large", subjects: ["large-unit"] },
      { id: "mixed", subjects: ["hero", "crowd"] },
    ].map(
      (
        event: { id: string; subjects: string[] },
        index: number,
      ): {
        kind: "arrival";
        window: { from: number; to: number };
        predicates: {}[];
        id: string;
        subjects: string[];
      } => ({
        ...event,
        // One kind throughout, and the one whose procedural voice is a pure tone:
        // `arrival` mixes `sin(2*pi*(58 + 42*n)*t)` with no seeded noise in it, so
        // two events compared at the same offset differ by their level factors and
        // by nothing else. A noisy kind would make the same comparison a
        // measurement of the seed.
        kind: "arrival",
        window: { from: index * 1.25, to: index * 1.25 + 0.5 },
        predicates: [{}],
      }),
    ),
  }) as IAutoMovieShotContract;

/** Build the original equal-footprint formations and one hero/crowd group consumed by the sound planner. */
const compiled: () => IAutoMovieCompiledShotSource =
  (): IAutoMovieCompiledShotSource =>
    ({
      eventSamples: [
        { id: "small", time: 0.25 },
        { id: "large", time: 1.5 },
        { id: "mixed", time: 2.5 },
      ],
      scene: {
        id: "scene",
        name: null,
        nodes: [
          {
            // Off the crowd's own line in both axes. Sharing its depth would let
            // weighting by member, by subject, or neither put the
            // emitter at the crowd's `z`, and the depth fact would hold without
            // measuring anything.
            id: "hero",
            model: "hero-model",
            transform: transform(20, 0, -10),
            motion: null,
            pose: null,
          },
        ],
        cameras: [
          {
            id: "camera",
            transform: transform(0, 1, 0),
            fovY: 50,
            near: 0.1,
            far: 200,
            depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
          },
        ],
        lights: [],
      },
      motions: [],
      formationMotions: [],
      formationSlotMotions: [],
      effectCues: [],
      shot: {
        id: "density-shot",
        name: null,
        scene: "scene",
        duration: 3,
        camera: "camera",
        cameraMotion: null,
        performances: [],
        objectMotions: [],
      },
      models: [],
      formations: [
        unit("small-unit", SMALL_COUNT, 2.65625),
        unit("large-unit", LARGE_COUNT, 0.03125),
      ],
      instanceSets: [
        materializeCompiledInstanceSet({
          instanceSet: {
            id: "crowd",
            modelRecipe: "crowd-model",
            count: CROWD_COUNT,
            // One row, so every slot shares the anchor's depth and the set's
            // centroid is the anchor itself: a grid centers its columns on the
            // anchor but grows its rows toward +z, and a crowd whose centroid sat
            // half a grid downrange would make the weighting check below measure
            // the layout instead of the weighting.
            layout: {
              kind: "grid",
              rows: 1,
              columns: CROWD_COUNT,
              spacing: { x: 1, z: 1 },
            },
            anchor: { x: 0, y: 0, z: -30 },
            facingDeg: 0,
            seed: 1,
            variation: {
              scale: { min: 1, max: 1 },
              palette: ["#ffffff"],
              traits: [],
            },
          },
          world: { routes: [] },
        }),
      ],
      effects: [],
    }) satisfies IAutoMovieCompiledShotSource;

/** Declare the original density shot duration and empty auxiliary tracks. */
const timeline: () => IAutoMovieFilmTimeline = (): IAutoMovieFilmTimeline =>
  ({
    version: 1,
    builder: "test",
    inputFingerprint: digest,
    sourceDigest: digest,
    id: "film",
    fps: 20,
    totalFrames: 60,
    segments: [
      {
        shot: "density-shot",
        sourceInFrame: 0,
        sourceOutFrame: 60,
        startFrame: 0,
        endFrame: 60,
        headHandleFrames: 0,
        tailHandleFrames: 0,
        transitionIn: { kind: "cut" },
        transitionOut: { kind: "cut" },
      },
    ],
    omissions: [],
    tracks: { audio: [], captions: [], effects: [] },
  }) as IAutoMovieFilmTimeline;

/** Read the required planned event by its authored id; a missing event fails the owning assertions. */
const eventOf: (
  plan: IAutoMovieProductionSoundPlan,
  id: string,
) => IAutoMovieProductionSoundEvent = (
  plan: IAutoMovieProductionSoundPlan,
  id: string,
): IAutoMovieProductionSoundEvent =>
  plan.events.find(
    (event: IAutoMovieProductionSoundEvent): boolean => event.event === id,
  )!;

/** Absolute amplitude of one mixed stereo frame, independent of its pan. */
const amplitudeAt: (pcm: Float32Array, frame: number) => number = (
  pcm: Float32Array,
  frame: number,
): number => Math.hypot(pcm[frame * 2]!, pcm[frame * 2 + 1]!);

/**
 * Count scaling and the adopted uniform-box spread model affect planned and mixed sound.
 *
 * Before this, a subject that was a unit contributed exactly one emitter no matter its member count, level was a fixed constant times distance attenuation, and several subjects were averaged into one arithmetic centroid. Three people and a hundred thousand were therefore acoustically identical, and an event naming one hero plus the army behind him emitted from the empty midpoint between them.
 *
 * The planner adopts square-root member scaling and a uniform-box variance for each compiled bound. The parallel-axis formula gives the listener-distance term for that approximation; it does not measure discrete member variance or empirical acoustics.
 *
 * Scenarios (listener at (0, 1, 0), both units centered on (0, 0, -30)):
 *
 * 1. `memberCount` is the unit's real count, and `densityGain` is exactly its
 * square root, for a node (one, no size), a formation, and an instance set.
 * 2. A unit has a size: `spreadRadiusMeters` is the RMS radius of the uniform box
 * the compiled bounds describe, and `attenuation` is taken at `hypot(distance, spread)`, not at the centroid alone, which is strictly less than the centroid-only gain the mixer used to apply.
 * 3. The controlled pair: two units in the same footprint at the same distance,
 * 64x apart in count, have an 8x planned gain within 1e-12 and PCM amplitude ratio within 1e-4, the square-root count model with Float32 mix rounding.
 * 4. Several subjects combine by member count, not by subject count: one figure
 * standing 20 m across and 20 m in front of a hundred-strong crowd emits from `(20/101, -3010/101)`. The subject-count mean `(10, -20)` would place it roughly ten metres from that weighted centre on either axis.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans controlled equal-footprint formations and a mixed hero/crowd, then observes count, density, RMS spread, attenuation, member-weighted centre and rendered amplitude ratio.
 * @evidence contracts/testing.md#independent-expectations Dyadic equal footprints, square-root count scaling and the independently written weighted centroid and uniform-box variance provide arithmetic expectations; the attenuation-law check reuses observed distance/spread and does not independently measure physical acoustics.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the four-member versus 256-member equal-footprint pair, mixed one-node/100-instance mass and audible PCM ratio; changed spread, cue motion and limiting belong to the spread entry.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_production_sound_density and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_production_sound_density(): void {
  const plan: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan({
    timeline: timeline(),
    contracts: new Map([["density-shot", contract()]]),
    compiled: new Map([["density-shot", compiled()]]),
  });
  const small: IAutoMovieProductionSoundEvent = eventOf(plan, "small");
  const large: IAutoMovieProductionSoundEvent = eventOf(plan, "large");
  const mixed: IAutoMovieProductionSoundEvent = eventOf(plan, "mixed");

  // 1. every event counts its real members and gains by their square root.
  TestValidator.predicate(
    "member counts are the units' own, and density gain is their square root",
    small.memberCount === SMALL_COUNT &&
      large.memberCount === LARGE_COUNT &&
      mixed.memberCount === CROWD_COUNT + 1 &&
      plan.events.every((event: IAutoMovieProductionSoundEvent): boolean =>
        nclose(event.densityGain, Math.sqrt(event.memberCount), 1e-12),
      ),
  );

  // 2. a unit has a size, and the size is what the listener is really far from.
  const boxRadius: number = HALF_WIDTH / Math.sqrt(3);
  TestValidator.predicate(
    "spread is the box's RMS radius and attenuation is taken at the RMS distance",
    nclose(small.spreadRadiusMeters, boxRadius, 1e-9) &&
      nclose(large.spreadRadiusMeters, boxRadius, 1e-9) &&
      plan.events.every((event: IAutoMovieProductionSoundEvent): boolean =>
        nclose(
          event.attenuation,
          1 /
            (1 +
              0.08 *
                (event.distanceMeters * event.distanceMeters +
                  event.spreadRadiusMeters * event.spreadRadiusMeters)),
          1e-12,
        ),
      ) &&
      small.attenuation <
        1 / (1 + 0.08 * small.distanceMeters * small.distanceMeters),
  );

  // 3. the controlled pair: same footprint, same distance, 64x the members.
  const rendered: IAutoMovieRenderedProductionSound = renderProductionSound({
    plan,
  });
  /** Read stereo amplitude at the independently chosen offset after the planned event frame. */
  const sampleOf: (frame: number) => number = (frame: number): number =>
    amplitudeAt(
      rendered.pcm,
      Math.round((frame / plan.fps) * plan.sampleRate) + 1_000,
    );
  const smallSample: number = sampleOf(small.frame);
  const largeSample: number = sampleOf(large.frame);
  TestValidator.predicate(
    "sixty-four times the members gives the expected eightfold planned and PCM levels",
    nclose(small.distanceMeters, large.distanceMeters) &&
      nclose(small.attenuation, large.attenuation) &&
      nclose(large.densityGain / small.densityGain, 8, 1e-12) &&
      smallSample > 0 &&
      largeSample > 0 &&
      nclose(largeSample / smallSample, 8, 1e-4),
  );

  // 4. subjects combine by member count, not by subject count.
  TestValidator.predicate(
    "a hero beside a crowd emits from the crowd, not from the midpoint",
    nclose(mixed.emitter.x, 20 / 101, 1e-9) &&
      mixed.emitter.x < 1 &&
      // (1 x -10 + 100 x -30) / 101. Weighting by subject instead would put it
      // at -20, ten metres of empty ground in front of the crowd.
      nclose(mixed.emitter.z, -3_010 / 101, 1e-9),
  );
}
