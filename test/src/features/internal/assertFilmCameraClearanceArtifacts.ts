import {
  appendShotMetadataArtifact,
  validateShotArtifact,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import type { IFilmCameraClearanceArtifactInputs } from "./IFilmCameraClearanceArtifactInputs";

/** Run the original carried report identity, fixed clock and metadata refusal assertions. */
export function assertFilmCameraClearanceArtifacts(
  input: IFilmCameraClearanceArtifactInputs,
): void {
  const { performed, clearStage } = input;
  const acceptedReport = performed.shot.cameraClearance![0]!;
  const motionIds = new Set(
    Object.values(performed.motions).map((motion) => motion.id),
  );
  const missingAcceptedReport = validateShotArtifact(
    { ...performed.shot, cameraClearance: undefined },
    clearStage.scene,
    motionIds,
  );
  const emptyAcceptedReports = validateShotArtifact(
    { ...performed.shot, cameraClearance: [] },
    clearStage.scene,
    motionIds,
  );
  const plainResolvedCamera = {
    ...clearStage.scene.cameras[0]!,
    clearance: undefined,
  };
  const undeclaredReport = validateShotArtifact(
    performed.shot,
    { ...clearStage.scene, cameras: [plainResolvedCamera] },
    motionIds,
  );
  TestValidator.predicate(
    "artifact validation requires one report for exactly each declared delivery",
    [missingAcceptedReport, emptyAcceptedReports, undeclaredReport].every(
      (result) =>
        result.success === false &&
        result.violations.some(
          (item) => item.path === "$input.cameraClearance",
        ),
    ),
  );
  const wrongIntervalCount = validateShotArtifact(
    {
      ...performed.shot,
      cameraClearance: [
        {
          ...acceptedReport,
          intervals:
            Math.ceil(performed.shot.duration * acceptedReport.sampleRate) - 1,
        },
      ],
    },
    clearStage.scene,
    motionIds,
  );
  const unsafeIntervalClock = validateShotArtifact(
    {
      ...performed.shot,
      cameraClearance: [
        { ...acceptedReport, sampleRate: Number.MAX_VALUE, intervals: 0 },
      ],
    },
    clearStage.scene,
    motionIds,
  );
  const forgedHugeIntervals = validateShotArtifact(
    {
      ...performed.shot,
      cameraClearance: [
        { ...acceptedReport, intervals: Number.MAX_SAFE_INTEGER },
      ],
    },
    clearStage.scene,
    motionIds,
  );
  const additionalBoundaryReport = validateShotArtifact(
    {
      ...performed.shot,
      cameraClearance: [
        {
          ...acceptedReport,
          sampleTimes: [
            acceptedReport.sampleTimes[0]!,
            (acceptedReport.sampleTimes[0]! + acceptedReport.sampleTimes[1]!) /
              2,
            ...acceptedReport.sampleTimes.slice(1),
          ],
          intervals: acceptedReport.intervals + 1,
        },
      ],
    },
    clearStage.scene,
    motionIds,
  );
  TestValidator.predicate(
    "artifact intervals cover the safe base clock and may retain causal keys",
    wrongIntervalCount.success === false &&
      wrongIntervalCount.violations.some(
        (item) => item.path === "$input.cameraClearance[0].intervals",
      ) &&
      unsafeIntervalClock.success === false &&
      unsafeIntervalClock.violations.some(
        (item) => item.path === "$input.cameraClearance[0].sampleRate",
      ) &&
      forgedHugeIntervals.success === false &&
      forgedHugeIntervals.violations.some(
        (item) => item.path === "$input.cameraClearance[0].intervals",
      ) &&
      additionalBoundaryReport.success === true,
  );

  const metadataViolations: Parameters<typeof appendShotMetadataArtifact>[3] =
    [];
  appendShotMetadataArtifact(
    {
      duration: performed.shot.duration,
      camera: performed.shot.camera,
      cameraClearance: "not-an-array",
    },
    "$metadata",
    new Set([performed.shot.camera]),
    metadataViolations,
  );
  appendShotMetadataArtifact(
    {
      duration: performed.shot.duration,
      camera: performed.shot.camera,
      cameraClearance: [null],
    },
    "$metadata",
    new Set([performed.shot.camera]),
    metadataViolations,
  );
  appendShotMetadataArtifact(
    {
      duration: performed.shot.duration,
      camera: performed.shot.camera,
      cameraClearance: [
        {
          ...acceptedReport,
          camera: "",
          sampleRate: 0,
          intervals: 0.5,
          sampleTimes: [0, 0],
          status: "blocked",
          findings: "not-an-array",
        },
        {
          ...acceptedReport,
          camera: "ghost",
          sampleTimes: [-1, Number.NaN, performed.shot.duration + 1],
          findings: [{}],
        },
        { ...acceptedReport, camera: "ghost", sampleTimes: "not-an-array" },
      ],
    },
    "$metadata",
    new Set([performed.shot.camera]),
    metadataViolations,
  );
  TestValidator.predicate(
    "malformed stored clearance evidence is refused at every addressed member",
    [
      "$metadata.cameraClearance",
      "$metadata.cameraClearance[0]",
      "$metadata.cameraClearance[0].camera",
      "$metadata.cameraClearance[0].sampleRate",
      "$metadata.cameraClearance[0].intervals",
      "$metadata.cameraClearance[0].sampleTimes[1]",
      "$metadata.cameraClearance[0].status",
      "$metadata.cameraClearance[0].findings",
      "$metadata.cameraClearance[1].camera",
      "$metadata.cameraClearance[1].sampleTimes[0]",
      "$metadata.cameraClearance[1].sampleTimes[1]",
      "$metadata.cameraClearance[1].sampleTimes[2]",
      "$metadata.cameraClearance[1].findings",
      "$metadata.cameraClearance[2].camera",
      "$metadata.cameraClearance[2].sampleTimes",
    ].every((path) => metadataViolations.some((item) => item.path === path)),
  );
}
