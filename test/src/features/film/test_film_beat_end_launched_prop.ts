import {
  IAutoMovieBeatEndActorState,
  IAutoMovieClip,
  IAutoMovieScene,
  IAutoMovieShot,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { resolveBeatEnd } from "@automovie/engine";
import { IDENTITY_TRANSFORM } from "../internal/fixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";

/** Where the stone sits in the thrower's hand, and where it is staged. */
const HAND: IAutoMovieVector3 = { x: -0.71, y: 1.35, z: 0 };

/** Where the flight ends: the stone on the ground, five metres out. */
const LANDED: IAutoMovieVector3 = { x: 0, y: 0, z: 5 };

/** Somewhere else entirely, for the clip whose id follows no convention. */
const SLID: IAutoMovieVector3 = { x: 2, y: 0, z: -1 };

/** The shot's own clock: grab at 0, release at 2.2, contact at 2.83625…. */
const RELEASE: number = 2.2;
const CONTACT: number = 2.836250052458314;

const drives: (
  id: string,
  times: number[],
  points: IAutoMovieVector3[],
  rotation?: boolean,
) => IAutoMovieClip = (
  id: string,
  times: number[],
  points: IAutoMovieVector3[],
  rotation: boolean = true,
): IAutoMovieClip => ({
  id,
  name: null,
  // The launch pass stretches its clip over the whole shot, so a sample past
  // contact clamps to the landed value rather than falling off the clip.
  duration: 5,
  loop: false,
  tracks: [
    {
      channel: { kind: "node", node: "stone", path: "translation" },
      times,
      values: points.flatMap((point: IAutoMovieVector3): number[] => [
        point.x,
        point.y,
        point.z,
      ]),
      interpolation: "linear",
    },
    ...(rotation
      ? [
          {
            channel: {
              kind: "node" as const,
              node: "stone",
              path: "rotation" as const,
            },
            times,
            values: times.flatMap((): number[] => [0, 0, 0, 1]),
            interpolation: "linear" as const,
          },
        ]
      : []),
  ],
});

/** Authored attachment-shaped tracks holding the hand point until release. */
const HELD: IAutoMovieClip = drives("attach:stone", [0, RELEASE], [HAND, HAND]);

/** Authored release and landing endpoints; this linear fixture does not model the flight's interior ballistic arc. */
const FLIGHT: IAutoMovieClip = drives(
  "trajectory:stone",
  [RELEASE, CONTACT],
  [HAND, LANDED],
);

/** A clip driving the same node under an id no consumer knows to look for. */
const SLIDE: IAutoMovieClip = drives("slide:stone", [3, 4], [LANDED, SLID]);

/** Translation-only late authority; rotation remains owned by the flight. */
const PARTIAL: IAutoMovieClip = drives(
  "drift:stone",
  [4, 4.5],
  [SLID, HAND],
  false,
);

/** An authority that begins exactly at the requested beat-end instant. */
const JUST_STARTED: IAutoMovieClip = drives("arrival:stone", [5], [LANDED]);

const scene: IAutoMovieScene = {
  id: "scene",
  name: null,
  nodes: [
    {
      id: "thrower",
      model: "hero",
      transform: IDENTITY_TRANSFORM,
      motion: null,
      pose: null,
    },
    {
      id: "stone",
      model: "stone",
      transform: {
        ...IDENTITY_TRANSFORM,
        translation: HAND,
      },
      motion: null,
      pose: null,
    },
  ],
  cameras: [],
  lights: [],
};

const shotOf: (
  duration: number,
  objectMotions: IAutoMovieClip[],
) => IAutoMovieShot = (
  duration: number,
  objectMotions: IAutoMovieClip[],
): IAutoMovieShot => ({
  id: "shot:beat-1",
  name: null,
  scene: "scene",
  camera: "cam",
  cameraMotion: null,
  performances: [],
  objectMotions,
  duration,
});

const stoneAt: (
  duration: number,
  objectMotions: IAutoMovieClip[],
) => IAutoMovieVector3 = (
  duration: number,
  objectMotions: IAutoMovieClip[],
): IAutoMovieVector3 =>
  resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(duration, objectMotions),
    motions: [],
  }).actors.find(
    (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "stone",
  )!.transform.translation;

/**
 * A beat end reports a driven prop where the shot's own clips leave it.
 *
 * A producer-id prefix cannot choose the final transform: flight or slide channels may acquire authority after an attachment releases. The snapshot follows the shot's started channel tracks, so a later beat receives the prop's final placement rather than its old hand position.
 *
 * The geometry is the reproduction's: grab at 0, release at 2.2 from `(-0.71, 1.35, 0)`, contact at 2.836250052458314 at `(0, 0, 5)`.
 *
 * Scenarios:
 *
 * 1. Past the landing, the beat end reports the stone where the flight left it, `(0, 0, 5)`, not the hand it was released from. The clip's last keyframe is the oracle, reached by clamping, exactly as the committed shot reads.
 * 2. Before the release the same pair of clips resolves to the hand, so the flight does not win by merely existing.
 * 3. The flight alone (no attach bake, a prop thrown from rest) is honoured too, which is the case the id prefix could never reach.
 * 4. Selection is id-agnostic: a clip called `slide:stone`, matching neither convention, drives the end state because it drives the node.
 * 5. Negative twin: a shot carrying no clip for the node retains its authored staged placement within the vector tolerance.
 * 6. A landed prop's end velocity is zero: the flight clip is clamped past contact, so nothing reports the stone as still travelling.
 * 7. A later translation-only clip supplies position while an earlier rotation track keeps a complete baked transform available; the identical rotation keys do not distinguish which rotation producer won.
 * 8. Reversing these two clips leaves the flight authoritative because its track starts later; equal-start producer-order ties are outside this case.
 * 9. A transform authority that starts exactly at beat end has no preceding sample window, so its derived velocity is honestly zero.
 * 10. A clip that also writes the node's scale reports that scale at beat end, the value playback draws, instead of a unit scale.
 * 11. A nonzero performer startOffset changes the pose clock, while object transforms and their derived velocities still read the shot clock.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveBeatEnd and compares positions, scales and trailing velocities against authored object tracks; detects prefix-based authority, wrong channel election and accidental subtraction of a performer offset from the object clock.
 * @evidence contracts/testing.md#independent-expectations Literal authored key times and endpoints determine the held or clamped positions and zero velocity after contact, without invoking a product sampler for expected values. The three-second cut minus a one-second performance offset gives localTime two while the object clock remains three; identical rotation keys limit the partial-channel case to position and complete-transform availability.
 * @evidence contracts/testing.md#distinguishing-cases Covers pre-release, post-contact, absent attach, unconventional ids, no clips, partial channel authority, reversed array order, exact-start velocity and scale; nonzero performance offset distinguishes pose-local and object-shot clocks.
 * @evidence contracts/testing.md#execution-ownership This synchronous portable entry owns all cases and imports resolveBeatEnd source directly; numeric clips reuse the existing authored trajectory and no process, browser, GPU or Human fixture is created.
 */
export function test_film_beat_end_launched_prop(): void {
  const offsetShot: IAutoMovieShot = {
    ...shotOf(3, [HELD, FLIGHT]),
    performances: [{ node: "stone", motion: null, startOffset: 1 }],
  };
  const offsetEnd: IAutoMovieBeatEndActorState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: offsetShot,
    motions: [],
  }).actors.find(
    (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "stone",
  )!;
  TestValidator.predicate(
    "performer offset changes only the actor's pose-local clock",
    nclose(offsetEnd.localTime, 2, 1e-12),
  );
  TestValidator.predicate(
    "performer offset does not rewind a landed object's shot clock",
    vclose(offsetEnd.transform.translation, LANDED, 1e-9),
  );
  TestValidator.predicate(
    "performer offset does not rewind object velocity",
    offsetEnd.rootVelocity !== null &&
      vclose(offsetEnd.rootVelocity, { x: 0, y: 0, z: 0 }, 1e-9),
  );
  // 1. the contradiction, resolved: the shot's clip decides.
  TestValidator.predicate(
    "a launched prop ends where its flight landed it",
    vclose(stoneAt(5, [HELD, FLIGHT]), LANDED, 1e-9),
  );

  // 2. before the release the hand still owns it.
  TestValidator.predicate(
    "before the release the attach bake is the authority",
    vclose(stoneAt(1, [HELD, FLIGHT]), HAND, 1e-9),
  );

  // 3. a flight with no attach bake in front of it.
  TestValidator.predicate(
    "a flight alone drives the end state",
    vclose(stoneAt(5, [FLIGHT]), LANDED, 1e-9),
  );

  // 4. the id spelling stopped deciding anything.
  TestValidator.predicate(
    "a clip under an unconventional id still drives the node",
    vclose(stoneAt(5, [HELD, FLIGHT, SLIDE]), SLID, 1e-9),
  );

  // 5. no clip for the node: the staged placement, unchanged.
  TestValidator.predicate(
    "a node no clip drives keeps its staged placement",
    vclose(stoneAt(5, []), HAND, 1e-9),
  );

  // 6. the landed stone is not still flying.
  const landed: IAutoMovieBeatEndActorState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(5, [HELD, FLIGHT]),
    motions: [],
  }).actors.find(
    (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "stone",
  )!;
  TestValidator.equals(
    "a landed prop reports no residual velocity",
    namedFacts([
      ["velocityReported", (): boolean => landed.rootVelocity !== null],
      [
        "velocityZero",
        // The null check is restated because the previous fact's narrowing of
        // the nullable field does not reach inside this closure.
        (): boolean =>
          landed.rootVelocity !== null &&
          vclose(landed.rootVelocity, { x: 0, y: 0, z: 0 }, 1e-9),
      ],
    ]),
    { velocityReported: true, velocityZero: true },
  );

  // 7. disjoint channel authorities compose into one transform.
  TestValidator.predicate(
    "a later translation composes with the earlier rotation authority",
    vclose(stoneAt(5, [HELD, FLIGHT, PARTIAL]), HAND, 1e-9),
  );

  // 8. The later track start wins for these unequal-start clips.
  TestValidator.predicate(
    "listing the flight first changes nothing",
    vclose(stoneAt(5, [FLIGHT, HELD]), LANDED, 1e-9),
  );

  const justStarted: IAutoMovieBeatEndActorState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(5, [JUST_STARTED]),
    motions: [],
  }).actors.find(
    (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "stone",
  )!;
  TestValidator.equals(
    "an authority starting at beat end has no prior velocity sample",
    namedFacts([
      ["velocityReported", (): boolean => justStarted.rootVelocity !== null],
      [
        "velocityZero",
        // The null check is restated because the previous fact's narrowing of
        // the nullable field does not reach inside this closure.
        (): boolean =>
          justStarted.rootVelocity !== null &&
          vclose(justStarted.rootVelocity, { x: 0, y: 0, z: 0 }, 1e-9),
      ],
    ]),
    { velocityReported: true, velocityZero: true },
  );

  // 10. an authored scale track is the scale the beat ends with.
  const grown: IAutoMovieClip = {
    ...FLIGHT,
    id: "grow:stone",
    tracks: [
      ...FLIGHT.tracks,
      {
        channel: { kind: "node", node: "stone", path: "scale" },
        times: [RELEASE, CONTACT],
        values: [1, 1, 1, 2, 3, 4],
        interpolation: "linear",
      },
    ],
  };
  TestValidator.predicate(
    "an authored scale reaches the beat end",
    vclose(
      resolveBeatEnd({
        beat: "beat-1",
        scene,
        shot: shotOf(5, [grown]),
        motions: [],
      }).actors.find(
        (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "stone",
      )!.transform.scale,
      { x: 2, y: 3, z: 4 },
      1e-9,
    ),
  );
}
