import { AutoMovieEngineMotionSampling, AutoMovieEngineKinematics, AutoMovieEngineMatrix4, AutoMovieEngineMotionClip, AutoMovieEngineResolve, AutoMovieEngineFilm } from "@automovie/engine";
import type { IAutoMovieClip, IAutoMovieMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { bakeTimes } from "../internal/bakeTimes";
import { createModel } from "../internal/createModel";
import { createSkeleton } from "../internal/createSkeleton";
import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { makeScriptWrite } from "../internal/makeScriptWrite";
import { makeStagingWrite } from "../internal/makeStagingWrite";
import { qclose, vclose } from "../internal/predicates";

/**
 * Per-actor clip prefixes resolve the same displayed bone frames as clinical FK through a shorter clip's final hold.
 *
 * Scenarios:
 * 1. Two performers execute elbow clips of different lengths, sharing one endpoint-inclusive playback clock.
 * 2. Each placed bone agrees between graph and clinical resolution; the performers' hips remain distinct.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves authored clinical poses and reads independently lowered node matrices.
 * @evidence contracts/development/testing.md#independent-expectations Actor placement multiplies the specialized bone transform and the shorter clip holds at its endpoint.
 * @evidence contracts/development/common.md#meaningful-documentation Two performers with different clip lengths share the endpoint-inclusive clock. Bone transforms agree between graph and clinical resolution, with independent hip placements.
 */
export function test_resolve_motion_clip_frames(): void {
  const staged = AutoMovieEngineFilm.stageScene(makeScriptWrite(), makeStagingWrite());
  if (!staged.success) throw new Error("stage admission failed");
  const skeleton = createSkeleton(),
    model = createModel(skeleton);
  const nodes = AutoMovieEngineResolve.sceneToNodes({
    scene: staged.scene,
    models: {
      stickman: { ...model, id: "stickman" },
      knightB: { ...model, id: "knightB" },
    },
  });
  const move = (seconds: number): IAutoMovieMotion =>
    makeMotion(
      [
        keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
        keyframe(seconds, makePose([joint("leftLowerArm", { flexion: 40 })])),
      ],
      seconds,
    );
  const players = [
    ["knightA", move(1)],
    ["knightB", move(2)],
  ] as const;
  const clip: IAutoMovieClip = {
    id: "two-performers",
    name: null,
    duration: 2,
    loop: false,
    tracks: players.flatMap(
      ([actor, motion]) =>
        AutoMovieEngineMotionClip.motionToClip({ motion, skeleton, nodePrefix: actor + "/" }).clip.tracks,
    ),
  };
  const times = bakeTimes(clip.duration);
  TestValidator.equals("endpoint included", times.at(-1), 2);
  for (const seconds of times) {
    const world = AutoMovieEngineResolve.resolveFrame({ nodes, clip, limits: [], seconds }).world;
    for (const [actor, motion] of players) {
      const placement = staged.scene.nodes.find(
        (node) => node.id === actor,
      )!.transform;
      const root = AutoMovieEngineMatrix4.compose(
        placement.translation,
        placement.rotation,
        placement.scale,
      );
      for (const joint of AutoMovieEngineKinematics.resolvePose(
        AutoMovieEngineMotionSampling.sampleMotion(motion, seconds).pose,
        skeleton,
      )) {
        const actual = world.get(actor + "/" + joint.bone)!;
        const expected = AutoMovieEngineMatrix4.multiply(
          root,
          AutoMovieEngineMatrix4.compose(joint.worldPosition, joint.worldRotation, {
            x: 1,
            y: 1,
            z: 1,
          }),
        );
        TestValidator.predicate(
          "bone frame " + actor + "/" + joint.bone,
          vclose(AutoMovieEngineMatrix4.position(actual), AutoMovieEngineMatrix4.position(expected), 1e-6) &&
            qclose(
              AutoMovieEngineMatrix4.decompose(actual).rotation,
              AutoMovieEngineMatrix4.decompose(expected).rotation,
              1e-6,
            ),
        );
      }
    }
    TestValidator.predicate(
      "distinct actor prefixes",
      !vclose(
        AutoMovieEngineMatrix4.position(world.get("knightA/hips")!),
        AutoMovieEngineMatrix4.position(world.get("knightB/hips")!),
        1e-6,
      ),
    );
  }
}
