import type { IAutoMovieRecoveryCameraMapInput } from "@automovie/interface/recovery";

import type { extractRecoveryImageFeatures } from "../../../../packages/recovery/src/internal/extractRecoveryImageFeatures";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";

/** Independently prescribed nonplanar coordinates, scalar pinhole projections and artificial uniquely separated feature identities for numerical seams, not detector or photographic truth. */
export function createRecoveryMapNumericalFixture(): {
  input: IAutoMovieRecoveryCameraMapInput;
  points: [number, number, number][];
  poses: IAutoMovieRecoveryMapPose[];
  pixels: [number, number][][];
  features: ReturnType<typeof extractRecoveryImageFeatures>[];
} {
  const poses: IAutoMovieRecoveryMapPose[] = [0, 0.04, -0.08].map(
    (angle: number, at: number): IAutoMovieRecoveryMapPose => ({
      rotation: [
        Math.cos(angle),
        0,
        Math.sin(angle),
        0,
        1,
        0,
        -Math.sin(angle),
        0,
        Math.cos(angle),
      ],
      translation:
        at === 0
          ? [0, 0, 0]
          : at === 1
            ? [
                -1 / Math.hypot(1, 0.1, 0.02),
                0.1 / Math.hypot(1, 0.1, 0.02),
                0.02 / Math.hypot(1, 0.1, 0.02),
              ]
            : [-1.7, -0.08, 0.06],
    }),
  );
  const input: IAutoMovieRecoveryCameraMapInput = {
    schema: "automovie-recovery-camera-map-input-v1",
    objectId: "independent-analytic-triad",
    rigidity: "asserted-fixed-scene",
    cohort: "analytic",
    views: [0, 1, 2].map(
      (at: number): IAutoMovieRecoveryCameraMapInput["views"][number] => ({
        id: `view-${at}`,
        sourceSha256: String(at).repeat(64),
        pixelProvenance:
          "Analytic integer-centre pinhole charts; zero RGB only for admission, artificial features only for numerical seam tests",
        width: 640,
        height: 480,
        rgb8: new Uint8Array(640 * 480 * 3),
        camera: {
          type: "pinhole",
          calibration: "supplied-intrinsics",
          distortion: "caller-corrected",
          focalPx: [700 + 30 * at, 760 - 20 * at],
          skewPx: 7 - 9 * at,
          principalPointPx: [310 + 5 * at, 235 - 3 * at],
          uncertaintyPx: null,
        },
      }),
    ),
    seedPolicy: {
      family: "harris-gradient-calibrated-eight-point",
      minimumCornerResponse: 10,
      suppressionRobustness: 0.9,
      descriptorDistanceRatio: 0.7,
      maximumSampsonErrorPx: 2,
      samplingConfidence: 0.999,
      samplingSeed: 17,
      minimumInliers: 16,
      minimumInlierFraction: 0.35,
      maximumMedianErrorPx: 1.5,
      maximumP90ErrorPx: 3,
      minimumPositiveDepthFraction: 0.9,
      minimumParallaxRadians: Math.PI / 180,
      maximumHomographyOverlapFraction: 0.9,
      maximumHomographyTransferPx: 2,
      minimumDesignSingularRatio: 1e-8,
      refinementLossScalePx: 1,
    },
    seedBudget: {
      maxPixels: 640 * 480 * 2,
      maxCandidates: 5000,
      maxFeatures: 64,
      maxPyramidLevels: 1,
      maxDescriptorPairs: 4096,
      maxRansacTrials: 256,
      minimumRansacTrials: 32,
      maxLocalRefinements: 4,
      maxRefinementIterations: 100,
      maxSingularSweeps: 64,
    },
    policy: {
      maximumReprojectionErrorPx: 2,
      minimumPointParallaxDegrees: 1,
      minimumResectionInliers: 16,
      minimumResectionInlierFraction: 0.35,
      samplingConfidence: 0.999,
      samplingSeed: 19,
      minimumDesignSingularRatio: 1e-8,
      maximumDltNullRatio: 0.5,
      maximumRotationProjectionError: 0.25,
      lossScalePx: 1,
    },
    budget: {
      maxPixels: 640 * 480 * 3,
      maxDescriptorPairs: 24576,
      maxTracks: 192,
      maxObservations: 192,
      maxResectionTrials: 512,
      minimumResectionTrials: 32,
      maxLocalRefinements: 8,
      maxRefinementIterations: 100,
      maxLinearEntries: 12000,
      maxSingularSweeps: 64,
    },
  };
  const points: [number, number, number][] = Array.from(
    { length: 40 },
    (_: unknown, at: number): [number, number, number] => [
      (((at * 7) % 23) - 11) / 10,
      (((at * 11) % 29) - 14) / 13,
      8.5 + ((at * 13) % 31) / 9,
    ],
  );
  const pixels: [number, number][][] = input.views.map(
    (view: (typeof input.views)[number], index: number): [number, number][] =>
      points.map((point: [number, number, number]): [number, number] => {
        const pose: IAutoMovieRecoveryMapPose = poses[index]!;
        const x: number =
          pose.rotation[0]! * point[0] +
          pose.rotation[1]! * point[1] +
          pose.rotation[2]! * point[2] +
          pose.translation[0];
        const y: number =
          pose.rotation[3]! * point[0] +
          pose.rotation[4]! * point[1] +
          pose.rotation[5]! * point[2] +
          pose.translation[1];
        const z: number =
          pose.rotation[6]! * point[0] +
          pose.rotation[7]! * point[1] +
          pose.rotation[8]! * point[2] +
          pose.translation[2];
        return [
          (view.camera.focalPx[0] * x + view.camera.skewPx * y) / z +
            view.camera.principalPointPx[0],
          (view.camera.focalPx[1] * y) / z + view.camera.principalPointPx[1],
        ];
      }),
  );
  const features: ReturnType<typeof extractRecoveryImageFeatures>[] =
    pixels.map(
      (
        image: [number, number][],
      ): ReturnType<typeof extractRecoveryImageFeatures> => ({
        rawCorners: 40,
        validCandidates: 40,
        selectedBeforeDescriptor: 40,
        zeroDescriptors: 0,
        invalidSupportDescriptors: 0,
        points: image.map(
          (
            point: [number, number],
            at: number,
          ): ReturnType<
            typeof extractRecoveryImageFeatures
          >["points"][number] => {
            const descriptor: Float64Array = new Float64Array(128);
            descriptor[at] = 1;
            return {
              point: [...point],
              descriptor,
              scale: 1,
              orientationRadians: 0,
              response: 1,
            };
          },
        ),
      }),
    );
  return { input, points, poses, pixels, features };
}
