import { cutSequence } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieCut,
  IAutoMovieEditPlan,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Match declared prop motion at the hard cut actually played.
 *
 * Scenarios:
 *
 * 1. Match linear position and morph state at retimed interior trim boundaries, and
 *    accept equivalent wrist-joint quaternions with opposite signs.
 * 2. Shift the incoming trim by half a second and refuse an independently
 *    measured half-metre jump, while allowing that edit without requirements.
 * 3. Detect a morph-state jump when the incoming STEP starts exactly at its trim.
 * 4. Refuse an incoming track that only starts after the boundary, an outgoing
 *    STEP change on the excluded edge, and a transition with no hard cut.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls cutSequence with already-built tracks and checks accepted runtime, a measured continuity violation and distinct unsupported/missing cases through the public result.
 * @evidence contracts/development/testing.md#independent-expectations Position advances one metre per second. It is 1 metre at outgoing time 1 and incoming time 1.5, and 1.5 metres when the incoming trim instead starts at 2. At 2× and 0.5× the output spans are 0.375 and 2 seconds. The two unit quaternions denote identical orientations; the midpoint weights of both ramps are 0.5. An incoming STEP setting the weight to 0.125 jumps by 0.375.
 * @evidence contracts/development/testing.md#distinguishing-cases An interior trim shift isolates a position mismatch, while the active-channel and STEP cases distinguish absence from an unsupported outgoing boundary.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable test supplies finite clip data to cutSequence synchronously without a render host, timers or global changes.
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify source-time placements, channel units and meanings, hard cut versus overlap, and the independent arithmetic behind the measured jump.
 */
export function test_film_cut_sequence_prop_continuity(): void {
  const outgoingClip: IAutoMovieClip = {
    id: "outgoing",
    name: null,
    duration: 4,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "puppet", path: "translation" },
        interpolation: "linear",
        times: [0, 2],
        values: [0, 0, 0, 2, 0, 0],
      },
      {
        channel: { kind: "node", node: "puppet/wrist", path: "rotation" },
        interpolation: "linear",
        times: [0],
        values: [0, 0, 0, 1],
      },
      {
        channel: { kind: "node", node: "puppet", path: "weights" },
        interpolation: "linear",
        times: [0, 2],
        values: [0, 1],
      },
    ],
  };
  const incomingClip: IAutoMovieClip = {
    ...outgoingClip,
    id: "incoming",
    tracks: [
      {
        ...outgoingClip.tracks[0]!,
        times: [0.5, 2.5],
      },
      {
        ...outgoingClip.tracks[1]!,
        values: [0, 0, 0, -1],
      },
      {
        ...outgoingClip.tracks[2]!,
        times: [0.5, 2.5],
      },
    ],
  };
  const outgoing: IAutoMovieShot = {
    id: "wide",
    name: null,
    scene: "stage",
    camera: "wide-camera",
    cameraMotion: null,
    performances: [],
    objectMotions: [outgoingClip],
    duration: 4,
  };
  const incoming: IAutoMovieShot = {
    ...outgoing,
    id: "close",
    camera: "close-camera",
    objectMotions: [incomingClip],
  };
  const plan: IAutoMovieEditPlan = {
    sequence: { id: "stage-cut", name: "Stage cut" },
    fps: 24,
    entries: [
      {
        shot: outgoing.id,
        trim: { start: 0.25, duration: 0.75 },
        playbackRate: 2,
        transition: null,
      },
      {
        shot: incoming.id,
        trim: { start: 1.5, duration: 1 },
        playbackRate: 0.5,
        transition: null,
      },
    ],
    requiredPropContinuity: [
      { entry: 1, node: "puppet", component: "translation", tolerance: 0.125 },
      { entry: 1, node: "puppet/wrist", component: "rotation", tolerance: 0 },
      { entry: 1, node: "puppet", component: "weights", tolerance: 0 },
    ],
    pacing: "Cut from wide to close.",
    continuity: "Continue the performance.",
  };

  const matched: IAutoMovieCut = cutSequence(plan, [outgoing, incoming]);
  if (!matched.success) throw new Error("retimed interior states must match");
  TestValidator.predicate("played runtime", nclose(matched.runtime, 2.375));

  const shifted: IAutoMovieEditPlan = {
    ...plan,
    entries: [
      plan.entries[0]!,
      { ...plan.entries[1]!, trim: { start: 2, duration: 1 } },
    ],
    requiredPropContinuity: [plan.requiredPropContinuity![0]!],
  };
  const jumped: IAutoMovieCut = cutSequence(shifted, [outgoing, incoming]);
  if (jumped.success) throw new Error("the position jump must be refused");
  const jump: IAutoMovieConstraintViolation = jumped.violations[0]!;
  TestValidator.equals(
    "position requirement",
    jump.path,
    "$input.requiredPropContinuity[0]",
  );
  TestValidator.predicate("half-metre jump", nclose(Number(jump.value), 0.5));
  TestValidator.predicate(
    "tolerance excess",
    nclose(jump.overshoot ?? NaN, 0.375),
  );
  TestValidator.equals(
    "editor may leave a jump unchecked",
    cutSequence({ ...shifted, requiredPropContinuity: [] }, [
      outgoing,
      incoming,
    ]).success,
    true,
  );

  const changedMorph: IAutoMovieClip = {
    ...incomingClip,
    tracks: [
      incomingClip.tracks[0]!,
      incomingClip.tracks[1]!,
      {
        ...incomingClip.tracks[2]!,
        times: [1.5],
        values: [0.125],
        interpolation: "step",
      },
    ],
  };
  const changed: IAutoMovieCut = cutSequence(plan, [
    outgoing,
    { ...incoming, objectMotions: [changedMorph] },
  ]);
  if (changed.success)
    throw new Error("the first incoming STEP key must be active");
  TestValidator.equals(
    "only the morph-state requirement fails",
    changed.violations.map((item): string => item.path),
    ["$input.requiredPropContinuity[2]"],
  );
  TestValidator.predicate(
    "weight jump",
    nclose(Number(changed.violations[0]?.value), 0.375),
  );

  const late: IAutoMovieClip = {
    ...incomingClip,
    tracks: [
      { ...incomingClip.tracks[0]!, times: [2, 3] },
      incomingClip.tracks[1]!,
      incomingClip.tracks[2]!,
    ],
  };
  const missing: IAutoMovieCut = cutSequence(plan, [
    outgoing,
    { ...incoming, objectMotions: [late] },
  ]);
  TestValidator.predicate(
    "future track leaves the incoming boundary value absent",
    !missing.success &&
      (missing.violations[0]?.expected.includes(
        "incoming entry 1 at 1.5s lacks an active",
      ) ??
        false),
  );

  const stepping: IAutoMovieClip = {
    ...outgoingClip,
    tracks: [
      outgoingClip.tracks[0]!,
      outgoingClip.tracks[1]!,
      {
        ...outgoingClip.tracks[2]!,
        times: [0, 1],
        values: [0, 0.5],
        interpolation: "step",
      },
    ],
  };
  const discarded: IAutoMovieCut = cutSequence(plan, [
    { ...outgoing, objectMotions: [stepping] },
    incoming,
  ]);
  TestValidator.equals(
    "excluded STEP key cannot certify the outgoing morph state",
    discarded.success ? null : discarded.violations[0]?.path,
    "$input.requiredPropContinuity[2]",
  );

  const overlapping: IAutoMovieCut = cutSequence(
    {
      ...plan,
      entries: [
        plan.entries[0]!,
        {
          ...plan.entries[1]!,
          transition: { kind: "crossDissolve", duration: 0.25 },
        },
      ],
    },
    [outgoing, incoming],
  );
  TestValidator.equals(
    "dissolve refusal points to the incoming entry",
    overlapping.success ? null : overlapping.violations[0]?.path,
    "$input.requiredPropContinuity[0].entry",
  );
}
