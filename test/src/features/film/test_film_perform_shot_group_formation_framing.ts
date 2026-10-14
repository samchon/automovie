import {
  IAutoMoviePerformedShot,
  IAutoMovieStagedSet,
  materializeCompiledFormation,
  performShot,
  stageScene,
} from "@automovie/engine";
import {
  IAutoMovieActionCall,
  IAutoMovieCompiledFormation,
  IAutoMovieFormationMotion,
  IAutoMovieModel,
  IAutoMovieScript,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmFormationFrameInput } from "../internal/IFilmFormationFrameInput";
import type { IFilmFormationPerformanceInput } from "../internal/IFilmFormationPerformanceInput";
import { createFilmFormationMemberModel } from "../internal/createFilmFormationMemberModel";
import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { nclose, vclose } from "../internal/predicates";

/**
 * One member's drawn height, and the interval between two of them.
 */
const MEMBER_HEIGHT: number = 2;
const INTERVAL: number = 2;
/** The documented stand-in is 1.7 metres; keep this expectation independent of the runtime constant. */
const STAND_IN_HEIGHT: number = 1.7;

/**
 * Files in the wide unit, so it reaches `((5 - 1) / 2) * 2 = 4` m either side.
 */
const FILES: number = 5;

/**
 * Where the one staged node stands, well behind the lens.
 */
const NODE_Z: number = -30;

/**
 * How far the cue carries the wide unit, and over how long.
 */
const CARRY_METRES: number = 30;
const DURATION: number = 2;

/**
 * One member-shaped runtime: a box standing on its own origin.
 *
 * A box tessellates about its centre, so lifting it by half its height puts its floor at zero and its top at {@link MEMBER_HEIGHT}. Every number below is read off that rather than out of the measurement under test.
 */
const memberModel: IAutoMovieModel =
  createFilmFormationMemberModel(MEMBER_HEIGHT);

/**
 * One compiled unit of `count` members in a single rank, on the origin.
 */
const unit: (id: string, count: number) => IAutoMovieCompiledFormation = (
  id: string,
  count: number,
): IAutoMovieCompiledFormation =>
  materializeCompiledFormation({
    formation: {
      id,
      modelRecipe: "member",
      count,
      layout: {
        kind: "line",
        ranks: 1,
        files: count,
        spacing: { lateral: INTERVAL, depth: 1 },
      },
      anchor: { x: 0, y: 0, z: 0 },
      facingDeg: 0,
      seed: 1,
      capabilities: [],
      heroOverrides: [],
    },
  });

const WIDE_UNIT: IAutoMovieCompiledFormation = unit("wide-unit", FILES);
const LONE_UNIT: IAutoMovieCompiledFormation = unit("lone-unit", 1);

/**
 * The wide unit is carried along +x across the whole of the shot.
 */
const CARRY: IAutoMovieFormationMotion[] = [
  {
    id: "carry",
    formation: WIDE_UNIT.id,
    action: "advance",
    start: 0,
    end: DURATION,
    from: {
      translation: { x: 0, y: 0, z: 0 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
    to: {
      translation: { x: CARRY_METRES, y: 0, z: 0 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
    easing: "linear",
  },
];

const script: IAutoMovieScript = makeScriptWrite({
  logline: "One camera frames a mass and one figure from the same mark.",
  theme: "what a frame has to hold",
  cast: [{ node: "performer", character: "the performer", modelRef: null }],
  beats: [
    {
      id: "beat-1",
      name: "the framing",
      summary: "the camera frames what stands in front of it",
      durationHint: DURATION,
    },
  ],
});

/**
 * One camera stating a 90 degree vertical field of view, so `tan(fovY / 2) = 1` and every solved distance below is exactly half its visible span. The one staged node stands well behind the lens, so what the camera looks at is never the thing a case has it frame.
 */
const staged: IAutoMovieStagedSet.ISuccess =
  ((): IAutoMovieStagedSet.ISuccess => {
    const result: IAutoMovieStagedSet = stageScene(
      script,
      makeStagingWrite({
        scene: { id: "scene-mark", name: "the mark" },
        plan: "the camera stands back from the mark; the performer stands behind it.",
        actors: [
          {
            node: "performer",
            position: { x: 0, y: 0, z: NODE_Z },
            facingDeg: 0,
          },
        ],
        cameras: [
          {
            node: "cam",
            position: { x: 0, y: MEMBER_HEIGHT / 2, z: 20 },
            lookAt: { kind: "node", node: "performer" },
            fovDeg: 90,
            near: 0.1,
            far: 1000,
            depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
          },
        ],
      }),
    );
    if (result.success !== true)
      throw new Error("staging fixture must succeed");
    return result;
  })();

const frame: (props: IFilmFormationFrameInput) => IAutoMovieActionCall = (
  props: IFilmFormationFrameInput,
): IAutoMovieActionCall => ({
  verb: "frame",
  actor: "cam",
  start: 0,
  duration: "auto",
  framing: "wide",
  move: props.move ?? "static",
  on: {
    kind: "group",
    nodes: props.nodes ?? [],
    ...(props.formations === undefined ? {} : { formations: props.formations }),
  },
});

const perform: (
  props: IFilmFormationPerformanceInput,
) => IAutoMoviePerformedShot = (
  props: IFilmFormationPerformanceInput,
): IAutoMoviePerformedShot =>
  performShot({
    script,
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [props.action],
      revise: { review: "the frame holds what it has to hold.", final: null },
      duration: DURATION,
    }),
    synthesize: validSynthesizer,
    skeleton: (): null => null,
    formations: props.formations,
    models: props.models,
    formationMotions: props.formationMotions,
  });

/**
 * Every translation key of a compiled camera clip, as points.
 */
const keysOf: (performed: IAutoMoviePerformedShot) => IAutoMovieVector3[] = (
  performed: IAutoMoviePerformedShot,
): IAutoMovieVector3[] => {
  if (performed.success !== true) return [];
  const values: number[] = performed.shot.cameraMotion!.tracks[0]!.values;
  return Array.from(
    { length: values.length / 3 },
    (_unused: unknown, k: number): IAutoMovieVector3 => ({
      x: values[k * 3]!,
      y: values[k * 3 + 1]!,
      z: values[k * 3 + 2]!,
    }),
  );
};

/**
 * How far the solve stood the camera from the aim point it framed.
 */
const standoff: (key: IAutoMovieVector3, aim: IAutoMovieVector3) => number = (
  key: IAutoMovieVector3,
  aim: IAutoMovieVector3,
): number => Math.hypot(key.x - aim.x, key.y - aim.y, key.z - aim.z);

/**
 * `wide` shows four times the subject, and aims at half its height.
 */
const SHOWN: number = 4;
const AIMED: number = 0.5;

/**
 * How far the framing grammar stands back from a subject of this shape.
 */
const solved: (height: number, radius: number) => number = (
  height: number,
  radius: number,
): number => Math.max((height * SHOWN) / 2, (radius * 2 * SHOWN) / 2);

/**
 * Half the wide unit's own reach, from its layout alone.
 */
const REACH: number = ((FILES - 1) / 2) * INTERVAL;

/**
 * The compiled fallback member radius, which no recipe here overrides.
 */
const PAD: number = 0.5;

/**
 * Half the horizontal diagonal of each box a case below has the camera hold.
 */
const WIDE_RADIUS: number = Math.hypot((REACH + PAD) * 2, PAD * 2) / 2;
const LONE_RADIUS: number = Math.hypot(PAD * 2, PAD * 2) / 2;
const UNION_RADIUS: number = Math.hypot((REACH + PAD) * 2, PAD - NODE_Z) / 2;

/**
 * Where each of those boxes is aimed at, given the height above its floor.
 */
const WIDE_AIM: IAutoMovieVector3 = {
  x: 0,
  y: MEMBER_HEIGHT * AIMED,
  z: 0,
};
const NODE_AIM: IAutoMovieVector3 = {
  x: 0,
  y: STAND_IN_HEIGHT * AIMED,
  z: NODE_Z,
};
const UNION_AIM: IAutoMovieVector3 = {
  x: 0,
  y: MEMBER_HEIGHT * AIMED,
  z: (NODE_Z + PAD) / 2,
};

/**
 * Performs camera framing of compact formations, nodes and their union, then checks bounds, camera keys and cued follow endpoints against hand-derived extents.
 *
 * Scenarios:
 * 1. Frame a five-file formation from its padded width and staged bearing.
 * 2. Frame one unmeasured node from the independent 1.7-metre stand-in.
 * 3. Frame the union of that distant node and the formation.
 * 4. Contrast one member with and without its authored two-metre model.
 * 5. Follow the authored 30-metre cue while the uncued neighbour holds one key.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs camera framing of compact formations, nodes and their union, then checks bounds, camera keys and cued follow endpoints against hand-derived extents.
 * @evidence contracts/testing.md#independent-expectations Five files at two-metre spacing span -4 to 4; the documented .5-metre projection radius pads that slot footprint, while the authored two-metre box supplies vertical extent. The box's .4-metre width is not the projection-radius oracle. A 90-degree lens and the stated wide factor determine standoff within the canonical 1e-6 predicates; this proves no pixels or arbitrary lens behavior.
 * @evidence contracts/testing.md#distinguishing-cases Covers formation-only/node-only/union subjects, a singleton with and without its model, and moving versus uncued follow; malformed targets are covered separately.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_group_formation_framing unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_group_formation_framing(): void {
  // 1. the unit's own extent decides.
  const framed: IAutoMoviePerformedShot = perform({
    action: frame({ formations: [WIDE_UNIT.id] }),
    formations: [WIDE_UNIT],
    models: [memberModel],
  });
  const framedKeys: IAutoMovieVector3[] = keysOf(framed);
  const wideDistance: number = solved(MEMBER_HEIGHT, WIDE_RADIUS);
  TestValidator.predicate(
    "a formation named as a group subject is framed at its own extent",
    framed.success === true &&
      framedKeys.length === 1 &&
      vclose(WIDE_UNIT.bounds.min, { x: -REACH, y: 0, z: 0 }) &&
      vclose(WIDE_UNIT.bounds.max, { x: REACH, y: 0, z: 0 }) &&
      nclose(WIDE_UNIT.projectionRadius, PAD) &&
      // Width must decide: height alone would stand at 4 m instead of about 18.
      wideDistance > (MEMBER_HEIGHT * SHOWN) / 2 &&
      nclose(standoff(framedKeys[0]!, WIDE_AIM), wideDistance) &&
      vclose(framedKeys[0]!, {
        x: WIDE_AIM.x,
        y: WIDE_AIM.y,
        z: WIDE_AIM.z + wideDistance,
      }),
  );

  // 2. the same grammar on one body, which is what the mass is measured against.
  const body: IAutoMoviePerformedShot = perform({
    action: frame({ nodes: ["performer"] }),
  });
  const bodyKeys: IAutoMovieVector3[] = keysOf(body);
  TestValidator.predicate(
    "a group of one staged node is still framed as a body",
    bodyKeys.length === 1 &&
      // The unmeasured node has stand-in height and zero horizontal extent.
      nclose(standoff(bodyKeys[0]!, NODE_AIM), solved(STAND_IN_HEIGHT, 0)) &&
      solved(STAND_IN_HEIGHT, 0) < wideDistance,
  );

  // 3. a group of both is the union of both.
  const together: IAutoMoviePerformedShot = perform({
    action: frame({ nodes: ["performer"], formations: [WIDE_UNIT.id] }),
    formations: [WIDE_UNIT],
    models: [memberModel],
  });
  const togetherKeys: IAutoMovieVector3[] = keysOf(together);
  const unionDistance: number = solved(MEMBER_HEIGHT, UNION_RADIUS);
  TestValidator.predicate(
    "a group carrying a node and a unit is framed at the union of both",
    togetherKeys.length === 1 &&
      unionDistance > wideDistance &&
      nclose(standoff(togetherKeys[0]!, UNION_AIM), unionDistance) &&
      vclose(togetherKeys[0]!, {
        x: UNION_AIM.x,
        y: UNION_AIM.y,
        z: UNION_AIM.z + unionDistance,
      }),
  );

  // 4. a narrow unit is decided by its member's own drawn height.
  const measured: IAutoMoviePerformedShot = perform({
    action: frame({ formations: [LONE_UNIT.id] }),
    formations: [LONE_UNIT],
    models: [memberModel],
  });
  const unmeasured: IAutoMoviePerformedShot = perform({
    action: frame({ formations: [LONE_UNIT.id] }),
    formations: [LONE_UNIT],
  });
  const measuredKeys: IAutoMovieVector3[] = keysOf(measured);
  const unmeasuredKeys: IAutoMovieVector3[] = keysOf(unmeasured);
  TestValidator.predicate(
    "a narrow unit is framed by the height its member model really draws",
    measuredKeys.length === 1 &&
      unmeasuredKeys.length === 1 &&
      // The pair must measure height, rather than its unchanged footprint.
      (MEMBER_HEIGHT * SHOWN) / 2 > (LONE_RADIUS * 2 * SHOWN) / 2 &&
      nclose(
        standoff(measuredKeys[0]!, WIDE_AIM),
        solved(MEMBER_HEIGHT, LONE_RADIUS),
      ) &&
      nclose(
        standoff(unmeasuredKeys[0]!, {
          x: 0,
          y: STAND_IN_HEIGHT * AIMED,
          z: 0,
        }),
        solved(STAND_IN_HEIGHT, LONE_RADIUS),
      ) &&
      nclose(measuredKeys[0]!.z, unmeasuredKeys[0]!.z, 1e-6) === false,
  );

  // 5. a cue re-frames the mass; without one the same group holds still.
  const followed: IAutoMoviePerformedShot = perform({
    action: frame({ formations: [WIDE_UNIT.id], move: "follow" }),
    formations: [WIDE_UNIT],
    models: [memberModel],
    formationMotions: CARRY,
  });
  const held: IAutoMoviePerformedShot = perform({
    action: frame({ formations: [WIDE_UNIT.id], move: "follow" }),
    formations: [WIDE_UNIT],
    models: [memberModel],
  });
  const followedKeys: IAutoMovieVector3[] = keysOf(followed);
  TestValidator.predicate(
    "a cue is what lets a follow track a mass, and its absence is what holds one still",
    followed.success === true &&
      held.success === true &&
      followedKeys.length > 1 &&
      vclose(followedKeys[0]!, {
        x: WIDE_AIM.x,
        y: WIDE_AIM.y,
        z: WIDE_AIM.z + wideDistance,
      }) &&
      vclose(followedKeys[followedKeys.length - 1]!, {
        x: WIDE_AIM.x + CARRY_METRES,
        y: WIDE_AIM.y,
        z: WIDE_AIM.z + wideDistance,
      }) &&
      keysOf(held).length === 1,
  );
}
