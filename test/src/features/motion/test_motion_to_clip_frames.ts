import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Matrix4,
  motionToClip,
  resolveFrame,
} from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { bakeTimes, clipWorldParity } from "../internal/clipParity";
import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { vclose } from "../internal/predicates";

/**
 * Observe clinical remap propagation through the motion-to-node-track bridge at its baked clock, with a same-fixture remap-disabled position twin. Both bridge and FK observations share product math, so agreement is not independent anatomical or rendered-frame evidence.
 *
 * Scenarios:
 *
 * 1. A both-shoulders abduction motion baked with `HUMANOID_JOINT_AXES` +
 *    `HUMANOID_REST_FRAME` holds parity at every baked time.
 * 2. Negative twin: the remap is not a no-op; the left hand's world position baked
 *    with the rest frames differs from the bake without them.
 *
 * @evidence contracts/testing.md#behavioral-verification clipWorldParity invokes the actual bridge and compares every resolved fixture bone's position/rotation against clinical sampling/FK at bakeTimes(1); separate framed/plain bakes resolve the left hand at 0.5 and require a position difference.
 * @evidence contracts/testing.md#independent-expectations The unchanged both-shoulder abduction keys and HUMANOID tables define the semantic fixture. The FK-versus-bridge comparison is a metamorphic representation law at default 1e-6 tolerances, while the 1e-3 negative twin prevents an ignored remap from passing both paths unnoticed. No independent body-coordinate literal or visual result is asserted.
 * @evidence contracts/testing.md#distinguishing-cases Retains both shoulders, 90-to-130 degree motion, the nonempty default 24 Hz bake clock and supplied-versus-omitted clinical tables. Between-sample error bounds, node prefixes and invalid inputs belong to other bridge units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns the parity helper invocation and both additional bakes/frame resolutions. The existing helper owns the queried call tree and registers no extra tests; no viewer, process or GPU artifact is started.
 */
export function test_motion_to_clip_frames(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const motion: IAutoMovieMotion = makeMotion(
    [
      keyframe(
        0,
        makePose([
          joint("leftUpperArm", { abduction: 90 }),
          joint("rightUpperArm", { abduction: 90 }),
        ]),
      ),
      keyframe(
        1,
        makePose([
          joint("leftUpperArm", { abduction: 130 }),
          joint("rightUpperArm", { abduction: 130 }),
        ]),
      ),
    ],
    1,
  );

  TestValidator.predicate(
    "rest-frame parity",
    clipWorldParity({
      motion,
      skeleton,
      times: bakeTimes(1),
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
    }),
  );

  const framed: ReturnType<typeof motionToClip> = motionToClip({
    motion,
    skeleton,
    jointAxes: HUMANOID_JOINT_AXES,
    restFrames: HUMANOID_REST_FRAME,
  });
  const plain: ReturnType<typeof motionToClip> = motionToClip({
    motion,
    skeleton,
  });
  const handAt: (
    bridge: ReturnType<typeof motionToClip>,
  ) => IAutoMovieVector3 = (
    bridge: ReturnType<typeof motionToClip>,
  ): IAutoMovieVector3 =>
    Matrix4.position(
      resolveFrame({
        nodes: bridge.nodes,
        clip: bridge.clip,
        limits: [],
        seconds: 0.5,
      }).world.get("leftHand")!,
    );
  TestValidator.predicate(
    "remap is not a no-op",
    !vclose(handAt(framed), handAt(plain), 1e-3),
  );
}
