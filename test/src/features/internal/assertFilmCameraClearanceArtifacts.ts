import {
  appendShotMetadataArtifact,
  validateShotArtifact,
} from "@automovie/engine";
import type {
  IAutoMovieCamera,
  IAutoMovieCameraClearanceReport,
  IAutoMovieConstraintViolation,
  IAutoMovieMotion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmCameraClearanceArtifactInputs } from "./IFilmCameraClearanceArtifactInputs";

/** Run the original carried report identity, fixed clock and metadata refusal assertions. */
export function assertFilmCameraClearanceArtifacts(
  input: IFilmCameraClearanceArtifactInputs,
): void {
  const { performed, clearStage }: IFilmCameraClearanceArtifactInputs = input;
  const acceptedReport: IAutoMovieCameraClearanceReport =
    performed.shot.cameraClearance![0]!;
  const motionIds: Set<string> = new Set(
    Object.values(performed.motions).map(
      (motion: IAutoMovieMotion): string => motion.id,
    ),
  );
  const missingAcceptedReport: ReturnType<typeof validateShotArtifact> =
    validateShotArtifact(
      { ...performed.shot, cameraClearance: undefined },
      clearStage.scene,
      motionIds,
    );
  const emptyAcceptedReports: ReturnType<typeof validateShotArtifact> =
    validateShotArtifact(
      { ...performed.shot, cameraClearance: [] },
      clearStage.scene,
      motionIds,
    );
  const plainResolvedCamera: IAutoMovieCamera = {
    ...clearStage.scene.cameras[0]!,
    clearance: undefined,
  };
  const undeclaredReport: ReturnType<typeof validateShotArtifact> =
    validateShotArtifact(
      performed.shot,
      { ...clearStage.scene, cameras: [plainResolvedCamera] },
      motionIds,
    );
  TestValidator.predicate(
    "artifact validation requires one report for exactly each declared delivery",
    [missingAcceptedReport, emptyAcceptedReports, undeclaredReport].every(
      (result: ReturnType<typeof validateShotArtifact>): boolean =>
        result.success === false &&
        result.violations.some(
          (item: IAutoMovieConstraintViolation): boolean =>
            item.path === "$input.cameraClearance",
        ),
    ),
  );
  const wrongIntervalCount: ReturnType<typeof validateShotArtifact> =
    validateShotArtifact(
      {
        ...performed.shot,
        cameraClearance: [
          {
            ...acceptedReport,
            intervals:
              Math.ceil(performed.shot.duration * acceptedReport.sampleRate) -
              1,
          },
        ],
      },
      clearStage.scene,
      motionIds,
    );
  const unsafeIntervalClock: ReturnType<typeof validateShotArtifact> =
    validateShotArtifact(
      {
        ...performed.shot,
        cameraClearance: [
          { ...acceptedReport, sampleRate: Number.MAX_VALUE, intervals: 0 },
        ],
      },
      clearStage.scene,
      motionIds,
    );
  const forgedHugeIntervals: ReturnType<typeof validateShotArtifact> =
    validateShotArtifact(
      {
        ...performed.shot,
        cameraClearance: [
          { ...acceptedReport, intervals: Number.MAX_SAFE_INTEGER },
        ],
      },
      clearStage.scene,
      motionIds,
    );
  const additionalBoundaryReport: ReturnType<typeof validateShotArtifact> =
    validateShotArtifact(
      {
        ...performed.shot,
        cameraClearance: [
          {
            ...acceptedReport,
            sampleTimes: [
              acceptedReport.sampleTimes[0]!,
              (acceptedReport.sampleTimes[0]! +
                acceptedReport.sampleTimes[1]!) /
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
  const missingBaseInstant: ReturnType<typeof validateShotArtifact> =
    validateShotArtifact(
      {
        ...performed.shot,
        cameraClearance: [
          {
            ...acceptedReport,
            sampleTimes: acceptedReport.sampleTimes.map(
              (time: number, index: number): number =>
                time === 1 / acceptedReport.sampleRate
                  ? (acceptedReport.sampleTimes[index - 1]! + time) / 2
                  : time,
            ),
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
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$input.cameraClearance[0].intervals",
      ) &&
      unsafeIntervalClock.success === false &&
      unsafeIntervalClock.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$input.cameraClearance[0].sampleRate",
      ) &&
      forgedHugeIntervals.success === false &&
      forgedHugeIntervals.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$input.cameraClearance[0].intervals",
      ) &&
      additionalBoundaryReport.success === true &&
      missingBaseInstant.success === false &&
      missingBaseInstant.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$input.cameraClearance[0].sampleTimes",
      ),
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
    ].every((path: string): boolean =>
      metadataViolations.some(
        (
          item: Parameters<typeof appendShotMetadataArtifact>[3][number],
        ): boolean => item.path === path,
      ),
    ),
  );
}
