import { importedNodeClipToAutoMovieMotion } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { importedNodeMotionTestClip as clip } from "../internal/importedNodeMotionTestClip";
import { importedNodeMotionTestRestRelativeInput } from "../internal/importedNodeMotionTestRestRelativeInput";
import { importedNodeMotionTestRotation as rotation } from "../internal/importedNodeMotionTestRotation";
import { importedNodeMotionTestSkeleton as skeleton } from "../internal/importedNodeMotionTestSkeleton";
import { nclose, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

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
 * @evidence contracts/testing.md#behavioral-verification Calls actual imported-node lowering at authored key times, observing the sorted time union, root/rest-relative clinical values, mapping-order stability, optional root absence and named admission refusals.
 * @evidence contracts/testing.md#independent-expectations Literal translations, a spine quarter turn and authored rest offsets determine expected key results independently. Whole numeric records use the existing shape-preserving zero-tolerance comparator; 90-degree clinical inversion keeps its original nclose tolerance. Matching key outputs does not prove lossless inter-key quaternion-versus-clinical interpolation.
 * @evidence contracts/testing.md#distinguishing-cases Preserves missing/duplicate/unmapped/mixed/cubic/nonfinite/nonunit and identity/rig/mapping/channel/scale/weights boundaries, plus optional hips translation, explicit axes/rest frames and nonidentity rest rotation. The tiny source rig is an authored input rather than a measured Human model.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh clip/skeleton records through the extracted existing canonical fixtures, preserving array order and mapping identities. It opens no importer process, filesystem, renderer, browser or GPU and replaces no foreign method or production consumer.
 */
export function test_engine_imported_node_motion(): void {
  const motion: ReturnType<typeof importedNodeClipToAutoMovieMotion> =
    importedNodeClipToAutoMovieMotion({
      clip: clip(),
      sourceSkeleton: skeleton(),
      mapping,
      motionId: "native-clinical",
    });
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

  const reordered: ReturnType<typeof importedNodeClipToAutoMovieMotion> =
    importedNodeClipToAutoMovieMotion({
      clip: clip(),
      sourceSkeleton: skeleton(),
      mapping: [...mapping].reverse(),
      motionId: "native-clinical",
    });
  TestValidator.predicate(
    "mapping input order does not change canonical joint output",
    test12ValuesClose(reordered, motion),
  );

  TestValidator.equals(
    "missing, duplicate, and unmapped channels are refused",
    {
      missing: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          importedNodeClipToAutoMovieMotion({
            clip: { ...clip(), tracks: clip().tracks.slice(0, 2) },
            sourceSkeleton: skeleton(),
            mapping,
            motionId: "missing",
          }),
        "has no rotation channel",
      ),
      duplicate: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks.push({ ...source.tracks[1]! });
        importedNodeClipToAutoMovieMotion({
          clip: source,
          sourceSkeleton: skeleton(),
          mapping,
          motionId: "duplicate",
        });
      }, "repeats channel"),
      unmapped: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          importedNodeClipToAutoMovieMotion({
            clip: clip(),
            sourceSkeleton: skeleton(),
            mapping: mapping.slice(1),
            motionId: "unmapped",
          }),
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
        importedNodeClipToAutoMovieMotion({
          clip: source,
          sourceSkeleton: skeleton(),
          mapping,
          motionId: "cubic",
        });
      }, "cubic-spline"),
      mixed: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks[0] = { ...source.tracks[0]!, interpolation: "step" };
        importedNodeClipToAutoMovieMotion({
          clip: source,
          sourceSkeleton: skeleton(),
          mapping,
          motionId: "mixed",
        });
      }, "different interpolation"),
      nonfinite: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks[2]!.values[0] = NaN;
        importedNodeClipToAutoMovieMotion({
          clip: source,
          sourceSkeleton: skeleton(),
          mapping,
          motionId: "nonfinite",
        });
      }, "finite"),
      nonunit: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks[2]!.values.splice(0, 4, 0, 0, 0, 2);
        importedNodeClipToAutoMovieMotion({
          clip: source,
          sourceSkeleton: skeleton(),
          mapping,
          motionId: "nonunit",
        });
      }, "unit length"),
    },
    { cubic: true, mixed: true, nonfinite: true, nonunit: true },
  );

  TestValidator.equals(
    "ambiguous mapping and unsupported non-root translation are refused",
    {
      repeatedBone: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          importedNodeClipToAutoMovieMotion({
            clip: clip(),
            sourceSkeleton: skeleton(),
            mapping: [...mapping, { node: "other-node", bone: "spine" }],
            motionId: "ambiguous",
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
        importedNodeClipToAutoMovieMotion({
          clip: source,
          sourceSkeleton: skeleton(),
          mapping,
          motionId: "translated-spine",
        });
      }, "must map to hips"),
      oneTime: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          importedNodeClipToAutoMovieMotion({
            clip: {
              ...clip(),
              tracks: [
                rotation("pelvis-node", [0], [0, 0, 0, 1]),
                rotation("spine-node", [0], [0, 0, 0, 1]),
              ],
            },
            sourceSkeleton: skeleton(),
            mapping,
            motionId: "one-time",
          }),
        "at least two distinct",
      ),
    },
    { repeatedBone: true, nonRootTranslation: true, oneTime: true },
  );

  TestValidator.equals(
    "identity, skeleton, mapping, channel-kind, and scale boundaries refuse ambiguity",
    {
      blankMotion: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          importedNodeClipToAutoMovieMotion({
            clip: clip(),
            sourceSkeleton: skeleton(),
            mapping,
            motionId: " ",
          }),
        "id must not be blank",
      ),
      blankSkeleton: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          importedNodeClipToAutoMovieMotion({
            clip: clip(),
            sourceSkeleton: { ...skeleton(), id: " " },
            mapping,
            motionId: "blank-skeleton",
          }),
        "skeleton id must not be blank",
      ),
      emptyMapping: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          importedNodeClipToAutoMovieMotion({
            clip: clip(),
            sourceSkeleton: skeleton(),
            mapping: [],
            motionId: "empty-map",
          }),
        "explicit node-to-bone mapping",
      ),
      duplicateSkeletonBone: throwsError((): void => {
        const sourceSkeleton: IAutoMovieSkeleton = skeleton();
        sourceSkeleton.bones.push({ ...sourceSkeleton.bones[0]! });
        importedNodeClipToAutoMovieMotion({
          clip: clip(),
          sourceSkeleton,
          mapping,
          motionId: "duplicate-skeleton",
        });
      }, "repeats bone"),
      nonfiniteRestTranslation: throwsError((): void => {
        const sourceSkeleton: IAutoMovieSkeleton = skeleton();
        sourceSkeleton.bones[0]!.rest.translation.y = NaN;
        importedNodeClipToAutoMovieMotion({
          clip: clip(),
          sourceSkeleton,
          mapping,
          motionId: "bad-rest-translation",
        });
      }, "rest translation.y must be finite"),
      nonfiniteRestRotation: throwsError((): void => {
        const sourceSkeleton: IAutoMovieSkeleton = skeleton();
        sourceSkeleton.bones[1]!.rest.rotation.x = NaN;
        importedNodeClipToAutoMovieMotion({
          clip: clip(),
          sourceSkeleton,
          mapping,
          motionId: "bad-rest-rotation-finite",
        });
      }, "must contain only finite components"),
      nonunitRestRotation: throwsError((): void => {
        const sourceSkeleton: IAutoMovieSkeleton = skeleton();
        sourceSkeleton.bones[1]!.rest.rotation.w = 2;
        importedNodeClipToAutoMovieMotion({
          clip: clip(),
          sourceSkeleton,
          mapping,
          motionId: "bad-rest-rotation",
        });
      }, "rest"),
      blankNode: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          importedNodeClipToAutoMovieMotion({
            clip: clip(),
            sourceSkeleton: skeleton(),
            mapping: [{ node: " ", bone: "hips" }],
            motionId: "blank-node",
          }),
        "node must not be blank",
      ),
      repeatedNode: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          importedNodeClipToAutoMovieMotion({
            clip: clip(),
            sourceSkeleton: skeleton(),
            mapping: [...mapping, { node: "spine-node", bone: "head" }],
            motionId: "duplicate-node",
          }),
        "repeats node",
      ),
      absentBone: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          importedNodeClipToAutoMovieMotion({
            clip: clip(),
            sourceSkeleton: skeleton(),
            mapping: [{ node: "head-node", bone: "head" }],
            motionId: "absent-bone",
          }),
        "absent from source skeleton",
      ),
      nonNodeChannel: throwsError((): void => {
        const source: IAutoMovieClip = clip();
        source.tracks[0] = {
          ...source.tracks[0]!,
          channel: {
            kind: "bone",
            node: "pelvis-node",
            bone: "hips",
            path: "rotation",
          } as unknown as IAutoMovieTrack["channel"],
        };
        importedNodeClipToAutoMovieMotion({
          clip: source,
          sourceSkeleton: skeleton(),
          mapping,
          motionId: "non-node",
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
        importedNodeClipToAutoMovieMotion({
          clip: source,
          sourceSkeleton: skeleton(),
          mapping,
          motionId: "scale",
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
        importedNodeClipToAutoMovieMotion({
          clip: source,
          sourceSkeleton: skeleton(),
          mapping,
          motionId: "weights",
        });
      }, "cannot be represented"),
      noChannels: throwsError(
        (): ReturnType<typeof importedNodeClipToAutoMovieMotion> =>
          importedNodeClipToAutoMovieMotion({
            clip: { ...clip(), tracks: [] },
            sourceSkeleton: skeleton(),
            mapping,
            motionId: "no-channels",
          }),
        "no mapped channels",
      ),
    },
    {
      blankMotion: true,
      blankSkeleton: true,
      emptyMapping: true,
      duplicateSkeletonBone: true,
      nonfiniteRestTranslation: true,
      nonfiniteRestRotation: true,
      nonunitRestRotation: true,
      blankNode: true,
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
      rotationOnlyRoot: importedNodeClipToAutoMovieMotion({
        clip: rotationOnly,
        sourceSkeleton: skeleton(),
        mapping,
        motionId: "rotation-only",
      }).keyframes[0]!.pose.root,
      noHipsRoot: importedNodeClipToAutoMovieMotion({
        clip: noHipsClip,
        sourceSkeleton: skeleton(),
        mapping: [mapping[0]!],
        motionId: "spine-only",
      }).keyframes[0]!.pose.root,
      characterized: importedNodeClipToAutoMovieMotion({
        clip: clip(),
        sourceSkeleton: skeleton(),
        mapping,
        motionId: "characterized",
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
