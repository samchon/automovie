import { motionToClip } from "@automovie/engine";
import type { IAutoMovieMotion, IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { bakeTimes, clipWorldParity } from "../internal/clipParity";
import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { nclose } from "../internal/predicates";

/**
 * Observe copied loop metadata and numerical FK/bridge agreement at wrapped and clamped queries. The existing three-stop elbow fixture closes its seam, but no rendered loop or arbitrary out-of-grid error guarantee is established.
 *
 * Scenarios:
 *
 * 1. The bridge copies the motion's loop flag, id, and duration onto the clip.
 * 2. A looping motion holds parity at wrapped queries: t = duration (wraps to 0 on
 *    both sides), t = 1.3·duration, and a negative t.
 * 3. Non-loop twin: the same motion with loop off clamps past the end on both
 *    sides (parity at t = duration + 0.5).
 *
 * @evidence contracts/testing.md#behavioral-verification Bakes the looping fixture and checks id/loop/exact duration, then invokes the actual bridge-versus-FK helper at bake times and duration/later/negative queries, plus a non-looping past-end twin.
 * @evidence contracts/testing.md#independent-expectations Literal duration 1 and the local 0-to-90-to-0 seam-closed motion define the fixture; modulo/clamp equivalence is a metamorphic representation law with shared product math, not an independent geometry oracle. Existing default 1e-6 position/quaternion-dot tolerances remain and duration uses eps0.
 * @evidence contracts/testing.md#distinguishing-cases Retains full bake grid, exact duration wrap, 1.3 and -0.2 queries, plus non-looping 1.5 clamp. The default-rate queried linear sections are this fixture's scope; arbitrary easing and between-sample error are covered separately.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns its metadata bake and both parity helper invocations; the helper's product call tree uses local data and registers no tests. No viewer, process or native artifact is started.
 */
export function test_motion_to_clip_loop(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const looping: IAutoMovieMotion = swingMotion(true);

  const bridge: ReturnType<typeof motionToClip> = motionToClip({ motion: looping, skeleton });
  TestValidator.equals("loop carried", bridge.clip.loop, true);
  TestValidator.equals("id carried", bridge.clip.id, looping.id);
  TestValidator.predicate("duration carried", nclose(bridge.clip.duration, 1, 0));

  TestValidator.predicate(
    "parity under wrap",
    clipWorldParity({
      motion: looping,
      skeleton,
      times: [...bakeTimes(1), 1, 1.3, -0.2],
    }),
  );

  TestValidator.predicate(
    "non-loop twin clamps in parity",
    clipWorldParity({
      motion: swingMotion(false),
      skeleton,
      times: [1.5],
    }),
  );
}

/** The unchanged three-stop elbow swing returns to its first pose; loop choice remains caller-authored. */
const swingMotion: (loop: boolean) => IAutoMovieMotion = (loop: boolean): IAutoMovieMotion =>
  makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
      keyframe(0.5, makePose([joint("leftLowerArm", { flexion: 90 })])),
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 0 })])),
    ],
    1,
    loop,
  );
