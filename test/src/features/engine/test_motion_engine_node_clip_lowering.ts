import { importedNodeClipToAutoMovieMotion } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { importedNodeMotionTestClip as clip } from "../internal/importedNodeMotionTestClip";
import { importedNodeMotionTestRestRelativeInput } from "../internal/importedNodeMotionTestRestRelativeInput";
import { importedNodeMotionTestRotation as rotation } from "../internal/importedNodeMotionTestRotation";
import { importedNodeMotionTestSkeleton as skeleton } from "../internal/importedNodeMotionTestSkeleton";
import { nclose, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

type LoweringInput = Parameters<typeof importedNodeClipToAutoMovieMotion>[0];

function lower(
  change: Partial<LoweringInput>,
): ReturnType<typeof importedNodeClipToAutoMovieMotion> {
  return importedNodeClipToAutoMovieMotion({
    clip: clip(),
    sourceSkeleton: skeleton(),
    mapping,
    motionId: "native-clinical",
    ...change,
  });
}
const mapping: Parameters<
  typeof importedNodeClipToAutoMovieMotion
>[0]["mapping"] = [
  { node: "spine-node", bone: "spine" as const },
  { node: "pelvis-node", bone: "hips" as const },
];

/**
 * Imported node tracks lower at authored times with no semantic inference.
 *
 * Scenarios:
 *
 * 1. A mapped clip lowers the authored key-time union, root translation, joint
 *    rotation, and interpolation while mapping order leaves the result stable.
 * 2. Missing, duplicate, unmapped, unsupported, ambiguous, corrupt, or
 *    insufficient source facts are refused at the precise lowering boundary.
 * 3. Optional root translation and explicit joint-axis and rest-frame
 *    characterization retain their declared absence or supplied basis.
 * 4. Absolute imported transforms are normalized against the source rest pose
 *    rather than copied as clinical angles.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual imported-node lowering at authored key times, observing the sorted time union, root/rest-relative clinical values, mapping-order stability, optional root absence and named admission refusals.
 * @evidence contracts/development/testing.md#independent-expectations Literal translations, a spine quarter turn and authored rest offsets determine expected key results independently. Whole numeric records use the existing shape-preserving zero-tolerance comparator; 90-degree clinical inversion keeps its original nclose tolerance. Matching key outputs does not prove lossless inter-key quaternion-versus-clinical interpolation.
 * @evidence contracts/development/testing.md#distinguishing-cases Preserves missing/duplicate/unmapped/mixed/cubic/nonunit and rig/mapping/channel/scale/weights boundaries, plus optional hips translation, explicit axes/rest frames and nonidentity rest rotation. The tiny source rig is an authored input rather than a measured Human model.
 * @evidence contracts/development/testing.md#execution-ownership This named synchronous unit owns fresh clip/skeleton records through the extracted existing canonical fixtures, preserving array order and mapping identities. It opens no importer process, filesystem, renderer, browser or GPU and replaces no foreign method or production consumer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A mapped clip lowers the authored key-time union, root translation, joint).
 */
export function test_motion_engine_node_clip_lowering(): void {
  const motion: ReturnType<typeof importedNodeClipToAutoMovieMotion> = lower(
    {},
  );
  TestValidator.predicate(
    "the authored key-time union becomes clinical source motion",
    test12ValuesClose(
      {
        id: motion.id,
        skeleton: motion.skeleton,
        times: motion.keyframes.map(
          (keyframe: IAutoMovieKeyframe): number => keyframe.time,
        ),
        rootX: motion.keyframes[1]!.pose.root?.translation.x,
        spineFlexion: nclose(
          motion.keyframes[1]!.pose.joints.find(
            (joint: IAutoMovieJointPose): boolean => joint.bone === "spine",
          )!.flexion!,
          90,
        ),
        easing: motion.keyframes.map(
          (keyframe: IAutoMovieKeyframe): IAutoMovieKeyframe["easing"] =>
            keyframe.easing,
        ),
      },
      {
        id: "native-clinical",
        skeleton: "source-rig",
        times: [0, 0.5, 1],
        rootX: 1,
        spineFlexion: true,
        easing: ["linear", "linear", "linear"],
      },
    ),
  );

  const reordered: ReturnType<typeof importedNodeClipToAutoMovieMotion> = lower(
    { mapping: [...mapping].reverse() },
  );
  TestValidator.predicate(
    "mapping input order does not change canonical joint output",
    test12ValuesClose(reordered, motion),
  );

  TestValidator.equals(
    "missing, duplicate, and unmapped channels are refused",
    {
      missing: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          lower({
            clip: { ...clip(), tracks: clip().tracks.slice(0, 2) },
          }),
        "has no rotation channel",
      ),
      duplicate: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks.push({ ...source.tracks[1]! });
        lower({
          clip: source,
        });
      }, "repeats channel"),
      unmapped: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          lower({ mapping: mapping.slice(1) }),
        "no explicit bone mapping",
      ),
    },
    { missing: true, duplicate: true, unmapped: true },
  );

  TestValidator.equals(
    "unrepresentable interpolation and corrupt quaternions are refused",
    {
      cubic: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks[2] = {
          ...source.tracks[2]!,
          interpolation: "cubicspline",
        };
        lower({
          clip: source,
        });
      }, "cubic-spline"),
      mixed: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks[0] = { ...source.tracks[0]!, interpolation: "step" };
        lower({
          clip: source,
        });
      }, "different interpolation"),
      nonunit: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks[2]!.values.splice(0, 4, 0, 0, 0, 2);
        lower({
          clip: source,
        });
      }, "unit length"),
    },
    { cubic: true, mixed: true, nonunit: true },
  );

  TestValidator.equals(
    "ambiguous mapping and unsupported non-root translation are refused",
    {
      repeatedBone: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          lower({
            mapping: [...mapping, { node: "other-node", bone: "spine" }],
          }),
        "repeats bone",
      ),
      nonRootTranslation: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks.push({
          channel: {
            kind: "node",
            node: "spine-node",
            path: "translation",
          },
          times: [0, 1],
          values: [0, 0, 0, 0, 0, 0],
          interpolation: "linear",
        });
        lower({
          clip: source,
        });
      }, "must map to hips"),
      oneTime: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          lower({
            clip: {
              ...clip(),
              tracks: [
                rotation("pelvis-node", [0], [0, 0, 0, 1]),
                rotation("spine-node", [0], [0, 0, 0, 1]),
              ],
            },
          }),
        "at least two distinct",
      ),
    },
    { repeatedBone: true, nonRootTranslation: true, oneTime: true },
  );

  TestValidator.equals(
    "skeleton, mapping, channel-kind, and scale boundaries refuse ambiguity",
    {
      emptyMapping: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          lower({ mapping: [] }),
        "explicit node-to-bone mapping",
      ),
      duplicateSkeletonBone: throwsError((): void => {
        const sourceSkeleton: IAutoMovieSkeleton = skeleton();
        sourceSkeleton.bones.push({ ...sourceSkeleton.bones[0]! });
        lower({ sourceSkeleton });
      }, "repeats bone"),
      nonunitRestRotation: throwsError((): void => {
        const sourceSkeleton: IAutoMovieSkeleton = skeleton();
        sourceSkeleton.bones[1]!.rest.rotation.w = 2;
        lower({ sourceSkeleton });
      }, "rest"),
      repeatedNode: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          lower({
            mapping: [...mapping, { node: "spine-node", bone: "head" }],
          }),
        "repeats node",
      ),
      absentBone: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          lower({ mapping: [{ node: "head-node", bone: "head" }] }),
        "absent from source skeleton",
      ),
      nonNodeChannel: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks[0] = {
          ...source.tracks[0]!,
          channel: {
            kind: "pointer",
            pointer: "/nodes/0/rotation",
            valueType: "quaternion",
          },
        };
        lower({
          clip: source,
        });
      }, "only node channels"),
      scale: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks.push({
          channel: { kind: "node", node: "spine-node", path: "scale" },
          times: [0, 1],
          values: [1, 1, 1, 1, 1, 1],
          interpolation: "linear",
        });
        lower({
          clip: source,
        });
      }, "cannot be represented"),
      weights: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks.push({
          channel: { kind: "node", node: "spine-node", path: "weights" },
          times: [0, 1],
          values: [0, 1],
          interpolation: "linear",
        });
        lower({
          clip: source,
        });
      }, "cannot be represented"),
      noChannels: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          lower({
            clip: { ...clip(), tracks: [] },
          }),
        "no mapped channels",
      ),
    },
    {
      emptyMapping: true,
      duplicateSkeletonBone: true,
      nonunitRestRotation: true,
      repeatedNode: true,
      absentBone: true,
      nonNodeChannel: true,
      scale: true,
      weights: true,
      noChannels: true,
    },
  );

  const rotationOnly: IAutoMovieClip = clip();
  rotationOnly.tracks = rotationOnly.tracks.slice(1);
  const noHipsClip: IAutoMovieClip = {
    ...clip(),
    tracks: [rotation("spine-node", [0, 1], [0, 0, 0, 1, 0, 0, 0, 1])],
  };
  TestValidator.equals(
    "root translation is optional and explicit source characterization is consumed",
    {
      rotationOnlyRoot: lower({
        clip: rotationOnly,
      }).keyframes[0]!.pose.root,
      noHipsRoot: lower({
        clip: noHipsClip,
        mapping: [mapping[0]!],
      }).keyframes[0]!.pose.root,
      characterized: lower({
        sourceJointAxes: {
          spine: {
            flexion: { x: 1, y: 0, z: 0 },
            abduction: { x: 0, y: 0, z: 1 },
            twist: { x: 0, y: 1, z: 0 },
          },
        },
        sourceRestFrames: {
          spine: { flexion: { sign: 1, neutral: 0 } },
        },
      }).keyframes.length,
    },
    { rotationOnlyRoot: null, noHipsRoot: null, characterized: 3 },
  );

  const neutral: ReturnType<typeof importedNodeClipToAutoMovieMotion> =
    importedNodeClipToAutoMovieMotion(
      importedNodeMotionTestRestRelativeInput(mapping),
    );
  TestValidator.predicate(
    "absolute imported node TRS is normalized against the source rest pose",
    test12ValuesClose(
      {
        root: neutral.keyframes[0]!.pose.root?.translation,
        spine: neutral.keyframes[0]!.pose.joints.find(
          (joint: IAutoMovieJointPose): boolean => joint.bone === "spine",
        ),
      },
      {
        root: { x: 0, y: 0, z: 0 },
        spine: { bone: "spine", flexion: 0, abduction: 0, twist: 0 },
      },
    ),
  );
}
