import type { IAutoMovieRecoveryCameraSceneInput } from "@automovie/interface/recovery";

import type { extractRecoveryImageFeatures } from "../../../../packages/recovery/src/internal/extractRecoveryImageFeatures";
import type { linkRecoveryCameraTracks } from "../../../../packages/recovery/src/internal/linkRecoveryCameraTracks";
import { matchRecoveryImageFeatures } from "../../../../packages/recovery/src/internal/matchRecoveryImageFeatures";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";
import { createRecoveryMapNumericalFixture } from "./createRecoveryMapNumericalFixture";

interface IRecoverySceneFixture {
  input: IAutoMovieRecoveryCameraSceneInput;
  points: [number, number, number][];
  poses: IAutoMovieRecoveryMapPose[];
  identities: number[][];
  features: ReturnType<typeof extractRecoveryImageFeatures>[];
  pairs: Parameters<typeof linkRecoveryCameraTracks>[1][number][];
  comparisons: number;
}

/** Prescribed five-camera nonplanar visibility chain and artificial separated identities; this numerical seam neither extracts RGB features nor models photographic appearance. */
export function createRecoverySceneNumericalFixture(): IRecoverySceneFixture {
  const base: ReturnType<typeof createRecoveryMapNumericalFixture> =
    createRecoveryMapNumericalFixture();
  const poses: IAutoMovieRecoveryMapPose[] = [
    ...base.poses,
    ...[-0.06, -0.02].map(
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
        translation: at === 0 ? [-2.5, 0.04, 0.1] : [-3.2, 0.1, 0.04],
      }),
    ),
  ];
  const views: IAutoMovieRecoveryCameraSceneInput["views"] = poses.map(
    (
      _: IAutoMovieRecoveryMapPose,
      at: number,
    ): IAutoMovieRecoveryCameraSceneInput["views"][number] => ({
      ...base.input.views[0]!,
      id: `scene-view-${at}`,
      sourceSha256: String(at).repeat(64),
      rgb8: new Uint8Array(640 * 480 * 3),
      camera: {
        ...base.input.views[0]!.camera,
        focalPx: [700 + 30 * at, 760 - 20 * at],
        skewPx: 7 - 9 * at,
        principalPointPx: [310 + 5 * at, 235 - 3 * at],
      },
    }),
  );
  const input: IAutoMovieRecoveryCameraSceneInput = {
    ...base.input,
    schema: "automovie-recovery-camera-scene-input-v1",
    objectId: "analytic-visibility-chain",
    views,
    seedBudget: {
      ...base.input.seedBudget,
      maxFeatures: 96,
      maxDescriptorPairs: 9216,
    },
    budget: {
      ...base.input.budget,
      maxPixels: 640 * 480 * 5,
      maxDescriptorPairs: 100000,
      maxTracks: 100,
      maxObservations: 300,
      maxLinearEntries: 25000,
      maxViews: 5,
      maxCameraAttempts: 20,
      maxTotalResectionTrials: 2048,
      maxTriangulations: 1024,
      maxJointFits: 32,
      maxLinearWork: 10000000000,
      maxResidentLinearEntries: 250000,
    },
  };
  const points: [number, number, number][] = Array.from(
    { length: 72 },
    (_: unknown, at: number): [number, number, number] => [
      Math.floor(at / 24) + (((at * 7) % 23) - 11) / 10,
      (((at * 11) % 29) - 14) / 13,
      9 + ((at * 13) % 31) / 9,
    ],
  );
  const identities: number[][] = views.map(
    (_: unknown, view: number): number[] =>
      points.flatMap((__: unknown, at: number): number[] =>
        view >= Math.floor(at / 24) && view <= Math.floor(at / 24) + 2
          ? [at]
          : [],
      ),
  );
  const features: ReturnType<typeof extractRecoveryImageFeatures>[] = views.map(
    (
      view: (typeof views)[number],
      at: number,
    ): ReturnType<typeof extractRecoveryImageFeatures> => ({
      rawCorners: identities[at]!.length,
      validCandidates: identities[at]!.length,
      selectedBeforeDescriptor: identities[at]!.length,
      zeroDescriptors: 0,
      invalidSupportDescriptors: 0,
      points: identities[at]!.map(
        (
          identity: number,
        ): ReturnType<
          typeof extractRecoveryImageFeatures
        >["points"][number] => {
          const point: [number, number, number] = points[identity]!,
            pose: IAutoMovieRecoveryMapPose = poses[at]!;
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
          const descriptor: Float64Array = new Float64Array(128);
          descriptor[identity] = 1;
          return {
            point: [
              (view.camera.focalPx[0] * x + view.camera.skewPx * y) / z +
                view.camera.principalPointPx[0],
              (view.camera.focalPx[1] * y) / z +
                view.camera.principalPointPx[1],
            ],
            descriptor,
            scale: 1,
            orientationRadians: 0,
            response: 1,
          };
        },
      ),
    }),
  );
  const pairs: Parameters<typeof linkRecoveryCameraTracks>[1][number][] = [];
  let comparisons: number = 0;
  for (let first: number = 0; first < views.length; first++)
    for (let second: number = first + 1; second < views.length; second++) {
      comparisons +=
        2 * features[first]!.points.length * features[second]!.points.length;
      pairs.push({
        first,
        second,
        forward: matchRecoveryImageFeatures(
          features[first]!.points,
          features[second]!.points,
          input.seedPolicy.descriptorDistanceRatio,
          input.seedBudget.maxDescriptorPairs,
        ),
        reverse: matchRecoveryImageFeatures(
          features[second]!.points,
          features[first]!.points,
          input.seedPolicy.descriptorDistanceRatio,
          input.seedBudget.maxDescriptorPairs,
        ),
      });
    }
  return { input, points, poses, identities, features, pairs, comparisons };
}
