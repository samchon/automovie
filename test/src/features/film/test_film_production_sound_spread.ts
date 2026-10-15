import {
  type IAutoMovieRenderedProductionSound,
  deriveProductionSoundPlan,
  materializeCompiledFormation,
  renderProductionSound,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledShotSource,
  IAutoMovieFilmTimeline,
  IAutoMovieFormationMotion,
  IAutoMovieProductionSoundEvent,
  IAutoMovieProductionSoundPlan,
  IAutoMovieShotContract,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

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

/** Where the listener stands, and where the far mass and the lone source are. */
const LISTENER: { x: number; y: number; z: number } = { x: 0, y: 1, z: 0 };
const FAR_Z: number = -30;
const LONE_X: number = 24;

/** The far mass: one rank of five at four-metre intervals, so it reaches 8 m. */
const CROWD_COUNT: number = 5;
const CROWD_INTERVAL: number = 4;
const CROWD_REACH: number = ((CROWD_COUNT - 1) / 2) * CROWD_INTERVAL;

/** The near mass has tightly packed members at z = -2; the listener is one metre above its anchor. */
const NEAR_COUNT: number = 400;
const NEAR_INTERVAL: number = 0.02;
const NEAR_REACH: number = ((NEAR_COUNT - 1) / 2) * NEAR_INTERVAL;
const NEAR_Z: number = -2;

/** How far the cue closes the far mass's own intervals, and over how long. */
const CLOSED: number = 0.5;
const CUE_END: number = 2;

/**
 * One rank of `count` members on a stated line, as the builder materializes it.
 */
const unit: (props: {
  id: string;
  count: number;
  interval: number;
  z: number;
}) => IAutoMovieCompiledFormation = (props: {
  id: string;
  count: number;
  interval: number;
  z: number;
}): IAutoMovieCompiledFormation =>
  materializeCompiledFormation({
    formation: {
      id: props.id,
      model: `${props.id}-model`,
      count: props.count,
      layout: {
        kind: "line",
        ranks: 1,
        files: props.count,
        spacing: { lateral: props.interval, depth: 1 },
      },
      anchor: { x: 0, y: 0, z: props.z },
      facingDeg: 0,
      seed: 1,
      capabilities: [],
      heroOverrides: [],
    },
  });

/**
 * The far mass closes its own intervals to half of themselves.
 *
 * Translation stays at zero throughout, and the anchor is the unit's own centroid, so nothing about where the mass is heard from moves: the cue changes how large it is and nothing else, which is what leaves the spread as the only quantity a case below can be reading.
 */
const CLOSE_RANKS: IAutoMovieFormationMotion[] = [
  {
    id: "close-ranks",
    formation: "crowd",
    action: "hold",
    start: 0,
    end: CUE_END,
    from: {
      translation: { x: 0, y: 0, z: 0 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
    to: {
      translation: { x: 0, y: 0, z: 0 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: CLOSED, depth: 1 },
    },
    easing: "linear",
  },
];

/** Declare the original rest, closed, mixed and near event subjects for this planner test. */
const contract: () => IAutoMovieShotContract = (): IAutoMovieShotContract =>
  ({
    id: "spread-shot",
    events: [
      { id: "rest", subjects: ["crowd"] },
      { id: "closed", subjects: ["crowd"] },
      { id: "mixed", subjects: ["lone", "crowd"] },
      { id: "near", subjects: ["near-crowd"] },
    ].map(
      (event: {
        id: string;
        subjects: string[];
      }): {
        kind: "arrival";
        window: { from: number; to: number };
        predicates: {}[];
        id: string;
        subjects: string[];
      } => ({
        ...event,
        // One kind throughout, and the one whose procedural voice carries no
        // seeded noise, so two events compared at the same offset differ by their
        // level factors and by nothing else.
        kind: "arrival",
        window: { from: 0, to: 4 },
        predicates: [{}],
      }),
    ),
  }) as IAutoMovieShotContract;

/** Build the original crowd, lone emitter and spacing-only cue inputs consumed by the planner. */
const compiled: () => IAutoMovieCompiledShotSource =
  (): IAutoMovieCompiledShotSource =>
    ({
      eventSamples: [
        { id: "rest", time: 0 },
        { id: "mixed", time: 0 },
        { id: "closed", time: CUE_END },
        { id: "near", time: 3 },
      ],
      scene: {
        id: "scene",
        name: null,
        nodes: [
          {
            id: "lone",
            model: "lone-model",
            transform: transform(LONE_X, 0, FAR_Z),
            motion: null,
            pose: null,
          },
        ],
        cameras: [
          {
            id: "camera",
            transform: transform(LISTENER.x, LISTENER.y, LISTENER.z),
            fovY: 50,
            near: 0.1,
            far: 200,
            depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
          },
        ],
        lights: [],
      },
      motions: [],
      formationMotions: CLOSE_RANKS,
      formationSlotMotions: [],
      effectCues: [],
      shot: {
        id: "spread-shot",
        name: null,
        scene: "scene",
        duration: 4,
        camera: "camera",
        cameraMotion: null,
        performances: [],
        objectMotions: [],
      },
      models: [],
      formations: [
        unit({
          id: "crowd",
          count: CROWD_COUNT,
          interval: CROWD_INTERVAL,
          z: FAR_Z,
        }),
        unit({
          id: "near-crowd",
          count: NEAR_COUNT,
          interval: NEAR_INTERVAL,
          z: NEAR_Z,
        }),
      ],
      instanceSets: [],
      effects: [],
    }) satisfies IAutoMovieCompiledShotSource;

/** Declare the original spread shot duration and empty auxiliary tracks. */
const timeline: () => IAutoMovieFilmTimeline = (): IAutoMovieFilmTimeline =>
  ({
    version: 1,
    builder: "test",
    inputFingerprint: digest,
    sourceDigest: digest,
    id: "film",
    fps: 20,
    totalFrames: 80,
    segments: [
      {
        shot: "spread-shot",
        sourceInFrame: 0,
        sourceOutFrame: 80,
        startFrame: 0,
        endFrame: 80,
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

/**
 * The mean squared distance from the centre of a box to a point drawn uniformly inside it, over its half-extents: one third of its squared half-diagonal.
 */
const boxVariance: (half: {
  x: number;
  y: number;
  z: number;
}) => number = (half: { x: number; y: number; z: number }): number =>
  (half.x * half.x + half.y * half.y + half.z * half.z) / 3;

/** Squared distance between two points. */
const squaredDistance: (
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
) => number = (
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
): number =>
  (left.x - right.x) ** 2 + (left.y - right.y) ** 2 + (left.z - right.z) ** 2;

/**
 * The adopted extended-source approximation combines uniform-box variance with displacement between subject centres.
 *
 * The independently written formula `variance = sum_i n_i (variance_i + |c_i - c|^2) / sum_i n_i` includes both authored box variance and centre displacement. Omitting the displacement gives a different answer for the displaced lone emitter. The box approximation is the supported planner model, not the actual discrete crowd variance or an empirical acoustic measurement.
 *
 * The spacing-only cue reduces the compiled bounds at the later event while preserving the count and anchor. This pair detects a planner that keeps the designed spread after the cue.
 *
 * Scenarios:
 *
 * 1. A lone mass is heard at the RMS radius of the box its compiled bounds
 * describe: one rank of five at four-metre intervals reaches 8 m, so the spread is `8 / sqrt(3)`.
 * 2. That mass closing its own intervals to half is heard at half the spread, at
 * the same count and from the same place, so what the cue changed is the size and nothing else. Reading the designed bounds instead would report the same number twice.
 * 3. A lone source beside that mass is one combined source whose spread is the
 * parallel-axis sum, which is strictly larger than either the mass's own spread or the count-weighted mean of the two variances. That second comparison is the cross term: without it the answer would be 4.216 m rather than 9.888 m.
 * 4. The post-mix limiter owns the headroom a crowd's own level does not: a mass
 * of four hundred at z = -2 mixes past full scale and returns within 1e-6 of the 0.95 ceiling with nothing clipped, while the same plan without it stays below that ceiling.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans static, closing and combined masses and mixes a near loud crowd, asserting uniform-box/parallel-axis spread, cue-scaled extent, weighted XZ centre and limited versus quiet master behavior.
 * @evidence contracts/testing.md#independent-expectations Fixture geometry supplies box variance and the complete count-weighted parallel-axis calculation including centre displacement; the literal 0.95 ceiling is the mixer contract, and no empirical acoustic or external loudness reference is claimed.
 * @evidence contracts/testing.md#distinguishing-cases Keeps one mass, spacing-only cue motion, a displaced lone source plus mass, and loud versus quiet plans; population scaling at equal footprint remains in the density entry.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_production_sound_spread and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_production_sound_spread(): void {
  const plan: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan({
    timeline: timeline(),
    contracts: new Map([["spread-shot", contract()]]),
    compiled: new Map([["spread-shot", compiled()]]),
  });
  const rest: IAutoMovieProductionSoundEvent = eventOf(plan, "rest");
  const closed: IAutoMovieProductionSoundEvent = eventOf(plan, "closed");
  const mixed: IAutoMovieProductionSoundEvent = eventOf(plan, "mixed");

  // 1. the designed box.
  const restVariance: number = boxVariance({ x: CROWD_REACH, y: 0, z: 0 });
  TestValidator.predicate(
    "a mass is heard at the RMS radius of the box its bounds describe",
    rest.memberCount === CROWD_COUNT &&
      nclose(rest.spreadRadiusMeters, Math.sqrt(restVariance), 1e-9) &&
      nclose(rest.emitter.x, 0, 1e-9) &&
      nclose(rest.emitter.z, FAR_Z, 1e-9),
  );

  // 2. the cue closes it, and only its size moves.
  const closedVariance: number = boxVariance({
    x: CROWD_REACH * CLOSED,
    y: 0,
    z: 0,
  });
  TestValidator.predicate(
    "a cue that closes a mass's intervals is heard as the smaller mass it makes",
    closed.memberCount === CROWD_COUNT &&
      nclose(closed.emitter.x, rest.emitter.x, 1e-9) &&
      nclose(closed.emitter.z, rest.emitter.z, 1e-9) &&
      nclose(closed.spreadRadiusMeters, Math.sqrt(closedVariance), 1e-9) &&
      nclose(
        closed.spreadRadiusMeters,
        rest.spreadRadiusMeters * CLOSED,
        1e-9,
      ) &&
      closed.attenuation > rest.attenuation,
  );

  // 3. the parallel-axis sum, computed from the fixture's own geometry.
  const combinedCount: number = CROWD_COUNT + 1;
  const lone: { x: number; y: number; z: number } = {
    x: LONE_X,
    y: 0,
    z: FAR_Z,
  };
  const crowdCentre: { x: number; y: number; z: number } = {
    x: 0,
    y: 0,
    z: FAR_Z,
  };
  const combinedCentre: { x: number; y: number; z: number } = {
    x: (lone.x + CROWD_COUNT * crowdCentre.x) / combinedCount,
    y: (lone.y + CROWD_COUNT * crowdCentre.y) / combinedCount,
    z: (lone.z + CROWD_COUNT * crowdCentre.z) / combinedCount,
  };
  const combinedVariance: number =
    (1 * (0 + squaredDistance(lone, combinedCentre)) +
      CROWD_COUNT *
        (restVariance + squaredDistance(crowdCentre, combinedCentre))) /
    combinedCount;
  /** The same sum with the displacement dropped: what an average would say. */
  const withoutTheCrossTerm: number =
    (1 * 0 + CROWD_COUNT * restVariance) / combinedCount;
  TestValidator.predicate(
    "several subjects combine by the parallel-axis identity, cross term included",
    mixed.memberCount === combinedCount &&
      nclose(mixed.emitter.x, combinedCentre.x, 1e-9) &&
      nclose(mixed.emitter.z, combinedCentre.z, 1e-9) &&
      nclose(mixed.spreadRadiusMeters, Math.sqrt(combinedVariance), 1e-9) &&
      // These comparisons distinguish the omitted displacement cross term.
      mixed.spreadRadiusMeters > rest.spreadRadiusMeters &&
      mixed.spreadRadiusMeters > Math.sqrt(withoutTheCrossTerm) + 1 &&
      nclose(Math.sqrt(withoutTheCrossTerm), 4.216, 1e-3),
  );

  // 4. the limiter owns the headroom, and only when there is none left.
  const loud: IAutoMovieRenderedProductionSound = renderProductionSound({
    plan,
  });
  const quiet: IAutoMovieRenderedProductionSound = renderProductionSound({
    plan: {
      ...plan,
      events: plan.events.filter(
        (event: IAutoMovieProductionSoundEvent): boolean =>
          event.event !== "near",
      ),
    },
  });
  TestValidator.predicate(
    "a mass loud enough to leave no headroom is limited, and a plan with headroom is not",
    eventOf(plan, "near").memberCount === NEAR_COUNT &&
      // The independently stated impulse law puts the near event over full scale.
      (0.5 *
        eventOf(plan, "near").attenuation *
        eventOf(plan, "near").densityGain) /
        Math.SQRT2 >
        1 &&
      nclose(loud.analysis.samplePeak, 0.95, 1e-6) &&
      loud.analysis.clippingSamples === 0 &&
      quiet.analysis.samplePeak > 0 &&
      quiet.analysis.samplePeak < 0.95 &&
      loud.analysis.samplePeak > quiet.analysis.samplePeak,
  );

  TestValidator.predicate(
    "the near mass is measured as the tight box it is",
    nclose(
      eventOf(plan, "near").spreadRadiusMeters,
      Math.sqrt(boxVariance({ x: NEAR_REACH, y: 0, z: 0 })),
      1e-9,
    ),
  );
}
