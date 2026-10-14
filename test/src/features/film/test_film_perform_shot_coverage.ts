import {
  IAutoMovieBlockingCoverage,
  IAutoMovieCameraIntent,
  IAutoMovieClip,
  IAutoMovieShotCoverage,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot, IAutoMovieStagedSet, performShot, stageScene } from "@automovie/engine";



import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import {
  hasViolation,
  nclose,
  qclose,
  vclose,
  violationCount,
} from "../internal/predicates";

type ICoverage = IAutoMovieBlockingCoverage;

/**
 * The duel staged with three cameras on the aim height (y = 0.864) at 2 m, each
 * with a 90° vertical FOV, so every framing distance is an exact hand number:
 * `medium` shows 0.62 × 1.2 m = 0.744 m, and `tan(45°) = 1` makes the framed
 * distance 0.744 / 2 = 0.372 m along the staged bearing.
 */
const staged: IAutoMovieStagedSet.ISuccess =
  ((): IAutoMovieStagedSet.ISuccess => {
    const result: IAutoMovieStagedSet = stageScene(
      makeScriptWrite(),
      makeStagingWrite({
        cameras: [
          {
            node: "cam-main",
            position: { x: 2, y: 0.864, z: 0 },
            lookAt: { kind: "node", node: "knightA" },
            fovDeg: 90,
            near: 0.1,
            far: 1000,
            depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
          },
          {
            node: "cam-alt",
            position: { x: 0, y: 0.864, z: -2 },
            lookAt: { kind: "node", node: "knightA" },
            fovDeg: 90,
            near: 0.1,
            far: 1000,
            depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
          },
          {
            node: "cam-wide",
            position: { x: -2, y: 0.864, z: 0 },
            lookAt: { kind: "node", node: "knightA" },
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

/** One valid coverage intent: cam-alt holds a medium static on knightA. */
const coverage: (
  over?: Partial<IAutoMovieBlockingCoverage>,
) => IAutoMovieBlockingCoverage = (
  over: Partial<ICoverage> = {},
): ICoverage => ({
  camera: "cam-alt",
  framing: "medium",
  move: "static",
  on: { kind: "node", node: "knightA" },
  ...over,
});

/** Perform the beat-1 duel fixture under a blocking carrying `list`. */
const perform: (
  list?: IAutoMovieBlockingCoverage[] | undefined,
) => IAutoMoviePerformedShot = (list?: ICoverage[]): IAutoMoviePerformedShot =>
  performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite(),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    blocking:
      list === undefined
        ? makeBlockingWrite()
        : makeBlockingWrite({ coverage: list }),
  });

/** The first translation key of a compiled camera clip. */
const firstKey: (
  values: readonly number[],
  k?: number,
) => { x: number; y: number; z: number } = (
  values: readonly number[],
  k: number = 0,
): { x: number; y: number; z: number } => ({
  x: values[k * 3]!,
  y: values[k * 3 + 1]!,
  z: values[k * 3 + 2]!,
});

/**
 * Coverage compiles alternate cameras without changing the singular hero take.
 *
 * Scenarios:
 * 1. Check one static alternate, its channels/intent and hand-derived framed pose.
 * 2. Preserve blocking order and push-in endpoints for two alternates.
 * 3. Keep omitted/empty/unblocked coverage empty with an unchanged hero, and refuse invalid camera/framing/move/subject inputs while accepting point targets.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs performShot and reads alternate identities, channels, pose, intents and located coverage faults, catching rival-camera election, wrong staged bearing or missing input gates. Hero equality is replay invariance, not a repository arrangement check.
 * @evidence contracts/testing.md#independent-expectations The fixture rig height 1.2, medium factors .72/.62 and 90-degree field of view determine aim .864 and framed distance .372; push-in endpoints are 1.25 and .8 times that distance. Expected poses use numerical closeness; comparison of repeated hero output checks coverage independence rather than an independent hero-solve oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves static and moving alternates, ordered cameras, omitted/empty/no blocking, unknown/blank/live/repeated camera, invalid framing/move and unknown subject, with distinct-camera and point-target neighbours.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable entry owns portable numerical camera cases and directly calls source with existing authored data, opening no renderer, browser or GPU; it proves compiled camera values rather than a visible cut.
 */
export function test_film_perform_shot_coverage(): void {
  // 1. one coverage intent becomes one alternate take beside an untouched hero.
  const single: IAutoMoviePerformedShot = perform([coverage()]);
  TestValidator.equals("covered beat performs", single.success, true);
  if (single.success !== true) return;
  TestValidator.equals(
    "the hero take keeps its single live camera",
    single.shot.camera,
    "cam-main",
  );
  TestValidator.equals("one alternate take", single.shot.coverage!.length, 1);
  const take: IAutoMovieShotCoverage = single.shot.coverage![0]!;
  TestValidator.equals(
    "the take names its staged camera",
    take.camera,
    "cam-alt",
  );
  TestValidator.equals(
    "the take's clip is keyed to the beat and the camera",
    take.cameraMotion!.id,
    "cam:beat-1:cam-alt",
  );
  TestValidator.equals(
    "both tracks drive the covering camera",
    take.cameraMotion!.tracks.map((t: IAutoMovieTrack): string =>
      t.channel.kind === "node" ? t.channel.node : "",
    ),
    ["cam-alt", "cam-alt"],
  );
  TestValidator.predicate(
    "a static alternate keys once",
    take.cameraMotion!.tracks[0]!.times.length === 1 &&
      nclose(take.cameraMotion!.tracks[0]!.times[0]!, 0),
  );
  TestValidator.predicate(
    "the alternate frames from its own staged bearing",
    vclose(firstKey(take.cameraMotion!.tracks[0]!.values), {
      x: 0,
      y: 0.864,
      z: -0.372,
    }),
  );
  TestValidator.predicate(
    "the alternate looks back down +Z (180° about +Y)",
    qclose(
      {
        x: take.cameraMotion!.tracks[1]!.values[0]!,
        y: take.cameraMotion!.tracks[1]!.values[1]!,
        z: take.cameraMotion!.tracks[1]!.values[2]!,
        w: take.cameraMotion!.tracks[1]!.values[3]!,
      },
      { x: 0, y: 1, z: 0, w: 0 },
    ),
  );
  const expectedIntent: IAutoMovieCameraIntent[] = [
    {
      start: 0,
      framing: "medium",
      move: "static",
      focus: null,
      focalLength: null,
    },
  ];
  TestValidator.predicate(
    "the take carries its own intent",
    filmEffectValuesClose(take.cameraIntent, expectedIntent),
  );
  TestValidator.predicate(
    "the hero take still frames from +X",
    vclose(firstKey(single.shot.cameraMotion!.tracks[0]!.values), {
      x: 0.372,
      y: 0.864,
      z: 0,
    }),
  );

  // 2. several angles, and an alternate that moves.
  const several: IAutoMoviePerformedShot = perform([
    coverage(),
    coverage({ camera: "cam-wide", move: "push-in" }),
  ]);
  TestValidator.equals("multi-camera beat performs", several.success, true);
  if (several.success !== true) return;
  TestValidator.equals(
    "takes ride in blocking order",
    several.shot.coverage!.map(
      (entry: IAutoMovieShotCoverage): string => entry.camera,
    ),
    ["cam-alt", "cam-wide"],
  );
  const dolly: IAutoMovieClip = several.shot.coverage![1]!.cameraMotion!;
  TestValidator.equals(
    "a push-in alternate keys the dolly",
    dolly.tracks[0]!.times.length,
    9,
  );
  TestValidator.predicate(
    "the dolly starts at 1.25× the framed distance",
    vclose(firstKey(dolly.tracks[0]!.values), {
      x: -0.465,
      y: 0.864,
      z: 0,
    }),
  );
  TestValidator.predicate(
    "the dolly settles at 0.8× the framed distance",
    vclose(firstKey(dolly.tracks[0]!.values, 8), {
      x: -0.2976,
      y: 0.864,
      z: 0,
    }),
  );

  // 3. boundaries: the single-camera beat, in all three shapes.
  const omitted: IAutoMoviePerformedShot = perform();
  const emptyList: IAutoMoviePerformedShot = perform([]);
  const unblocked: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite(),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.predicate(
    "a single-camera beat assembles an empty coverage list",
    [omitted, emptyList, unblocked].every(
      (result: IAutoMoviePerformedShot): boolean =>
        result.success === true &&
        Array.isArray(result.shot.coverage) &&
        result.shot.coverage.length === 0,
    ),
  );
  TestValidator.predicate(
    "coverage never re-enters the hero solve",
    filmEffectValuesClose(
      omitted.success === true ? omitted.shot.cameraMotion : null,
      single.shot.cameraMotion,
    ),
  );

  // 4. gates.
  const ghost: IAutoMoviePerformedShot = perform([
    coverage({ camera: "cam-ghost" }),
  ]);
  TestValidator.predicate(
    "an unstaged coverage camera is a type violation",
    hasViolation(ghost, "type", "$blocking.coverage[0].camera"),
  );
  const blank: IAutoMoviePerformedShot = perform([coverage({ camera: "" })]);
  TestValidator.predicate(
    "an empty coverage camera id is a type violation",
    hasViolation(blank, "type", "$blocking.coverage[0].camera"),
  );
  const hero: IAutoMoviePerformedShot = perform([
    coverage({ camera: "cam-main" }),
  ]);
  TestValidator.predicate(
    "covering with the live camera is a type violation",
    hasViolation(hero, "type", "$blocking.coverage[0].camera"),
  );
  const repeated: IAutoMoviePerformedShot = perform([coverage(), coverage()]);
  TestValidator.predicate(
    "a repeated coverage camera is a type violation at the later entry",
    hasViolation(repeated, "type", "$blocking.coverage[1].camera"),
  );
  const badFraming: IAutoMoviePerformedShot = perform([
    coverage({ framing: "dutch" as never }),
  ]);
  TestValidator.predicate(
    "a forged coverage framing is a type violation",
    hasViolation(badFraming, "type", "$blocking.coverage[0].framing"),
  );
  const badMove: IAutoMoviePerformedShot = perform([
    coverage({ move: "dolly" as never }),
  ]);
  TestValidator.predicate(
    "a forged coverage move is a type violation",
    hasViolation(badMove, "type", "$blocking.coverage[0].move"),
  );
  const stranger: IAutoMoviePerformedShot = perform([
    coverage({ on: { kind: "node", node: "ghost" } }),
  ]);
  TestValidator.predicate(
    "an unresolvable coverage subject is a type violation",
    hasViolation(stranger, "type", "$blocking.coverage[0].on"),
  );

  // 5. negative twins: nothing fires one property away from each gate.
  TestValidator.equals(
    "two distinct staged cameras fire nothing",
    violationCount(several),
    0,
  );
  const point: IAutoMoviePerformedShot = perform([
    coverage({ on: { kind: "point", point: { x: 0, y: 0, z: 0.7 } } }),
  ]);
  TestValidator.equals(
    "a point-subject coverage fires nothing",
    violationCount(point),
    0,
  );
}
