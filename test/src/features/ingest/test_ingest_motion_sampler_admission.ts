import { AutoMovieIngestExternalModel } from "@automovie/ingest";
import { TestValidator } from "@nestia/e2e";

import type { ITest12MotionAdoptionContext } from "../internal/test12Motion/ITest12MotionAdoptionContext";
import { test12MotionAdoptionRefusalFacts1 } from "../internal/test12Motion/test12MotionAdoptionRefusalFacts1";
import { test12MotionAdoptionRefusalFacts2 } from "../internal/test12Motion/test12MotionAdoptionRefusalFacts2";
import { test12MotionAdoptionRefusalFacts3 } from "../internal/test12Motion/test12MotionAdoptionRefusalFacts3";
import { test12MotionFixture } from "../internal/test12Motion/test12MotionFixture";
import { test12MotionInspect } from "../internal/test12Motion/test12MotionInspect";
import { test12MotionSkeleton } from "../internal/test12Motion/test12MotionSkeleton";
import { throwsError } from "../internal/throwsError";

/**
 * Motion import admits an authored sampler layout and identifies each malformed byte or adoption field.
 *
 * Scenarios:
 * 1. Resident cubic, step and linear samplers decode to their authored times, interpolation and sample payloads.
 * 2. Independent one-field mutations of sampler, provenance and retarget mapping reach their own public refusals.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Inspects actual decoded channels and the diagnostics from direct ingestion calls.
 * @evidence contracts/development/testing.md#independent-expectations The fixture contains two identity rotations, a unit translation and authored cubic tangents.
 * @evidence contracts/development/common.md#meaningful-documentation States the supported interpolation and refusal families.
 */
export function test_ingest_motion_sampler_admission(): void {
  const fixture = test12MotionFixture(),
    inspection = test12MotionInspect(fixture),
    motion = inspection.motion!;
  const take = motion.takes[0]!;
  TestValidator.equals(
    "decoded take",
    [take.name, take.duration, take.loop],
    ["Walk", 1, false],
  );
  TestValidator.equals(
    "source clocks and coefficients",
    take.tracks.map((track) => [
      track.interpolation,
      track.channel,
      track.times,
      track.values,
    ]),
    [
      [
        "cubicspline",
        { kind: "node", node: "node_0", path: "rotation" },
        [0, 1],
        fixture.cubicRotation,
      ],
      [
        "step",
        { kind: "node", node: "node_0", path: "translation" },
        [0, 1],
        [0, 0, 0, 1, 0, 0],
      ],
      [
        "linear",
        { kind: "node", node: "node_2", path: "rotation" },
        [0, 1],
        [0, 0, 0, 1, 0, 0, 0, 1],
      ],
    ],
  );
  const sourceRig = test12MotionSkeleton();
  const source: ITest12MotionAdoptionContext["source"] = {
    path: "public/motion/walk.gltf",
    digest: `sha256:${"a".repeat(64)}`,
    byteLength: fixture.bytes.byteLength,
  };
  const nativeDecision: ITest12MotionAdoptionContext["nativeDecision"] = {
    mode: "native",
    take: take.id,
    sourceRig,
    mapping: [
      { node: "node_2", bone: "chest" },
      { node: "node_0", bone: "hips" },
    ],
  };
  const retargetDecision: ITest12MotionAdoptionContext["retargetDecision"] = {
    ...nativeDecision,
    mode: "retarget",
    target: "actor/main",
    translationScale: 1.25,
  };
  const rejectsAdoption: ITest12MotionAdoptionContext["rejectsAdoption"] = (
    candidate,
    decision,
    message,
  ) =>
    throwsError(
      () =>
        AutoMovieIngestExternalModel.adoptMotion({
          inspection,
          source: candidate,
          decision,
        }),
      message,
    );
  const fields: ITest12MotionAdoptionContext = {
    inspection,
    motion,
    source,
    sourceRig,
    nativeDecision,
    retargetDecision,
    rejectsAdoption,
    rejectsRetarget: (decision, message) =>
      rejectsAdoption(source, decision, message),
  };
  for (const [field, refuses] of [
    ...test12MotionAdoptionRefusalFacts1(),
    ...test12MotionAdoptionRefusalFacts2(fields),
    ...test12MotionAdoptionRefusalFacts3(fields),
  ])
    TestValidator.predicate(field, refuses());
}
