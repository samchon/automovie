import {
  evaluateAutoMovieCameraDepthPrecision,
  realizeShotContract,
} from "@automovie/engine";
import type {
  IAutoMovieCamera,
  IAutoMovieCompiledContractRealization,
  IAutoMovieFormationDesign,
  IAutoMovieModel,
  IAutoMovieShotContract,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const transform: (z?: number) => IAutoMovieTransform = (
  z: number = 0,
): IAutoMovieTransform => ({
  translation: { x: 0, y: 0, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const model: IAutoMovieModel = {
  id: "required-box-model",
  name: null,
  origin: "generated",
  parts: [
    {
      id: "box",
      name: null,
      geometry: {
        type: "primitive",
        shape: { type: "box", width: 2, height: 2, depth: 4 },
      },
      material: null,
      attachedBone: null,
      transform: transform(),
    },
  ],
  skeleton: null,
  body: null,
  materials: [],
  asset: null,
};

const contract: IAutoMovieShotContract = {
  id: "shot-depth",
  beat: "beat",
  source: { module: "src/shots/depth.ts", export: "shot" },
  durationSeconds: 2,
  participants: [],
  opening: [],
  closing: [],
  camera: {
    intent: "hold the required environment box",
    requiredSubjects: ["required-box"],
    maxOcclusionRatio: 1,
  },
  events: [],
  reviewFrames: [{ id: "middle", time: 1, passes: ["beauty"] }],
};

const camera: (overrides?: Partial<IAutoMovieCamera>) => IAutoMovieCamera = (
  overrides: Partial<IAutoMovieCamera> = {},
): IAutoMovieCamera => {
  const value: IAutoMovieCamera = {
    id: "camera-main",
    transform: transform(10),
    fovY: 90,
    near: 1,
    far: 100,
    depthPrecision: { minimumDepthBits: 8, maximumStepMeters: 1 },
    ...overrides,
  };
  value.depthPrecision = overrides.depthPrecision ?? value.depthPrecision;
  return value;
};

function realize(
  resolvedCamera: IAutoMovieCamera,
  options: {
    camera?: boolean;
    frameFormat?: boolean;
    requiredSubjects?: string[];
    reviewTimes?: number[];
  } = {},
): ReturnType<typeof realizeShotContract> {
  return realizeShotContract({
    contract: {
      ...contract,
      camera: {
        ...contract.camera,
        requiredSubjects:
          options.requiredSubjects ?? contract.camera.requiredSubjects,
      },
      reviewFrames:
        options.reviewTimes === undefined
          ? contract.reviewFrames
          : options.reviewTimes.map(
              (
                time: number,
                index: number,
              ): IAutoMovieShotContract["reviewFrames"][number] => ({
                id: `frame-${index}`,
                time,
                passes: ["beauty" as const],
              }),
            ),
    },
    production: null,
    ...(options.frameFormat === false
      ? {}
      : { frameFormat: { width: 100, height: 100 } }),
    world: null,
    formations: new Map<string, IAutoMovieFormationDesign>(),
    compiled: {
      eventSamples: [],
      scene: {
        id: "scene-depth",
        name: null,
        nodes: [
          {
            id: "required-box",
            model: model.id,
            transform: transform(),
            pose: null,
            motion: null,
          },
        ],
        cameras: options.camera === false ? [] : [resolvedCamera],
        lights: [],
      },
      motions: [],
      shot: {
        id: contract.id,
        name: null,
        scene: "scene-depth",
        camera: resolvedCamera.id,
        duration: contract.durationSeconds,
        performances: [],
        objectMotions: [],
        cameraMotion: null,
      },
      models: [model],
    },
    collisions: [],
  });
}

/**
 * Realization derives precision from current required geometry bounds.
 *
 * Scenarios:
 *
 * 1. A depth-four box centred at zero under a camera at z=10 reports the
 *    independently known 8..12 range at times 0, 1, and 2 without diagnostics.
 * 2. Far clip 10 still intersects the box but refuses its full depth range.
 * 3. Halving the admitted maximum step fails each sample on precision alone.
 * 4. Repeated realization preserves all sampled camera report components.
 * 5. Missing camera, raster, or required subject produce addressed invalid
 *    reports and three diagnostics rather than fabricated readable geometry.
 * 6. A NaN review time remains a failing sample rather than being skipped.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls realizeShotContract with a compiled box scene and static camera to check sampled depth ranges, precision measurements, clipping/precision failures, addressing, diagnostics, missing inputs, and a nonfinite review sample.
 * @evidence contracts/testing.md#independent-expectations Authored box depth four centred at zero and camera z=10 fix the 8..12 interval; the contract independently fixes opening/review/closing times 0/1/2. The precision scalar comparison to evaluateAutoMovieCameraDepthPrecision proves delegation only, while its mathematics is independently anchored by test_film_camera_depth_precision.
 * @evidence contracts/testing.md#distinguishing-cases A partly visible box outside far clipping differs from unreadable geometry, the precision-only negative twin retains the same scene, and separately missing camera/raster/subject inputs must fail rather than disappear. NaN time must remain observable as one failing review sample.
 * @evidence contracts/testing.md#execution-ownership Uses local model/scene/contract records and synchronous engine grading without a renderer, real depth buffer, filesystem, clock, or dependency replacement. Exact-copy replay uses existing test12ValuesClose; the NaN review-time observation belongs to the static-camera path and does not claim a moving clip accepts NaN sampling.
 */
export function test_film_camera_depth_precision_realization(): void {
  const expected: ReturnType<typeof evaluateAutoMovieCameraDepthPrecision> =
    evaluateAutoMovieCameraDepthPrecision({
      camera: "camera-main",
      time: 0,
      near: 1,
      far: 100,
      requiredNear: 8,
      requiredFar: 12,
      constraint: { minimumDepthBits: 8, maximumStepMeters: 1 },
    });
  const accepted: ReturnType<typeof realize> = realize(camera());
  TestValidator.equals(
    "every addressed sample reports the exact current box depth range",
    namedFacts([
      ["diagnostics", (): boolean => accepted.diagnostics.length === 0],
      ["samples", (): boolean => accepted.realization.camera.length === 3],
      [
        "range",
        (): boolean =>
          accepted.realization.camera.every(
            (
              sample: IAutoMovieCompiledContractRealization["camera"][number],
            ): boolean =>
              nclose(sample.depthPrecision.requiredNear ?? Number.NaN, 8) &&
              nclose(sample.depthPrecision.requiredFar ?? Number.NaN, 12),
          ),
      ],
      [
        "measurement",
        (): boolean =>
          accepted.realization.camera.every(
            (
              sample: IAutoMovieCompiledContractRealization["camera"][number],
            ): boolean =>
              sample.depthPrecision.measuredStepMeters !== null &&
              expected.measuredStepMeters !== null &&
              nclose(
                sample.depthPrecision.measuredStepMeters,
                expected.measuredStepMeters,
                0,
              ) &&
              sample.depthPrecision.passed,
          ),
      ],
      [
        "identity",
        (): boolean =>
          [0, 1, 2].every((time: number, index: number): boolean =>
            nclose(
              accepted.realization.camera[index]!.depthPrecision.time ??
                Number.NaN,
              time,
            ),
          ),
      ],
    ]),
    {
      diagnostics: true,
      samples: true,
      range: true,
      measurement: true,
      identity: true,
    },
  );

  const outside: ReturnType<typeof realize> = realize(camera({ far: 10 }));
  TestValidator.predicate(
    "a partly visible box outside the full required clip interval is refused",
    outside.realization.camera.every(
      (
        sample: IAutoMovieCompiledContractRealization["camera"][number],
      ): boolean =>
        sample.readableSubjects === 1 &&
        sample.depthPrecision.status === "outside-clipping-range" &&
        sample.passed === false,
    ) && outside.diagnostics.length === 3,
  );

  const insufficient: ReturnType<typeof realize> = realize(
    camera({
      depthPrecision: {
        minimumDepthBits: 8,
        maximumStepMeters: expected.measuredStepMeters! / 2,
      },
    }),
  );
  TestValidator.predicate(
    "a precision-only negative twin fails every addressed realization sample",
    insufficient.realization.camera.every(
      (
        sample: IAutoMovieCompiledContractRealization["camera"][number],
      ): boolean =>
        sample.depthPrecision.status === "insufficient-precision" &&
        sample.passed === false,
    ) && insufficient.diagnostics.length === 3,
  );

  TestValidator.predicate(
    "repeat realization preserves report structure and numeric components",
    test12ValuesClose(
      realize(camera()).realization.camera,
      accepted.realization.camera,
    ),
  );

  const absentCamera: ReturnType<typeof realize> = realize(camera(), {
    camera: false,
  });
  const absentRaster: ReturnType<typeof realize> = realize(camera(), {
    frameFormat: false,
  });
  const absentSubject: ReturnType<typeof realize> = realize(camera(), {
    requiredSubjects: ["absent-required-box"],
  });
  TestValidator.equals(
    "unresolved camera inputs and required geometry produce addressed invalid reports",
    namedFacts([
      [
        "camera",
        (): boolean =>
          absentCamera.realization.camera.every(
            (
              sample: IAutoMovieCompiledContractRealization["camera"][number],
            ): boolean =>
              sample.depthPrecision.camera === "camera-main" &&
              sample.depthPrecision.status === "invalid" &&
              sample.resolvedSubjects === 0 &&
              sample.passed === false,
          ) && absentCamera.diagnostics.length === 3,
      ],
      [
        "raster",
        (): boolean =>
          absentRaster.realization.camera.every(
            (
              sample: IAutoMovieCompiledContractRealization["camera"][number],
            ): boolean =>
              sample.depthPrecision.status === "invalid" &&
              sample.resolvedSubjects === 0 &&
              sample.passed === false,
          ) && absentRaster.diagnostics.length === 3,
      ],
      [
        "subject",
        (): boolean =>
          absentSubject.realization.camera.every(
            (
              sample: IAutoMovieCompiledContractRealization["camera"][number],
            ): boolean =>
              sample.depthPrecision.status === "invalid" &&
              sample.requiredSubjects === 1 &&
              sample.resolvedSubjects === 0 &&
              sample.readableSubjects === 0 &&
              sample.passed === false,
          ) && absentSubject.diagnostics.length === 3,
      ],
    ]),
    { camera: true, raster: true, subject: true },
  );

  // A review frame at a time no clock can reach is graded and fails, rather
  // than being dropped from the camera samples while the shot passes.
  const unreachable: ReturnType<typeof realize> = realize(camera(), {
    reviewTimes: [Number.NaN],
  });
  TestValidator.predicate(
    "a non-finite review frame is a failing camera sample, not a skipped one",
    unreachable.realization.camera.length === 3 &&
      unreachable.realization.camera.some(
        (
          sample: IAutoMovieCompiledContractRealization["camera"][number],
        ): boolean => Number.isNaN(sample.time) && sample.passed === false,
      ) &&
      unreachable.diagnostics.length === 1,
  );
}
