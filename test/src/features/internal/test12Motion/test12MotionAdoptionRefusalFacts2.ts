import {
  type AutoMovieExternalMotionAdoptionDecision,
  adoptAutoMovieExternalMotion,
} from "@automovie/ingest";

import { throwsError } from "../predicates";
import type { ITest12MotionAdoptionContext } from "./ITest12MotionAdoptionContext";
import type { ITest12MotionDocument } from "./ITest12MotionDocument";
import { test12MotionRejectsMutation } from "./test12MotionRejectsMutation";
import { test12MotionRejectsPayloadMutation } from "./test12MotionRejectsPayloadMutation";

/**
 * Preserve refusal facts 19 through 36 in original registration order; the discoverable adoption unit owns their execution and independently authored diagnostic expectations.
 */
export function test12MotionAdoptionRefusalFacts2(
  context: ITest12MotionAdoptionContext,
): [string, () => boolean][] {
  const {
    inspection,
    motion,
    source,
    sourceRig,
    nativeDecision,
    retargetDecision,
    rejectsAdoption,
    rejectsRetarget,
  }: ITest12MotionAdoptionContext = context;
  return [
    [
      "weightOutputArityIsChecked",
      (): boolean =>
        test12MotionRejectsMutation((document: ITest12MotionDocument): void => {
          document.animations![0]!.channels = [
            { sampler: 2, target: { node: 2, path: "weights" } },
          ];
          document.accessors![3]!.type = "SCALAR";
          document.accessors![3]!.count = 3;
        }, "does not match the weights keyframe arity"),
    ],
    [
      "unitRotationIsRequired",
      (): boolean =>
        test12MotionRejectsPayloadMutation(
          (payload: Buffer<ArrayBufferLike>): number =>
            payload.writeFloatLE(2, 28),
          "non-unit rotation",
        ),
    ],
    [
      "animationNameMustBeString",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): string =>
            (document.animations![0]!.name = 1 as unknown as string),
          ".name must be a string",
        ),
    ],
    [
      "missingMotion",
      (): boolean =>
        throwsError(
          (): import("@automovie/ingest").IAutoMovieExternalMotionAdoption =>
            adoptAutoMovieExternalMotion({
              inspection: { ...inspection, motion: undefined },
              source,
              decision: nativeDecision,
            }),
          "no inspected motion",
        ),
    ],
    [
      "motionProfileIsRequired",
      (): boolean =>
        throwsError(
          (): import("@automovie/ingest").IAutoMovieExternalMotionAdoption =>
            adoptAutoMovieExternalMotion({
              inspection: { ...inspection, profile: "gltf-static-v1" },
              source,
              decision: nativeDecision,
            }),
          'requires the "gltf-motion-v1" inspection profile',
        ),
    ],
    [
      "motionInterpretationIsRequired",
      (): boolean =>
        throwsError(
          (): import("@automovie/ingest").IAutoMovieExternalMotionAdoption =>
            adoptAutoMovieExternalMotion({
              inspection: {
                ...inspection,
                motion: {
                  ...motion,
                  interpretation: "unknown" as typeof motion.interpretation,
                },
              },
              source,
              decision: nativeDecision,
            }),
          "interpretation",
        ),
    ],
    [
      "blankSourcePath",
      (): boolean =>
        rejectsAdoption(
          { ...source, path: " " },
          nativeDecision,
          "path must be non-blank",
        ),
    ],
    [
      "sourcePathMismatch",
      (): boolean =>
        rejectsAdoption(
          { ...source, path: "other.gltf" },
          nativeDecision,
          "does not match inspected path",
        ),
    ],
    [
      "nonIntegerByteLength",
      (): boolean =>
        rejectsAdoption(
          { ...source, byteLength: 1.5 },
          nativeDecision,
          "does not match inspected byteLength",
        ),
    ],
    [
      "nonPositiveByteLength",
      (): boolean =>
        rejectsAdoption(
          { ...source, byteLength: 0 },
          nativeDecision,
          "does not match inspected byteLength",
        ),
    ],
    [
      "mismatchedByteLength",
      (): boolean =>
        rejectsAdoption(
          { ...source, byteLength: source.byteLength + 1 },
          nativeDecision,
          "does not match inspected byteLength",
        ),
    ],
    [
      "digestMustBeSha256",
      (): boolean =>
        rejectsAdoption(
          { ...source, digest: "sha256:BAD" as typeof source.digest },
          nativeDecision,
          "lowercase SHA-256",
        ),
    ],
    [
      "takeMustExist",
      (): boolean =>
        rejectsAdoption(
          source,
          { ...nativeDecision, take: "missing" },
          "is not present",
        ),
    ],
    [
      "modeMustBeSupported",
      (): boolean =>
        rejectsAdoption(
          source,
          {
            mode: "automatic",
            take: "clip_0",
          } as unknown as AutoMovieExternalMotionAdoptionDecision,
          "Unsupported external motion adoption mode",
        ),
    ],
    [
      "sourceRigIdMustExist",
      (): boolean =>
        rejectsRetarget(
          { ...retargetDecision, sourceRig: { ...sourceRig, id: " " } },
          "source rig id must be non-blank",
        ),
    ],
    [
      "targetMustExist",
      (): boolean =>
        rejectsRetarget(
          { ...retargetDecision, target: " " },
          "target identity must be non-blank",
        ),
    ],
    [
      "sourceRigNeedsBones",
      (): boolean =>
        rejectsRetarget(
          { ...retargetDecision, sourceRig: { ...sourceRig, bones: [] } },
          "source rig has no bones",
        ),
    ],
    [
      "sourceRigBonesMustBeUnique",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            sourceRig: {
              ...sourceRig,
              bones: [...sourceRig.bones, sourceRig.bones[0]!],
            },
          },
          "duplicates bone",
        ),
    ],
  ];
}
