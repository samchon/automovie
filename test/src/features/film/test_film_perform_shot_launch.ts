import {
  AutoMovieInteractionEventKind,
  IAutoMovieActionCall,
  IAutoMovieActionTarget,
  IAutoMovieClip,
  IAutoMovieInteractionEvent,
  IAutoMovieMotion,
  IAutoMovieScript,
  IAutoMovieShotPerformance,
  IAutoMovieSkeleton,
  IAutoMovieStage,
  IAutoMovieTrack,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot } from "@automovie/engine";
import { IAutoMovieStagedSet } from "@automovie/engine";
import { performShot } from "@automovie/engine";
import { stageScene } from "@automovie/engine";
import { IAutoMovieActionSynthesizer } from "@automovie/engine";
import { sampleClip } from "@automovie/engine";
import type { FilmLaunchPerformer } from "../internal/FilmLaunchPerformer";
import { assertFilmLaunchAdmission } from "../internal/assertFilmLaunchAdmission";
import { assertFilmLaunchTargetHandoffs } from "../internal/assertFilmLaunchTargetHandoffs";
import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import {
  createSkeleton,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";

/**
 * Like the shared content seam, but a `launch` produces no actor motion: it animates the projectile object and schedules a react, not the shooter.
 */
const synth: IAutoMovieActionSynthesizer = (
  action: IAutoMovieActionCall,
  actor: string,
): IAutoMovieMotion | null =>
  action.verb === "launch" ? null : validSynthesizer(action, actor);

const scriptOf: () => IAutoMovieScript = (): IAutoMovieScript =>
  makeScriptWrite({
    cast: [
      { node: "archer", character: "the archer", modelRef: "stickman" },
      { node: "foe", character: "the foe", modelRef: null },
      { node: "arrow", character: "the arrow", modelRef: null },
    ],
    beats: [
      {
        id: "beat-1",
        name: "the loosing",
        summary: "the archer looses at the foe",
        durationHint: 2,
      },
    ],
  });

const stagingOf: () => IAutoMovieStage = (): IAutoMovieStage =>
  makeStagingWrite({
    actors: [
      { node: "archer", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
      { node: "foe", position: { x: 6, y: 0, z: 0 }, facingDeg: 180 },
      { node: "arrow", position: { x: 0, y: 1.4, z: 0 }, facingDeg: 0 },
    ],
    cameras: [
      {
        node: "cam-main",
        position: { x: 3, y: 1.6, z: 4 },
        lookAt: { kind: "node", node: "foe" },
        fovDeg: 45,
        near: 0.1,
        far: 1000,
        depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
      },
    ],
  });

/**
 * Performs projectile drafts and observes flight channels, landing, scheduled actor reactions and events, admission faults, moving-target leading, volley ids and live-bone fallback.
 *
 * Scenarios:
 * 1. Compile a valid loose, flight endpoints, shot-relative timing and contact/hit/fall events; a faster hit must move reaction timing.
 * 2. Delegate the existing projectile/target, speed/force, reachability, point-flight, late-contact and self-target admission cases.
 * 3. Lead the approaching foe for both scalar and actor-list locomotion.
 * 4. Delegate volley clip identities and live/missing/unstaged bone target cases.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs projectile drafts and observes flight channels, landing, scheduled actor reactions and events, admission faults, moving-target leading, volley ids and live-bone fallback.
 * @evidence contracts/testing.md#independent-expectations Authored origins/targets and shot clocks define endpoints and bounds; contact/hit time comparisons against the same flight's final key check clock consistency rather than independently solving time of flight. The strict 5e-3 landing bound, 1e-9 prelaunch origin and canonical 1e-6 clock predicates remain. Moving-target checks establish downrange direction and actor membership, not independent intercept or recoil timing.
 * @evidence contracts/testing.md#distinguishing-cases Retains all existing positive, referential, speed/force/timing, actor-list and live-bone cases delegated to the launch helpers. The point-flight neighbor omits onHit because a point identifies no struck actor; launch_camera owns the corresponding onHit refusal.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_launch unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_launch(): void {
  const staged: IAutoMovieStagedSet = stageScene(scriptOf(), stagingOf());
  if (staged.success !== true) throw new Error("staging must succeed");

  const perform: FilmLaunchPerformer = (
    draft: IAutoMovieActionCall[],
    targetAt?: (
      target: IAutoMovieActionTarget,
      seconds: number,
    ) => IAutoMovieVector3 | null,
  ): IAutoMoviePerformedShot =>
    performShot({
      script: scriptOf(),
      staged,
      performance: makePerformanceWrite({
        beat: "beat-1",
        draft,
        revise: {
          review: "the loose reads; the hit lands downrange.",
          final: null,
        },
        duration: 2,
      }),
      synthesize: synth,
      skeleton: (node: string): IAutoMovieSkeleton | null =>
        node === "arrow" ? null : createSkeleton(),
      targetAt,
    });

  // 1. a valid loose: the arrow flies and the foe is scheduled to react
  const ok: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 0.2,
      duration: "auto",
      projectile: "arrow",
      at: { kind: "node", node: "foe" },
      speed: 22,
      onHit: { force: 0.6, unbalance: true },
    },
    {
      verb: "frame",
      actor: "cam-main",
      start: 0,
      duration: "auto",
      framing: "wide",
      move: "static",
      on: { kind: "node", node: "foe" },
    },
  ]);
  TestValidator.equals("the launch performs", ok.success, true);
  if (ok.success !== true) return;

  TestValidator.equals(
    "one object motion, the arrow's flight",
    ok.shot.objectMotions.length,
    1,
  );
  const flight: IAutoMovieClip = ok.shot.objectMotions[0]!;
  TestValidator.equals(
    "the flight is the arrow's clip",
    flight.id,
    "trajectory:arrow",
  );
  TestValidator.equals(
    "the flight drives the arrow node",
    flight.tracks.map((t: IAutoMovieTrack): string =>
      t.channel.kind === "node" ? t.channel.node : "",
    ),
    ["arrow", "arrow"],
  );
  const vals: number[] = flight.tracks[0]!.values;
  const landingError: number = Math.hypot(
    vals[vals.length - 3]! - 6,
    vals[vals.length - 2]! - 0,
    vals[vals.length - 1]! - 0,
  );
  TestValidator.predicate(
    "the flight lands on the foe",
    nclose(landingError, 0, 5e-3) && landingError < 5e-3,
  );
  // The flight is placed on the shot clock: it launches at the action's start
  // (0.2 s), spans the shot, and, via sampleClip's clamp, holds at the arrow's
  // staged origin before the loose rather than starting mid-air at shot t = 0.
  const times: number[] = flight.tracks[0]!.times;
  TestValidator.predicate(
    "the flight spans the shot",
    nclose(flight.duration, 2),
  );
  TestValidator.predicate(
    "the flight launches at the action's start",
    nclose(times[0]!, 0.2),
  );
  TestValidator.predicate(
    "and lands within the shot",
    times[times.length - 1]! > 0.2 && times[times.length - 1]! < 2,
  );
  const preLaunch: number[] = sampleClip(flight, 0).get(
    "node:arrow:translation",
  )!.value;
  TestValidator.predicate(
    "before the loose the arrow holds at its staged origin",
    vclose(
      { x: preLaunch[0]!, y: preLaunch[1]!, z: preLaunch[2]! },
      { x: 0, y: 1.4, z: 0 },
      1e-9,
    ),
  );
  TestValidator.equals(
    "only the struck foe performs, the engine-scheduled react",
    ok.shot.performances.map((p: IAutoMovieShotPerformance): string => p.node),
    ["foe"],
  );

  const launchEvents: IAutoMovieInteractionEvent[] = ok.shot.events ?? [];
  TestValidator.equals(
    "the shot carries contact, hit, and fall events",
    launchEvents.map(
      (event: IAutoMovieInteractionEvent): AutoMovieInteractionEventKind =>
        event.kind,
    ),
    ["contact", "hit", "fall"],
  );
  TestValidator.equals(
    "the contact event lands with the projectile",
    namedFacts([
      [
        "launchEventsSourceCollisionSolver",
        (): boolean => launchEvents[0]!.source === "collisionSolver",
      ],
      [
        "launchEventsActionIndex",
        (): boolean => launchEvents[0]!.actionIndex === 0,
      ],
      [
        "launchEventsTargetFoe",
        (): boolean => launchEvents[0]!.target === "foe",
      ],
      [
        "launchEventsObjectArrow",
        (): boolean => launchEvents[0]!.object === "arrow",
      ],
    ]),
    {
      launchEventsSourceCollisionSolver: true,
      launchEventsActionIndex: true,
      launchEventsTargetFoe: true,
      launchEventsObjectArrow: true,
    },
  );
  TestValidator.predicate(
    "the contact clock matches the flight end",
    nclose(launchEvents[0]!.time, times[times.length - 1]!),
  );
  TestValidator.equals(
    "the hit event drives the downstream reaction",
    namedFacts([
      [
        "launchEventsSourceImpactOutput",
        (): boolean => launchEvents[1]!.source === "impactOutput",
      ],
      [
        "launchEventsReactionFoe",
        (): boolean => launchEvents[1]!.reaction === "foe",
      ],
      [
        "launchEventsActionIndex",
        (): boolean => launchEvents[1]!.actionIndex === 0,
      ],
    ]),
    {
      launchEventsSourceImpactOutput: true,
      launchEventsReactionFoe: true,
      launchEventsActionIndex: true,
    },
  );
  TestValidator.predicate(
    "the hit clock matches the flight end",
    nclose(launchEvents[1]!.time, times[times.length - 1]!),
  );
  TestValidator.equals(
    "the fall event records the unbalance response",
    namedFacts([
      ["launchEventsKindFall", (): boolean => launchEvents[2]!.kind === "fall"],
      ["launchEventsActorFoe", (): boolean => launchEvents[2]!.actor === "foe"],
      [
        "launchEventsReactionFoe",
        (): boolean => launchEvents[2]!.reaction === "foe",
      ],
    ]),
    {
      launchEventsKindFall: true,
      launchEventsActorFoe: true,
      launchEventsReactionFoe: true,
    },
  );
  const faster: IAutoMoviePerformedShot = perform([
    {
      verb: "launch",
      actor: "archer",
      start: 0.2,
      duration: "auto",
      projectile: "arrow",
      at: { kind: "node", node: "foe" },
      speed: 30,
      onHit: { force: 0.6, unbalance: true },
    },
  ]);
  TestValidator.equals("a faster hit still performs", faster.success, true);
  if (faster.success === true) {
    const fastHit: IAutoMovieInteractionEvent = faster.shot.events!.find(
      (event: IAutoMovieInteractionEvent): boolean => event.kind === "hit",
    )!;
    const okHit: IAutoMovieInteractionEvent = launchEvents.find(
      (event: IAutoMovieInteractionEvent): boolean => event.kind === "hit",
    )!;
    TestValidator.predicate(
      "changing hit time moves the reaction event",
      fastHit.time < okHit.time,
    );
    TestValidator.equals(
      "the shifted hit still schedules the struck actor",
      namedFacts([
        ["refused", (): boolean => fastHit.reaction === "foe"],
        [
          "violated",
          (): boolean =>
            fastHit.reaction === "foe" &&
            faster.shot.performances.some(
              (p: IAutoMovieShotPerformance): boolean => p.node === "foe",
            ),
        ],
      ]),
      { refused: true, violated: true },
    );
  }

  assertFilmLaunchAdmission(perform);

  // 13. a moving target is led. The foe strides (a locomote whose baked motion
  // carries root travel); performShot resolves its animated world position and
  // leads the aim, so the flight lands short of the foe's staged x = 6 (the
  // foe, facing 180, advances toward the archer as the arrow flies).
  const rootAt: (x: number) => IAutoMovieTransform = (
    x: number,
  ): IAutoMovieTransform => ({
    translation: { x, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });
  const movingSynth: IAutoMovieActionSynthesizer = (
    action: IAutoMovieActionCall,
    actor: string,
  ): IAutoMovieMotion | null =>
    action.verb === "launch"
      ? null
      : action.verb === "locomote" && actor === "foe"
        ? makeMotion(
            [
              keyframe(0, makePose([], rootAt(0))),
              keyframe(2, makePose([], rootAt(4))),
            ],
            2,
          )
        : validSynthesizer(action, actor);
  const led: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        {
          verb: "locomote",
          actor: "foe",
          start: 0,
          duration: 2,
          gait: "walk",
          to: { kind: "point", point: { x: 2, y: 0, z: 0 } },
        },
        {
          verb: "launch",
          actor: "archer",
          start: 0.1,
          duration: "auto",
          projectile: "arrow",
          at: { kind: "node", node: "foe" },
          speed: 22,
          onHit: { force: 0.6, unbalance: true },
        },
      ],
      revise: { review: "the loose leads the striding foe.", final: null },
      duration: 2,
    }),
    synthesize: movingSynth,
    skeleton: (node: string): IAutoMovieSkeleton | null =>
      node === "arrow" ? null : createSkeleton(),
  });
  TestValidator.equals("the leading launch performs", led.success, true);
  if (led.success === true) {
    const lead: IAutoMovieClip = led.shot.objectMotions[0]!;
    const lv: number[] = lead.tracks[0]!.values;
    TestValidator.predicate(
      "the flight leads the approaching foe, lands short of its start (x < 6)",
      lv[lv.length - 3]! < 6 - 0.1,
    );
    TestValidator.predicate(
      "the led shot still contains the struck foe's performance",
      led.shot.performances.some(
        (p: IAutoMovieShotPerformance): boolean => p.node === "foe",
      ),
    );
  }

  // 12. actor-list locomotion is still that actor's motion, so launch leading
  // must use the same membership semantics as compilePerformance.
  const listedTarget: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        {
          verb: "locomote",
          actor: ["foe"],
          start: 0,
          duration: 2,
          gait: "walk",
          to: { kind: "point", point: { x: 2, y: 0, z: 0 } },
        },
        {
          verb: "launch",
          actor: "archer",
          start: 0.1,
          duration: "auto",
          projectile: "arrow",
          at: { kind: "node", node: "foe" },
          speed: 22,
          onHit: { force: 0.6, unbalance: true },
        },
      ],
      revise: {
        review: "the loose leads the listed striding foe.",
        final: null,
      },
      duration: 2,
    }),
    synthesize: movingSynth,
    skeleton: (node: string): IAutoMovieSkeleton | null =>
      node === "arrow" ? null : createSkeleton(),
  });
  TestValidator.equals(
    "actor-list moving target launch performs",
    listedTarget.success,
    true,
  );
  if (listedTarget.success === true) {
    const lead: IAutoMovieClip = listedTarget.shot.objectMotions[0]!;
    const lv: number[] = lead.tracks[0]!.values;
    TestValidator.predicate(
      "the actor-list target is led too",
      lv[lv.length - 3]! < 6 - 0.1,
    );
  }

  assertFilmLaunchTargetHandoffs(perform);
}
