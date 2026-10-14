import {
  type AutoMovieExternalMotionAdoptionDecision,
  type IAutoMovieExternalMotionRetargetDecision,
  adoptAutoMovieExternalMotion,
} from "@automovie/ingest";
import type { IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";
import { test12MotionAdoptionRefusalFacts1 } from "../internal/test12Motion/test12MotionAdoptionRefusalFacts1";
import { test12MotionAdoptionRefusalFacts2 } from "../internal/test12Motion/test12MotionAdoptionRefusalFacts2";
import { test12MotionAdoptionRefusalFacts3 } from "../internal/test12Motion/test12MotionAdoptionRefusalFacts3";
import { test12MotionDocument } from "../internal/test12Motion/test12MotionDocument";
import { test12MotionFixture } from "../internal/test12Motion/test12MotionFixture";
import { test12MotionInspect } from "../internal/test12Motion/test12MotionInspect";
import { test12MotionSkeleton } from "../internal/test12Motion/test12MotionSkeleton";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * External motion bytes normalize deterministically, and adoption preserves the author's native or retarget choice without provider access or rig guessing.
 *
 * Scenarios:
 *
 * 1. A motion-only glTF exposes named node tracks for LINEAR, STEP, and CUBICSPLINE samplers plus its byte-grounded node hierarchy and rest basis without requiring a render mesh.
 * 2. Repeated native adoption returns equal, defensively copied takes preserving the declared source path, digest spelling and byte length.
 * 3. Retarget adoption accepts only an explicit source rig, node-to-bone map, and target identity whose mapped hierarchy and rest exactly match inspected nodes, then canonicalizes the map without mutating inputs.
 * 4. Malformed sampler facts and every ambiguous adoption input fail with a specific diagnostic instead of a fallback take, rig, basis, or mode.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls motion inspection and native/retarget adoption, observing normalized tracks, defensive copies, canonical mappings and field-specific refusals; guessed rigs, mismatched path/length, malformed digest spelling or input mutation fails.
 * @evidence contracts/testing.md#independent-expectations Resident little-endian sample arrays, explicit node rest transforms and the authored source rig define normalization and retarget expectations; the native copy expectation reuses the independently authored motion literal captured before output mutation, so leaked input mutation cannot change the oracle. Digest-to-byte hashing remains the manifest caller's responsibility and is not proved here.
 * @evidence contracts/testing.md#distinguishing-cases LINEAR/STEP/CUBICSPLINE, weights, absent names, native/retarget modes, mapping order, mutation isolation and every registered malformed sampler/provenance/rig/map/track case are retained; byte-container and forest depth cases belong to separate units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_external_motion_adoption entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_external_motion_adoption(): void {
  const fixture: ReturnType<typeof test12MotionFixture> = test12MotionFixture();
  const inspection: import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection =
    test12MotionInspect(fixture);
  const motion:
    | import("../../../../packages/ingest/src/IAutoMovieExternalMotionInspection").IAutoMovieExternalMotionInspection
    | undefined = inspection.motion;
  TestValidator.predicate("motion inspection is present", motion !== undefined);
  if (motion === undefined) return;
  const expectedMotion: NonNullable<
    ReturnType<typeof test12MotionInspect>["motion"]
  > = {
    path: "public/motion/walk.gltf",
    byteLength: fixture.bytes.byteLength,
    interpretation: "gltf-2.0-meter-right-handed-y-up",
    nodes: [
      {
        id: "node_0",
        index: 0,
        name: "Root",
        parent: null,
        transform: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
      },
      {
        id: "node_1",
        index: 1,
        name: null,
        parent: "node_0",
        transform: {
          translation: { x: 0, y: 0.25, z: 0 },
          rotation: { x: 0, y: 0, z: 1, w: 0 },
          scale: { x: 2, y: 2, z: 2 },
        },
      },
      {
        id: "node_2",
        index: 2,
        name: "Chest",
        parent: "node_1",
        transform: {
          translation: { x: 0, y: 0.75, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 0.5, y: 0.5, z: 0.5 },
        },
      },
    ],
    nodeIds: ["node_0", "node_1", "node_2"],
    takes: [
      {
        id: "clip_0",
        name: "Walk",
        duration: 1,
        loop: false,
        tracks: [
          {
            channel: { kind: "node", node: "node_0", path: "rotation" },
            times: [0, 1],
            values: fixture.cubicRotation,
            interpolation: "cubicspline",
          },
          {
            channel: {
              kind: "node",
              node: "node_0",
              path: "translation",
            },
            times: [0, 1],
            values: [0, 0, 0, 1, 0, 0],
            interpolation: "step",
          },
          {
            channel: { kind: "node", node: "node_2", path: "rotation" },
            times: [0, 1],
            values: [0, 0, 0, 1, 0, 0, 0, 1],
            interpolation: "linear",
          },
        ],
      },
    ],
  };
  TestValidator.predicate(
    "normalized motion inventory",
    test12ValuesClose(motion, expectedMotion),
  );
  const weightsDocument: ReturnType<typeof test12MotionDocument> =
    test12MotionDocument();
  weightsDocument.animations[0]!.channels = [
    { sampler: 2, target: { node: 2, path: "weights" } },
  ];
  weightsDocument.accessors[3]!.type = "SCALAR";
  TestValidator.predicate(
    "weight tracks use scalar source samples",
    test12ValuesClose(
      test12MotionInspect(test12MotionFixture(weightsDocument)).motion?.takes[0]
        ?.tracks[0]?.channel,
      { kind: "node", node: "node_2", path: "weights" },
    ),
  );
  const unnamedDocument: ReturnType<typeof test12MotionDocument> =
    test12MotionDocument();
  unnamedDocument.animations[0]!.name = "";
  TestValidator.predicate(
    "empty animation names normalize to null",
    test12ValuesClose(
      test12MotionInspect(test12MotionFixture(unnamedDocument)).motion?.takes[0]
        ?.name,
      null,
    ),
  );
  const absentNameDocument: ReturnType<typeof test12MotionDocument> =
    test12MotionDocument();
  delete (absentNameDocument.animations[0]! as { name?: string }).name;
  TestValidator.predicate(
    "absent animation names normalize to null",
    test12ValuesClose(
      test12MotionInspect(test12MotionFixture(absentNameDocument)).motion
        ?.takes[0]?.name,
      null,
    ),
  );

  const source: {
    path: string;
    digest: `sha256:${string}`;
    byteLength: number;
  } = {
    path: "public/motion/walk.gltf",
    digest: `sha256:${"a".repeat(64)}` as const,
    byteLength: fixture.bytes.byteLength,
  };
  const sourceRig: IAutoMovieSkeleton = test12MotionSkeleton();
  const mapping: (
    | { node: string; bone: "chest" }
    | { node: string; bone: "hips" }
  )[] = [
    { node: "node_2", bone: "chest" as const },
    { node: "node_0", bone: "hips" as const },
  ];
  const nativeDecision: {
    mode: "native";
    take: string;
    sourceRig: IAutoMovieSkeleton;
    mapping: (
      | { node: string; bone: "chest" }
      | { node: string; bone: "hips" }
    )[];
  } = {
    mode: "native" as const,
    take: "clip_0",
    sourceRig,
    mapping,
  };
  const native: import("../../../../packages/ingest/src/IAutoMovieExternalMotionAdoption").IAutoMovieExternalMotionAdoption =
    adoptAutoMovieExternalMotion({
      inspection,
      source,
      decision: nativeDecision,
    });
  native.take.tracks[0]!.times[0] = 99;
  const nativeAgain: import("../../../../packages/ingest/src/IAutoMovieExternalMotionAdoption").IAutoMovieExternalMotionAdoption =
    adoptAutoMovieExternalMotion({
      inspection,
      source,
      decision: nativeDecision,
    });
  TestValidator.predicate(
    "native adoption is stable and defensive",
    test12ValuesClose(nativeAgain, {
      source,
      mode: "native",
      take: expectedMotion.takes[0]!,
      handoff: {
        mode: "native",
        sourceRig,
        mapping: [
          { node: "node_0", bone: "hips" },
          { node: "node_2", bone: "chest" },
        ],
      },
    }),
  );
  TestValidator.predicate(
    "an already canonical native map stays canonical",
    test12ValuesClose(
      adoptAutoMovieExternalMotion({
        inspection,
        source,
        decision: {
          ...nativeDecision,
          mapping: [...mapping].reverse(),
        },
      }).handoff.mapping,
      [
        { node: "node_0", bone: "hips" },
        { node: "node_2", bone: "chest" },
      ],
    ),
  );

  const retargetDecision: IAutoMovieExternalMotionRetargetDecision = {
    mode: "retarget",
    take: "clip_0",
    sourceRig,
    mapping,
    translationScale: 1.25,
    target: "actor/main",
  };
  const retargeted: import("../../../../packages/ingest/src/IAutoMovieExternalMotionAdoption").IAutoMovieExternalMotionAdoption =
    adoptAutoMovieExternalMotion({
      inspection,
      source,
      decision: retargetDecision,
    });
  retargeted.handoff.sourceRig.bones[1]!.rest.translation.y = 99;
  retargeted.handoff.sourceRig.bones[1]!.constraint!.flexion!.max = 99;
  retargeted.handoff.mapping[0]!.node = "mutated";
  const retargetedAgain: import("../../../../packages/ingest/src/IAutoMovieExternalMotionAdoption").IAutoMovieExternalMotionAdoption =
    adoptAutoMovieExternalMotion({
      inspection,
      source,
      decision: retargetDecision,
    });
  TestValidator.predicate(
    "retarget handoff remains discriminated",
    retargetedAgain.handoff.mode === "retarget",
  );
  if (retargetedAgain.handoff.mode !== "retarget") return;
  TestValidator.predicate(
    "retarget handoff is canonical and defensive",
    test12ValuesClose(
      {
        mode: retargetedAgain.mode,
        mapping: retargetedAgain.handoff.mapping,
        translationScale: retargetedAgain.handoff.translationScale,
        target: retargetedAgain.handoff.target,
        chestRestY:
          retargetedAgain.handoff.sourceRig.bones[1]?.rest.translation.y,
        chestRestRotation:
          retargetedAgain.handoff.sourceRig.bones[1]?.rest.rotation,
        chestRestScale: retargetedAgain.handoff.sourceRig.bones[1]?.rest.scale,
        chestFlexionMax:
          retargetedAgain.handoff.sourceRig.bones[1]?.constraint?.flexion?.max,
      },
      {
        mode: "retarget",
        mapping: [
          { node: "node_0", bone: "hips" },
          { node: "node_2", bone: "chest" },
        ],
        target: "actor/main",
        translationScale: 1.25,
        chestRestY: -1.25,
        chestRestRotation: { x: 0, y: 0, z: 1, w: 0 },
        chestRestScale: { x: 1, y: 1, z: 1 },
        chestFlexionMax: 45,
      },
    ),
  );

  TestValidator.predicate(
    "malformed motion and adoption decisions are refused",
    test12ValuesClose(
      namedFacts([
        ...test12MotionAdoptionRefusalFacts1(),
        ...test12MotionAdoptionRefusalFacts2({
          inspection,
          motion,
          source,
          sourceRig,
          nativeDecision,
          retargetDecision,
          rejectsAdoption,
          rejectsRetarget,
        }),
        ...test12MotionAdoptionRefusalFacts3({
          inspection,
          motion,
          source,
          sourceRig,
          nativeDecision,
          retargetDecision,
          rejectsAdoption,
          rejectsRetarget,
        }),
      ]),
      Object.fromEntries(
        [
          "motionProfileNeedsAnimation",
          "animationNeedsSampler",
          "animationNeedsChannel",
          "samplerIndexMustResolve",
          "targetMustBeObject",
          "targetNodeMustResolve",
          "targetPathMustBeSupported",
          "targetMustBeUnique",
          "samplerInputMustResolve",
          "samplerOutputMustResolve",
          "interpolationMustBeSupported",
          "inputMustBeFloatScalar",
          "outputMustBeExpectedShape",
          "sparseMotionIsRefused",
          "nonFiniteSampleIsRefused",
          "negativeTimeIsRefused",
          "repeatedTimeIsRefused",
          "outputArityIsChecked",
          "weightOutputArityIsChecked",
          "unitRotationIsRequired",
          "animationNameMustBeString",
          "missingMotion",
          "motionProfileIsRequired",
          "motionInterpretationIsRequired",
          "blankSourcePath",
          "sourcePathMismatch",
          "nonIntegerByteLength",
          "nonPositiveByteLength",
          "mismatchedByteLength",
          "digestMustBeSha256",
          "takeMustExist",
          "modeMustBeSupported",
          "sourceRigIdMustExist",
          "targetMustExist",
          "sourceRigNeedsBones",
          "sourceRigBonesMustBeUnique",
          "sourceRigNeedsHips",
          "sourceRigParentMustMatchInspectedHierarchy",
          "sourceRigRestMustMatchInspectedTrs",
          "sourceRigRotationMustMatchInspectedTrs",
          "sourceRigScaleMustMatchInspectedTrs",
          "mappingMustNotBeEmpty",
          "translationScaleMustBeFinite",
          "translationScaleMustBePositive",
          "mappingNodeMustExist",
          "mappingBoneMustExist",
          "mappingNodesMustBeUnique",
          "mappingBonesMustBeUnique",
          "everyTrackNeedsMapping",
          "translationMustMapToHips",
          "pointerTracksAreRefused",
          "scaleTracksAreRefused",
          "weightTracksAreRefused",
        ].map((name: string): [string, true] => [name, true]),
      ),
    ),
  );

  function rejectsAdoption(
    candidateSource: typeof source,
    decision: AutoMovieExternalMotionAdoptionDecision,
    message: string,
  ): boolean {
    return throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieExternalMotionAdoption").IAutoMovieExternalMotionAdoption =>
        adoptAutoMovieExternalMotion({
          inspection,
          source: candidateSource,
          decision,
        }),
      message,
    );
  }

  function rejectsRetarget(
    decision: IAutoMovieExternalMotionRetargetDecision,
    message: string,
  ): boolean {
    return rejectsAdoption(source, decision, message);
  }
}
