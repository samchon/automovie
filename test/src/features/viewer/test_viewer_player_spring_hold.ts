import type { IAutoMovieJointPose, IAutoMoviePose, IAutoMovieSkeleton } from "@automovie/interface";
import { type IAutoMovieViewerFrame, AutoMoviePlayer, createImportedModelObject } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import {
  IDENTITY_TRANSFORM,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const SKELETON: IAutoMovieSkeleton = {
  id: "spring-hold-rig",
  bones: [
    { bone: "hips", parent: null, rest: IDENTITY_TRANSFORM, constraint: null },
  ],
};

const flexionOf: (pose: IAutoMoviePose) => number | null = (pose: IAutoMoviePose): number | null =>
  pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === "hips")?.flexion ?? null;

/**
 * Repeating a timestamp preserves the player's live spring angle in its final callback pose, while a genuinely fresh zero-delta joint initializes at its target. The existing imported object has no mapped bones; this observes pose output, not native articulation, hidden velocity or rendered frames.
 *
 * Scenarios (stiffness 100 / damping 5, the #1048 fixture):
 *
 * 1. Mid-decay repeated updates keep the same present angle, and the next advancing update continues from nonzero state.
 * 2. Mid-lag repeated updates preserve the chased angle rather than resetting to the stepped 40-degree target.
 * 3. A fresh zero-delta first update initializes at its authored 25-degree target.
 *
 * @evidence contracts/testing.md#behavioral-verification Drives actual Player decay/lag, repeats a timestamp, then advances and reads final callback-pose angles; catches reseeding or deleting live output state on a zero-time update while preserving fresh initialization.
 * @evidence contracts/testing.md#independent-expectations The supported no-time relation preserves held observed angles; advancing output remains nonzero and changes, while a fresh sample has an authored 25-degree target. This does not independently establish hidden velocity or solver accuracy.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts live decay/tracking, repeated paused time, subsequent advance and fresh zero-delta state; backward time and broad trajectory accuracy are not exercised independently here.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit reuses existing generic rig/motion fixtures and the original frame callback through source, with CPU-side state and no browser, GPU, process or new Human driver.
 */
export function test_viewer_player_spring_hold(): void {
  // 1. mid-decay hold across repeated same-t updates
  const decayRecord: IAutoMoviePose[] = [];
  const decaying: AutoMoviePlayer = new AutoMoviePlayer(
    createImportedModelObject({
      object: new THREE.Object3D(),
      afterAutoMovieFrame: ({ pose }: IAutoMovieViewerFrame): number => decayRecord.push(pose),
    }),
    SKELETON,
    makeMotion(
      [
        keyframe(0, makePose([joint("hips", { flexion: 40 })])),
        keyframe(2, makePose([joint("hips", { flexion: 40 })])),
        keyframe(2.5, makePose([])),
        keyframe(6, makePose([])),
      ],
      6,
    ),
    undefined,
    false,
    { joints: ["hips"], stiffness: 100, damping: 5 },
  );
  for (let t: number = 0; t <= 2.7001; t += 1 / 30) decaying.update(t);
  const held: number | null = flexionOf(decayRecord[decayRecord.length - 1]!);
  if (held === null || Math.abs(held) < 0.1)
    throw new Error("fixture must be mid-decay with a live angle");
  decaying.update(2.7 + 1 / 30);
  decaying.update(2.7 + 1 / 30);
  decaying.update(2.7 + 1 / 30);
  const [frozen1, frozen2]: (number | null)[] = decayRecord.slice(-2).map(flexionOf);
  TestValidator.equals(
    "repeated same-t updates hold the decayed angle without vanishing",
    namedFacts([
      ["frozen1", (): boolean => frozen1 !== null],
      ["frozen2", (): boolean => frozen2 !== null],
      [
        "frozen1Frozen2",
        (): boolean => frozen1 !== null && frozen2 !== null && nclose(frozen1, frozen2, 0),
      ],
    ]),
    { frozen1: true, frozen2: true, frozen1Frozen2: true },
  );
  decaying.update(2.7 + 2 / 30);
  const resumed: number | null = flexionOf(decayRecord[decayRecord.length - 1]!);
  TestValidator.equals(
    "the next advancing frame continues the decay from the held state",
    namedFacts([
      ["resumed", (): boolean => resumed !== null],
      ["resumed2", (): boolean => resumed !== null && !nclose(resumed, 0, 0)],
      ["resumedFrozen1", (): boolean => resumed !== null && frozen1 !== null && !nclose(resumed, frozen1, 0)],
    ]),
    { resumed: true, resumed2: true, resumedFrozen1: true },
  );

  // 2. mid-lag hold: a paused frame must not pop to the target
  const lagRecord: IAutoMoviePose[] = [];
  const lagging: AutoMoviePlayer = new AutoMoviePlayer(
    createImportedModelObject({
      object: new THREE.Object3D(),
      afterAutoMovieFrame: ({ pose }: IAutoMovieViewerFrame): number => lagRecord.push(pose),
    }),
    SKELETON,
    makeMotion(
      [
        keyframe(0, makePose([joint("hips", { flexion: 0 })]), "step"),
        keyframe(1, makePose([joint("hips", { flexion: 40 })])),
      ],
      2,
    ),
    undefined,
    false,
    { joints: ["hips"], stiffness: 100, damping: 5 },
  );
  for (let t: number = 0; t <= 1.0001; t += 1 / 30) lagging.update(t);
  const lagged: number | null = flexionOf(lagRecord[lagRecord.length - 1]!);
  if (lagged === null || Math.abs(lagged - 40) < 1)
    throw new Error("fixture must still lag the stepped target");
  lagging.update(1.0001 + 1 / 30);
  const chased: number | null = flexionOf(lagRecord[lagRecord.length - 1]!);
  lagging.update(1.0001 + 1 / 30);
  const paused: number | null = flexionOf(lagRecord[lagRecord.length - 1]!);
  TestValidator.equals(
    "a paused frame holds the lagged angle instead of popping to the target",
    namedFacts([
      ["chased", (): boolean => chased !== null],
      ["pausedChased", (): boolean => chased !== null && paused !== null && nclose(paused, chased, 0)],
      ["paused", (): boolean => paused !== null && !nclose(paused, 40, 0)],
    ]),
    { chased: true, pausedChased: true, paused: true },
  );

  // 3. negative twin: no live state → a dt=0 first frame seeds at the target
  const freshRecord: IAutoMoviePose[] = [];
  const fresh: AutoMoviePlayer = new AutoMoviePlayer(
    createImportedModelObject({
      object: new THREE.Object3D(),
      afterAutoMovieFrame: ({ pose }: IAutoMovieViewerFrame): number => freshRecord.push(pose),
    }),
    SKELETON,
    makeMotion(
      [
        keyframe(0, makePose([joint("hips", { flexion: 25 })])),
        keyframe(1, makePose([joint("hips", { flexion: 25 })])),
      ],
      1,
    ),
    undefined,
    false,
    { joints: ["hips"], stiffness: 100, damping: 5 },
  );
  fresh.update(0.5);
  TestValidator.predicate(
    "a fresh joint's dt=0 first frame seeds at its target",
    nclose(flexionOf(freshRecord[0]!) ?? Number.NaN, 25, 0),
  );
}
