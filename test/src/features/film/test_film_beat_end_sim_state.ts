import { resolveBeatEnd } from "@automovie/engine";
import {
  type IAutoMovieBeatEndActorState,
  type IAutoMovieBeatEndState,
  IAutoMovieBeatEndFootPlant,
  IAutoMovieMotion,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  IDENTITY_TRANSFORM,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { nclose, throwsError, vclose } from "../internal/predicates";

/** A one-shot (non-looping) dash whose root advances x = 2t over 1 second. */
const dash: IAutoMovieMotion = {
  ...makeMotion(
    [
      keyframe(
        0,
        makePose([], {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
      keyframe(
        1,
        makePose([], {
          translation: { x: 2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
    ],
    1,
  ),
  id: "dash",
};

const scene: IAutoMovieScene = {
  id: "scene",
  name: null,
  nodes: [
    {
      id: "hero",
      model: "hero",
      transform: IDENTITY_TRANSFORM,
      motion: null,
      pose: null,
    },
    {
      id: "guard",
      model: "guard",
      transform: IDENTITY_TRANSFORM,
      motion: null,
      pose: makePose([joint("leftLowerArm", { flexion: 45 })]),
    },
  ],
  cameras: [],
  lights: [],
};

const shotOf: (duration: number) => IAutoMovieShot = (duration: number): IAutoMovieShot => ({
  id: "shot:beat-1",
  name: null,
  scene: "scene",
  camera: "cam",
  cameraMotion: null,
  performances: [{ node: "hero", motion: "dash", startOffset: 0 }],
  objectMotions: [],
  duration,
});

const plant: (foot: IAutoMovieBeatEndFootPlant["foot"], start: number, x: number, end?: number) => IAutoMovieBeatEndFootPlant = (
  foot: IAutoMovieBeatEndFootPlant["foot"],
  start: number,
  x: number,
  end: number = start + 0.4,
): IAutoMovieBeatEndFootPlant => ({
  foot,
  start,
  end,
  position: { x, y: 0, z: 0 },
});

/**
 * A one-shot snapshot carries velocity until the clip end and selects supplied active plants and rider mounts. Actors without motion-derived state keep nullable phase and velocity.
 *
 * Scenarios:
 *
 * 1. A non-looping clip mid-flight (0.5 s of 1 s): gaitPhase null (no cycle),
 *    rootVelocity = the clip's true 2 m/s.
 * 2. At the exact 1 s cut, the non-looping clip keeps its incoming 2 m/s left-hand
 *    velocity.
 * 3. The same clip past its end (2 s > 1 s) clamps and holds at zero velocity.
 * 4. A held actor: gaitPhase, rootVelocity, footPlants, and mount all null.
 * 5. Plants carry the latest active run per foot: a run beginning exactly at the
 *    cut supersedes an earlier overlapping run, a run ending exactly at the cut
 *    remains active, equal starts go to the later input, and past/future runs
 *    are filtered.
 * 6. No plant entry for a node, an empty entry, and an entry with only past/future
 *    runs all yield null.
 * 7. A staged mount is carried onto its rider; unmounted actors get null.
 * 8. Duplicated plant/mount node entries throw loudly.
 * 9. A degenerate zero-duration looping clip has no cycle to resume (null phase,
 *    zero velocity) instead of dividing by its empty period.
 * 10. A performance that starts exactly at shot end (local time 0) has an empty
 *     velocity window: zero, not NaN.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveBeatEnd across one-shot and degenerate clocks and supplied plant/mount data, checking nullable state, finite velocity, plant election and duplicate refusal messages. This detects continued tail motion, division by an empty window, wrong inclusive plant ties or a mount carried to the wrong actor.
 * @evidence contracts/testing.md#independent-expectations The authored x=2t dash has two metres per second before and at its one-second cut and zero after it; held actors have no motion-derived state. Inclusive intervals at the two-second cut select the latest start and later equal-start input, giving the two literal expected plants without calling a product selector.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all ten numbered scenarios: mid-flight, exact end, held tail, held actor, active plant ties and boundaries, absent/empty/inactive data, rider binding, duplicate maps, zero-duration loop and zero local-time window; looping seams are covered by the continuity test.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_beat_end_sim_state entry owns every literal motion, plant and mount case and observes direct portable engine calls, without installing a consumer, creating Human assets or starting a process, native artifact or rendering host.
 */
export function test_film_beat_end_sim_state(): void {
  const flight: IAutoMovieBeatEndActorState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(0.5),
    motions: [dash],
  }).actors[0]!;
  TestValidator.equals("one-shot clip has no phase", flight.gaitPhase, null);
  TestValidator.predicate(
    "one-shot velocity mid-flight",
    vclose(flight.rootVelocity!, { x: 2, y: 0, z: 0 }, 1e-9),
  );

  const atCut: IAutoMovieBeatEndActorState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(1),
    motions: [dash],
  }).actors[0]!;
  TestValidator.predicate(
    "one-shot velocity at the exact cut uses the incoming left derivative",
    vclose(atCut.rootVelocity!, { x: 2, y: 0, z: 0 }, 1e-9),
  );

  const ended: IAutoMovieBeatEndActorState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(2),
    motions: [dash],
  }).actors[0]!;
  TestValidator.equals("ended clip has no phase", ended.gaitPhase, null);
  TestValidator.predicate(
    "ended clip holds still",
    vclose(ended.rootVelocity!, { x: 0, y: 0, z: 0 }),
  );

  const withData: IAutoMovieBeatEndState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(2),
    motions: [dash],
    mounts: [{ node: "hero", binding: { parent: "horse", bone: "spine" } }],
    plants: [
      {
        node: "hero",
        plants: [
          plant("leftFoot", 2, 3),
          plant("leftFoot", 1.2, 1, 2.1),
          plant("leftFoot", 0.1, 8),
          plant("rightFoot", 1.6, 7),
          plant("rightFoot", 2, 4, 2),
          plant("rightFoot", 2, 2, 2),
          plant("rightFoot", 99, 9),
        ],
      },
      { node: "guard", plants: [] },
    ],
  });
  const hero: IAutoMovieBeatEndActorState = withData.actors[0]!;
  const guard: IAutoMovieBeatEndActorState = withData.actors[1]!;

  TestValidator.equals("guard is held", guard.motion, null);
  TestValidator.equals("held actor has no phase", guard.gaitPhase, null);
  TestValidator.equals("held actor has no velocity", guard.rootVelocity, null);
  TestValidator.equals("empty plant entry yields null", guard.footPlants, null);
  TestValidator.equals("unmounted actor has no mount", guard.mount, null);

  TestValidator.equals(
    "latest active plant per foot carried with inclusive cut bounds",
    hero.footPlants?.map((value: IAutoMovieBeatEndFootPlant): IAutoMovieBeatEndFootPlant["foot"] => value.foot),
    ["leftFoot", "rightFoot"],
  );
  const expectedPlants: readonly IAutoMovieBeatEndFootPlant[] = [plant("leftFoot", 2, 3), plant("rightFoot", 2, 2, 2)];
  for (const [index, expected] of expectedPlants.entries()) {
    const actual: IAutoMovieBeatEndFootPlant | undefined = hero.footPlants?.[index];
    TestValidator.predicate(`plant ${expected.foot} keeps its inclusive times and position`, actual !== undefined && nclose(actual.start, expected.start, 1e-12) && nclose(actual.end, expected.end, 1e-12) && vclose(actual.position, expected.position, 1e-12));
  }
  TestValidator.equals("mount carried to its rider", hero.mount, {
    parent: "horse",
    bone: "spine",
  });

  const noData: IAutoMovieBeatEndActorState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(2),
    motions: [dash],
  }).actors[0]!;
  TestValidator.equals("no plant data yields null", noData.footPlants, null);
  TestValidator.equals("no mount data yields null", noData.mount, null);

  const inactive: IAutoMovieBeatEndActorState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(2),
    motions: [dash],
    plants: [
      {
        node: "hero",
        plants: [plant("leftFoot", 0.1, 1), plant("rightFoot", 3, 2)],
      },
    ],
  }).actors[0]!;
  TestValidator.equals(
    "past and future plant runs yield no opening pin",
    inactive.footPlants,
    null,
  );

  TestValidator.predicate(
    "duplicated plant node throws",
    throwsError(
      (): IAutoMovieBeatEndState =>
        resolveBeatEnd({
          beat: "beat-1",
          scene,
          shot: shotOf(2),
          motions: [dash],
          plants: [
            { node: "hero", plants: [] },
            { node: "hero", plants: [] },
          ],
        }),
      'plants for node "hero" are duplicated at props.plants[1].node',
    ),
  );
  TestValidator.predicate(
    "duplicated mount node throws",
    throwsError(
      (): IAutoMovieBeatEndState =>
        resolveBeatEnd({
          beat: "beat-1",
          scene,
          shot: shotOf(2),
          motions: [dash],
          mounts: [
            { node: "hero", binding: { parent: "horse", bone: "spine" } },
            { node: "hero", binding: { parent: "cart", bone: "hips" } },
          ],
        }),
      'mount for node "hero" is duplicated at props.mounts[1].node',
    ),
  );

  const still: IAutoMovieMotion = {
    ...makeMotion([keyframe(0, makePose([]))], 0, true),
    id: "dash",
  };
  const degenerate: IAutoMovieBeatEndActorState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(2),
    motions: [still],
  }).actors[0]!;
  TestValidator.equals(
    "zero-duration loop has no phase",
    degenerate.gaitPhase,
    null,
  );
  TestValidator.predicate(
    "zero-duration loop holds still",
    vclose(degenerate.rootVelocity!, { x: 0, y: 0, z: 0 }),
  );

  const unstarted: IAutoMovieBeatEndActorState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: {
      ...shotOf(1),
      performances: [{ node: "hero", motion: "dash", startOffset: 1 }],
    },
    motions: [dash],
  }).actors[0]!;
  TestValidator.predicate(
    "a clip at local time 0 has an empty velocity window",
    vclose(unstarted.rootVelocity!, { x: 0, y: 0, z: 0 }),
  );
}
