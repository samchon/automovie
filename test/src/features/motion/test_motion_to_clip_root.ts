import { MOTION_ROOT_NODE_ID, motionToClip } from "@automovie/engine";
import type { IAutoMovieMotion, IAutoMovieSkeleton, IAutoMovieTrack } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { bakeTimes, clipWorldParity } from "../internal/clipParity";
import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";

/**
 * Observe rigid root translation/rotation lowering for mixed null/authored roots, with an all-null negative twin. Numeric bake-time parity compares product representations rather than rendered placement or root scale semantics.
 *
 * Scenarios:
 *
 * 1. A motion whose root is set on one keyframe and `null` on the other holds
 *    parity at every baked time: the null side folds as identity.
 * 2. Root tracks exist exactly when some keyframe has a root: the animated motion
 *    emits translation + rotation tracks on the synthetic root node.
 * 3. Negative twin: an all-null-root motion emits no root-node tracks at all.
 *
 * @evidence contracts/testing.md#behavioral-verification Bakes the existing translated/yawed root-to-null motion through clipWorldParity at bake times, observes exactly translation/rotation root tracks, and verifies the all-null twin emits none.
 * @evidence contracts/testing.md#independent-expectations Literal track paths and the synthetic root id are independently authored expectations. Clinical FK versus node-frame equality is a metamorphic law through shared math with unchanged 1e-6 defaults; the nonempty mixed-root fixture and all-null twin distinguish omission from unconditional track emission without asserting a new geometry oracle.
 * @evidence contracts/testing.md#distinguishing-cases Retains authored root (1,2,3) and 90-degree yaw versus null, translated/rotated channels versus no root channels, and the same arm motion. All-null identity, scale and between-sample interpolation have separate scopes.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns its parity helper invocation and two explicit bakes using existing fixture constructors. Helpers register no extra cases and start no viewer, process or GPU artifact.
 */
export function test_motion_to_clip_root(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const rooted: IAutoMovieMotion = makeMotion(
    [
      keyframe(
        0,
        makePose([joint("leftUpperArm", { flexion: 30 })], {
          translation: { x: 1, y: 2, z: 3 },
          rotation: {
            x: 0,
            y: Math.sin(Math.PI / 4),
            z: 0,
            w: Math.cos(Math.PI / 4),
          },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
      keyframe(1, makePose([joint("leftUpperArm", { flexion: 60 })], null)),
    ],
    1,
  );

  TestValidator.predicate(
    "mixed null/non-null root parity",
    clipWorldParity({
      motion: rooted,
      skeleton,
      times: bakeTimes(1),
    }),
  );

  const bridge: ReturnType<typeof motionToClip> = motionToClip({ motion: rooted, skeleton });
  const rootTracks: IAutoMovieTrack[] = bridge.clip.tracks.filter(
    (track: IAutoMovieTrack): boolean =>
      track.channel.kind === "node" &&
      track.channel.node === MOTION_ROOT_NODE_ID,
  );
  TestValidator.equals(
    "root translation + rotation tracks emitted",
    rootTracks
      .map((t: IAutoMovieTrack): string => (t.channel.kind === "node" ? t.channel.path : ""))
      .sort((a: string, b: string): number => a.localeCompare(b)),
    ["rotation", "translation"],
  );

  const unrooted: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftUpperArm", { flexion: 30 })])),
      keyframe(1, makePose([joint("leftUpperArm", { flexion: 60 })])),
    ],
    1,
  );
  const bare: ReturnType<typeof motionToClip> = motionToClip({ motion: unrooted, skeleton });
  TestValidator.equals(
    "all-null root emits no root tracks",
    bare.clip.tracks.some(
      (track: IAutoMovieTrack): boolean =>
        track.channel.kind === "node" &&
        track.channel.node === MOTION_ROOT_NODE_ID,
    ),
    false,
  );
}
