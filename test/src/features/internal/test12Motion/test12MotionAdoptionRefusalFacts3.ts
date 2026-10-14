import { adoptAutoMovieExternalMotion } from "@automovie/ingest";

import { throwsError } from "../predicates";
import type { ITest12MotionAdoptionContext } from "./ITest12MotionAdoptionContext";
import { test12MotionWithTrack } from "./test12MotionWithTrack";

/**
 * Preserve refusal facts 37 through 53 in original registration order; the discoverable adoption unit owns their execution and independently authored diagnostic expectations.
 */
export function test12MotionAdoptionRefusalFacts3(
  context: ITest12MotionAdoptionContext,
): [string, () => boolean][] {
  const {
    inspection,
    source,
    sourceRig,
    retargetDecision,
    rejectsRetarget,
  }: ITest12MotionAdoptionContext = context;
  return [
    [
      "sourceRigNeedsHips",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            sourceRig: { ...sourceRig, bones: sourceRig.bones.slice(1) },
          },
          "missing required bone",
        ),
    ],
    [
      "sourceRigParentMustMatchInspectedHierarchy",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            sourceRig: {
              ...sourceRig,
              bones: sourceRig.bones.map(
                (
                  bone: import("@automovie/interface").IAutoMovieBone,
                ): import("@automovie/interface").IAutoMovieBone =>
                  bone.bone === "chest" ? { ...bone, parent: null } : bone,
              ),
            },
          },
          "does not match inspected parent",
        ),
    ],
    [
      "sourceRigRestMustMatchInspectedTrs",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            sourceRig: {
              ...sourceRig,
              bones: sourceRig.bones.map(
                (
                  bone: import("@automovie/interface").IAutoMovieBone,
                ): import("@automovie/interface").IAutoMovieBone =>
                  bone.bone === "chest"
                    ? {
                        ...bone,
                        rest: {
                          ...bone.rest,
                          translation: {
                            ...bone.rest.translation,
                            y: 1.25,
                          },
                        },
                      }
                    : bone,
              ),
            },
          },
          "rest translation.y",
        ),
    ],
    [
      "sourceRigRotationMustMatchInspectedTrs",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            sourceRig: {
              ...sourceRig,
              bones: sourceRig.bones.map(
                (
                  bone: import("@automovie/interface").IAutoMovieBone,
                ): import("@automovie/interface").IAutoMovieBone =>
                  bone.bone === "chest"
                    ? {
                        ...bone,
                        rest: {
                          ...bone.rest,
                          rotation: { ...bone.rest.rotation, w: 1 },
                        },
                      }
                    : bone,
              ),
            },
          },
          "rest rotation.w",
        ),
    ],
    [
      "sourceRigScaleMustMatchInspectedTrs",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            sourceRig: {
              ...sourceRig,
              bones: sourceRig.bones.map(
                (
                  bone: import("@automovie/interface").IAutoMovieBone,
                ): import("@automovie/interface").IAutoMovieBone =>
                  bone.bone === "chest"
                    ? {
                        ...bone,
                        rest: {
                          ...bone.rest,
                          scale: { ...bone.rest.scale, x: 2 },
                        },
                      }
                    : bone,
              ),
            },
          },
          "rest scale.x",
        ),
    ],
    [
      "mappingMustNotBeEmpty",
      (): boolean =>
        rejectsRetarget(
          { ...retargetDecision, mapping: [] },
          "semantic mapping must not be empty",
        ),
    ],
    [
      "translationScaleMustBeFinite",
      (): boolean =>
        rejectsRetarget(
          { ...retargetDecision, translationScale: Number.NaN },
          "translationScale must be finite and positive",
        ),
    ],
    [
      "translationScaleMustBePositive",
      (): boolean =>
        rejectsRetarget(
          { ...retargetDecision, translationScale: 0 },
          "translationScale must be finite and positive",
        ),
    ],
    [
      "mappingNodeMustExist",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            mapping: [
              { node: "node_9", bone: "hips" },
              { node: "node_2", bone: "chest" },
            ],
          },
          "not present in the inspected source",
        ),
    ],
    [
      "mappingBoneMustExist",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            mapping: [
              { node: "node_0", bone: "hips" },
              { node: "node_2", bone: "leftHand" },
            ],
          },
          "absent from source rig",
        ),
    ],
    [
      "mappingNodesMustBeUnique",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            mapping: [
              { node: "node_0", bone: "hips" },
              { node: "node_0", bone: "chest" },
            ],
          },
          "duplicates node",
        ),
    ],
    [
      "mappingBonesMustBeUnique",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            mapping: [
              { node: "node_0", bone: "hips" },
              { node: "node_2", bone: "hips" },
            ],
          },
          "duplicates bone",
        ),
    ],
    [
      "everyTrackNeedsMapping",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            mapping: [{ node: "node_0", bone: "hips" }],
          },
          "has no explicit semantic mapping",
        ),
    ],
    [
      "translationMustMapToHips",
      (): boolean =>
        rejectsRetarget(
          {
            ...retargetDecision,
            mapping: [
              { node: "node_0", bone: "chest" },
              { node: "node_2", bone: "hips" },
            ],
          },
          "must map to hips",
        ),
    ],
    [
      "pointerTracksAreRefused",
      (): boolean =>
        throwsError(
          (): import("@automovie/ingest").IAutoMovieExternalMotionAdoption =>
            adoptAutoMovieExternalMotion({
              inspection: test12MotionWithTrack(inspection, {
                channel: {
                  kind: "pointer",
                  pointer: "/x",
                  valueType: "scalar",
                },
                times: [0, 1],
                values: [0, 1],
                interpolation: "linear",
              }),
              source,
              decision: retargetDecision,
            }),
          "semantic conversion supports only node tracks",
        ),
    ],
    [
      "scaleTracksAreRefused",
      (): boolean =>
        throwsError(
          (): import("@automovie/ingest").IAutoMovieExternalMotionAdoption =>
            adoptAutoMovieExternalMotion({
              inspection: test12MotionWithTrack(inspection, {
                channel: { kind: "node", node: "node_0", path: "scale" },
                times: [0, 1],
                values: [1, 1, 1, 1, 1, 1],
                interpolation: "linear",
              }),
              source,
              decision: retargetDecision,
            }),
          "scale channel",
        ),
    ],
    [
      "weightTracksAreRefused",
      (): boolean =>
        throwsError(
          (): import("@automovie/ingest").IAutoMovieExternalMotionAdoption =>
            adoptAutoMovieExternalMotion({
              inspection: test12MotionWithTrack(inspection, {
                channel: { kind: "node", node: "node_0", path: "weights" },
                times: [0, 1],
                values: [0, 1],
                interpolation: "linear",
              }),
              source,
              decision: retargetDecision,
            }),
          "weights channel",
        ),
    ],
  ];
}
