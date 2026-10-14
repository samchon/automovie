import { MOTION_ROOT_NODE_ID, motionToClip } from "@automovie/engine";
import type { IAutoMovieMotion, IAutoMovieSkeleton, IAutoMovieTrack } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Observe bridge structural admission against a valid two-bone twin. Articulated absent bones refuse rather than disappearing from output, while valid track/node shape and the exact final clock constrain successful conversion.
 *
 * Scenarios:
 *
 * 1. A valid two-bone motion bakes: one rotation track per articulated bone in
 *    skeleton order, nodes = bones + the synthetic root, the bake clock ending
 *    exactly at the duration.
 * 2. Empty keyframes throw.
 * 3. Non-positive / non-finite sampleRate throws.
 * 4. Non-positive / non-finite duration throws.
 * 5. A motion articulating a bone missing from the skeleton throws, naming the
 *    bone.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls motionToClip on valid input, checks track identity/order, node count/root id, exact final time and null name, then requires diagnostic fragments for empty keys, bad rate/duration and absent leftToes articulation.
 * @evidence contracts/testing.md#independent-expectations The local rig/clip authors two articulated bones whose skeleton order is upper then lower, plus one synthetic root; literal names/count/name and final time 1 bound the output. Error fragments independently identify the refusal causes, and nclose eps0 retains the original exact final-clock requirement.
 * @evidence contracts/testing.md#distinguishing-cases Retains valid conversion, empty keys, zero/NaN rate, zero/Infinity duration and an absent articulated bone. The source guard domain is broader than this preserved input table; full motion admission and geometry parity are separate units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns each direct bridge call, including refusals, using existing in-memory fixtures. Helpers register no cases and start no viewer, process or native artifact.
 */
export function test_motion_to_clip_guards(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const valid: IAutoMovieMotion = makeMotion(
    [
      keyframe(
        0,
        makePose([
          joint("leftLowerArm", { flexion: 0 }),
          joint("leftUpperArm", { flexion: 10 }),
        ]),
      ),
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 120 })])),
    ],
    1,
  );

  const bridge: ReturnType<typeof motionToClip> = motionToClip({ motion: valid, skeleton });
  TestValidator.equals(
    "one rotation track per articulated bone, skeleton order",
    bridge.clip.tracks.map((t: IAutoMovieTrack): string =>
      t.channel.kind === "node" ? t.channel.node : "",
    ),
    ["leftUpperArm", "leftLowerArm"],
  );
  TestValidator.equals(
    "nodes are bones plus the synthetic root",
    bridge.nodes.length,
    skeleton.bones.length + 1,
  );
  TestValidator.equals(
    "root node leads the lowered hierarchy",
    bridge.nodes[0]!.id,
    MOTION_ROOT_NODE_ID,
  );
  const track: IAutoMovieTrack = bridge.clip.tracks[0]!;
  TestValidator.predicate(
    "bake clock ends exactly at duration",
    nclose(track.times[track.times.length - 1]!, 1, 0),
  );
  TestValidator.equals("clip name is null", bridge.clip.name, null);

  TestValidator.predicate(
    "empty keyframes throw",
    throwsError(
      (): ReturnType<typeof motionToClip> => motionToClip({ motion: { ...valid, keyframes: [] }, skeleton }),
      "must have keyframes",
    ),
  );
  TestValidator.predicate(
    "zero sampleRate throws",
    throwsError(
      (): ReturnType<typeof motionToClip> => motionToClip({ motion: valid, skeleton, sampleRate: 0 }),
      "sampleRate",
    ),
  );
  TestValidator.predicate(
    "NaN sampleRate throws",
    throwsError(
      (): ReturnType<typeof motionToClip> => motionToClip({ motion: valid, skeleton, sampleRate: Number.NaN }),
      "sampleRate",
    ),
  );
  TestValidator.predicate(
    "zero duration throws",
    throwsError(
      (): ReturnType<typeof motionToClip> => motionToClip({ motion: { ...valid, duration: 0 }, skeleton }),
      "duration",
    ),
  );
  TestValidator.predicate(
    "infinite duration throws",
    throwsError(
      (): ReturnType<typeof motionToClip> =>
        motionToClip({
          motion: { ...valid, duration: Number.POSITIVE_INFINITY },
          skeleton,
        }),
      "duration",
    ),
  );
  TestValidator.predicate(
    "unknown articulated bone throws, naming it",
    throwsError(
      (): ReturnType<typeof motionToClip> =>
        motionToClip({
          motion: makeMotion(
            [
              keyframe(0, makePose([joint("leftToes", { flexion: 5 })])),
              keyframe(1, makePose([joint("leftToes", { flexion: 15 })])),
            ],
            1,
          ),
          skeleton,
        }),
      ["leftToes", "does not have"],
    ),
  );
}
