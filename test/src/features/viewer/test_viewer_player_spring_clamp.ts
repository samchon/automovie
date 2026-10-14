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
import { namedFacts } from "../internal/predicates";

const SKELETON: IAutoMovieSkeleton = {
  id: "spring-rig",
  bones: [
    {
      bone: "hips",
      parent: null,
      rest: IDENTITY_TRANSFORM,
      constraint: {
        flexion: { min: -40, max: 40 },
        abduction: null,
        twist: null,
      },
    },
  ],
};

/**
 * The player's post-spring callback pose respects its authored ROM cap, and a joint absent from the sampled pose retains decaying follow-through. The existing imported object has no mapped bones, so the observation is the final pose sent to its callback rather than native bone articulation or rendered pixels.
 *
 * Scenarios:
 *
 * 1. A spring stepping toward a 40-degree cap stays within that cap in every captured callback pose while still approaching it.
 * 2. An absent authored joint remains present with nonzero follow-through initially and settles near zero later.
 *
 * @evidence contracts/testing.md#behavioral-verification Advances the actual Player and reads the final pose sent to its existing imported-frame callback; catches post-spring ROM overshoot in that output and immediate loss of a vanished joint's follow-through.
 * @evidence contracts/testing.md#independent-expectations The authored 40-degree cap bounds every captured pose while the underdamped sequence approaches it; absent-joint output remains nonzero initially and settles within half a degree later. These temporal bounds do not independently solve the spring trajectory or observe rendered frames.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts capped stepped tracking with uncapped missing-joint decay at initial/late observations; equal-time and fresh-state decisions belong to the hold test.
 * @evidence contracts/testing.md#execution-ownership This named portable unit uses the original generic rig/motion/callback seam through source with CPU-side Object3D/player state, creating no browser, renderer, process or new Human figure.
 */
export function test_viewer_player_spring_clamp(): void {
  const record: IAutoMoviePose[] = [];

  // 1. Every captured callback pose respects the ROM cap.
  const stepped: AutoMoviePlayer = new AutoMoviePlayer(
    createImportedModelObject({
      object: new THREE.Object3D(),
      afterAutoMovieFrame: ({ pose }: IAutoMovieViewerFrame): number => record.push(pose),
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
    true,
    { joints: ["hips"], stiffness: 100, damping: 5 },
  );
  for (let t: number = 0; t <= 3.0001; t += 1 / 30) stepped.update(t);
  const flexions: number[] = record.map(
    (pose: IAutoMoviePose): number => pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === "hips")?.flexion ?? 0,
  );
  const peak: number = Math.max(...flexions);
  TestValidator.equals(
    "the callback spring pose never exceeds the ROM cap yet reaches it",
    namedFacts([
      ["peakE", (): boolean => peak <= 40 + 1e-9],
      ["peak", (): boolean => peak <= 40 + 1e-9 && peak >= 39.5],
    ]),
    { peakE: true, peak: true },
  );

  // 2. follow-through decays instead of popping when the joint vanishes
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
  let firstAbsent: number | null = null;
  let settled: number | null = null;
  for (let t: number = 0; t <= 6.0001; t += 1 / 30) {
    decaying.update(t);
    const pose: IAutoMoviePose = decayRecord[decayRecord.length - 1]!;
    const flexion: number | null = pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === "hips")?.flexion ?? null;
    if (t > 2.51 && firstAbsent === null) firstAbsent = flexion;
    if (t > 5.9) settled = flexion;
  }
  TestValidator.equals(
    "vanished joints decay their follow-through smoothly to neutral",
    namedFacts([
      ["firstAbsent", (): boolean => firstAbsent !== null],
      [
        "MathAbsFirstAbsent",
        (): boolean => firstAbsent !== null && Math.abs(firstAbsent) > 0.5,
      ],
      ["settled", (): boolean => settled !== null],
      ["MathAbsSettled", (): boolean => settled !== null && Math.abs(settled) < 0.5],
    ]),
    {
      firstAbsent: true,
      MathAbsFirstAbsent: true,
      settled: true,
      MathAbsSettled: true,
    },
  );
}
