import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import type {
  IAutoMovieRecoveryCameraMapInput,
  IAutoMovieRecoveryCameraPairInput,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryCameraMapEstimate } from "../structures/image/IAutoMovieRecoveryCameraMapEstimate";
import type { IAutoMovieRecoveryMapLandmark } from "../structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";
import { createRecoveryCameraEstimate } from "./createRecoveryCameraEstimate";
import type { extractRecoveryImageFeatures } from "./extractRecoveryImageFeatures";
import { fitRecoveryResectionConsensus } from "./fitRecoveryResectionConsensus";
import { linkRecoveryCameraTracks } from "./linkRecoveryCameraTracks";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";
import { refineRecoveryCameraMap } from "./refineRecoveryCameraMap";
import { triangulateRecoveryCameraPoint } from "./triangulateRecoveryCameraPoint";

/**
 * Build one conditional three-camera map from automatic shared observations.
 * Only qualified seed pairs create 3D points. Third-image observations cannot
 * influence those points before resection, preventing circular registration.
 * Joint fitting subsequently uses only seed observations and resection inliers.
 *
 * @evidence contracts/common.md#principled-implementation Existing complete seed qualification precedes independent point DLT/depth/acute-angle/pixel gates. Bidirectionally linked nonconflicting tracks bind existing seed landmarks to distinct third-image points for robust resection; a fixed-population gauge-correct joint fit must converge and pass every retained observation before exposing a triad.
 * @evidence contracts/common.md#clear-and-simple-design This recovery coordinator owns stage transitions and accepted versus seed-only publication; shared appearance, resection, projection and joint numerical work have independent owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No third-view measurement creates its own PnP landmark, no duplicate-view component is silently split, no refused candidate pose becomes output, and no point mesh or metric scale is presented as an editable recovered asset.
 * @evidence contracts/common.md#meaningful-documentation States seed-only supported landmarks, stronger bidirectional linking, distinct support, fixed-population qualification and explicit untriangulated/conflicting populations.
 * @evidence contracts/performance.md#efficient-algorithms For F features and M matches, linking is near-linear plus deterministic ordering; N seed-supported tracks need one bounded four-column DLT each, delegated bounded resection and O(I*S*N*11^2) joint fitting. All retained populations have admitted limits.
 * @evidence contracts/performance.md#reuse-equivalent-work One seed result supplies accepted pose and final inlier identities. Existing feature coordinates/matches serve track linkage and seed triangulation without new extraction; original seed geometry remains available if later registration refuses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only bounded owned JSON evidence returns. Feature descriptors, transient candidate poses, numerical factors and callbacks expire without image retention, global cache or external resource.
 */
export function createRecoveryCameraMap(
  input: IAutoMovieRecoveryCameraMapInput,
  features: readonly ReturnType<typeof extractRecoveryImageFeatures>[],
  charts: readonly ReturnType<typeof createRecoveryCameraChart>[],
  pairs: Parameters<typeof linkRecoveryCameraTracks>[1],
  descriptorComparisons: number,
  checkpoint: (phase: string, completed: number, total: number) => void,
): IAutoMovieRecoveryCameraMapEstimate {
  const seedInput: IAutoMovieRecoveryCameraPairInput = {
    schema: "automovie-recovery-camera-pair-v1",
    objectId: input.objectId,
    rigidity: input.rigidity,
    cohort: input.cohort,
    views: input.views.slice(0, 2),
    policy: input.seedPolicy,
    budget: input.seedBudget,
  };
  const seed: ReturnType<typeof createRecoveryCameraEstimate> =
    createRecoveryCameraEstimate(
      seedInput,
      features.slice(0, 2),
      pairs[0]!.forward,
      [charts[0]!, charts[1]!],
      checkpoint,
    );
  const linked: ReturnType<typeof linkRecoveryCameraTracks> =
    linkRecoveryCameraTracks(features, pairs, input.budget);
  const third: (typeof input.views)[number] = input.views[2]!;
  const result: IAutoMovieRecoveryCameraMapEstimate = {
    schema: "automovie-recovery-camera-map-estimate-v1",
    objectId: input.objectId,
    cohort: input.cohort,
    status: "refused",
    refusalReasons: [],
    sources: [
      ...seed.sources,
      {
        id: third.id,
        sourceSha256: third.sourceSha256,
        pixelProvenance: third.pixelProvenance,
        width: third.width,
        height: third.height,
        camera: {
          ...third.camera,
          focalPx: [...third.camera.focalPx],
          principalPointPx: [...third.camera.principalPointPx],
        },
      },
    ],
    seed,
    policy: { ...input.policy },
    budget: { ...input.budget },
    gauge: "first-camera-unit-seed-baseline",
    metricScale: "unknown",
    poses: [null, null, null],
    landmarks: [],
    featureCounts: features.map(
      (feature: (typeof features)[number]): number => feature.points.length,
    ),
    descriptorComparisons,
    intersectionMatches: linked.intersectionMatches,
    linkedObservations: linked.linkedObservations,
    linkedTracks: linked.components,
    conflictingTracks: linked.conflictingComponents,
    untriangulatedTracks: 0,
    refusedSeedPoints: 0,
    unresolvedSeedPoints: 0,
    nonpositiveSeedPoints: 0,
    lowParallaxSeedPoints: 0,
    reprojectionRefusedSeedPoints: 0,
    resection: null,
    joint: null,
    maximumReprojectionErrorPx: null,
    minimumPointParallaxDegrees: null,
  };
  if (seed.pose === null) {
    result.untriangulatedTracks = linked.tracks.length;
    result.refusalReasons.push("seed-refused");
    return result;
  }
  result.status = "seed-only";
  const firstPose: IAutoMovieRecoveryMapPose = {
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    translation: [0, 0, 0],
  };
  const seedPose: IAutoMovieRecoveryMapPose = {
    rotation: seed.pose.rotation.slice(),
    translation: [...seed.pose.translation],
  };
  result.poses = [firstPose, seedPose, null];
  const support: Set<string> = new Set(
    seed.matches
      .filter(
        (match: (typeof seed.matches)[number]): boolean => match.epipolarInlier,
      )
      .map(
        (match: (typeof seed.matches)[number]): string =>
          `${match.firstFeatureIndex}:${match.secondFeatureIndex}`,
      ),
  );
  const candidates: {
    landmark: number;
    pixel: [number, number];
    featureIndex: number;
  }[] = [];
  for (let at: number = 0; at < linked.tracks.length; at++) {
    checkpoint("seed-landmarks", at, linked.tracks.length);
    const track: (typeof linked.tracks)[number] = linked.tracks[at]!;
    const first: (typeof track.observations)[number] | undefined =
      track.observations.find(
        (observation: (typeof track.observations)[number]): boolean =>
          observation.viewIndex === 0,
      );
    const second: typeof first = track.observations.find(
      (observation: (typeof track.observations)[number]): boolean =>
        observation.viewIndex === 1,
    );
    if (
      !first ||
      !second ||
      !support.has(`${first.featureIndex}:${second.featureIndex}`)
    ) {
      result.untriangulatedTracks++;
      continue;
    }
    const triangulated: ReturnType<typeof triangulateRecoveryCameraPoint> =
      triangulateRecoveryCameraPoint(
        first.pixel,
        second.pixel,
        charts[0]!,
        charts[1]!,
        seedPose,
        input.policy.minimumDesignSingularRatio,
        input.budget.maxSingularSweeps,
      );
    if (triangulated === null) {
      result.refusedSeedPoints++;
      result.unresolvedSeedPoints++;
      continue;
    }
    const nonpositive: boolean = !triangulated.positiveDepth;
    const lowParallax: boolean =
      (Math.min(
        triangulated.parallaxRadians,
        Math.PI - triangulated.parallaxRadians,
      ) *
        180) /
        Math.PI <
      input.policy.minimumPointParallaxDegrees;
    const pixelRefusal: boolean =
      Math.max(
        triangulated.firstReprojectionPx,
        triangulated.secondReprojectionPx,
      ) > input.policy.maximumReprojectionErrorPx;
    if (nonpositive) result.nonpositiveSeedPoints++;
    if (lowParallax) result.lowParallaxSeedPoints++;
    if (pixelRefusal) result.reprojectionRefusedSeedPoints++;
    if (nonpositive || lowParallax || pixelRefusal) {
      result.refusedSeedPoints++;
      continue;
    }
    const landmark: number = result.landmarks.length;
    result.landmarks.push({
      id: track.id,
      point: [...triangulated.point],
      observations: [first, second].map(
        (observation: typeof first): NonNullable<typeof first> => ({
          ...observation!,
          pixel: [...observation!.pixel],
        }),
      ),
    });
    const target: (typeof track.observations)[number] | undefined =
      track.observations.find(
        (observation: (typeof track.observations)[number]): boolean =>
          observation.viewIndex === 2,
      );
    if (target)
      candidates.push({
        landmark,
        pixel: [...target.pixel],
        featureIndex: target.featureIndex,
      });
  }
  if (candidates.length < input.policy.minimumResectionInliers) {
    result.refusalReasons.push("insufficient-existing-map-observations");
    return result;
  }
  const resection: ReturnType<typeof fitRecoveryResectionConsensus> =
    fitRecoveryResectionConsensus(
      candidates.map(
        (candidate: (typeof candidates)[number]): [number, number, number] =>
          result.landmarks[candidate.landmark]!.point,
      ),
      candidates.map(
        (candidate: (typeof candidates)[number]): [number, number] =>
          candidate.pixel,
      ),
      charts[2]!.matrix,
      charts[2]!.inverse,
      input.policy,
      input.budget,
      (): void => checkpoint("camera-resection", 0, 1),
    );
  result.resection = {
    candidates: candidates.length,
    inliers: resection.indices.length,
    trials: resection.trials,
    requiredTrials: resection.requiredTrials,
    localRefinements: resection.localRefinements,
    numericalRefusals: resection.numericalRefusals,
    finalRefits: resection.finalRefits,
    stable: resection.stable,
    converged: resection.refinement?.converged ?? null,
    refusalReasons: resection.refusalReasons.slice(),
  };
  if (resection.pose === null) {
    result.refusalReasons.push(...resection.refusalReasons);
    return result;
  }
  const joined: IAutoMovieRecoveryMapLandmark[] = result.landmarks.map(
    (
      landmark: IAutoMovieRecoveryMapLandmark,
    ): IAutoMovieRecoveryMapLandmark => ({
      id: landmark.id,
      point: [...landmark.point],
      observations: landmark.observations.map(
        (
          observation: (typeof landmark.observations)[number],
        ): typeof observation => ({
          ...observation,
          pixel: [...observation.pixel],
        }),
      ),
    }),
  );
  for (const index of resection.indices) {
    const candidate: (typeof candidates)[number] = candidates[index]!;
    joined[candidate.landmark]!.observations.push({
      viewIndex: 2,
      featureIndex: candidate.featureIndex,
      pixel: [...candidate.pixel],
    });
  }
  let joint: ReturnType<typeof refineRecoveryCameraMap>;
  try {
    joint = refineRecoveryCameraMap(
      [firstPose, seedPose, resection.pose],
      joined,
      charts.map((chart: (typeof charts)[number]): number[] => chart.matrix),
      input.policy,
      input.budget,
      (): void => {},
    );
  } catch (error: unknown) {
    if (
      !(error instanceof Error) ||
      error.name !== "Error" ||
      !/^(camera-map:|singular-matrix:|matrix3:)/.test(error.message)
    )
      throw error;
    result.refusalReasons.push(`joint-numerical-refusal: ${error.message}`);
    return result;
  }
  checkpoint("joint-refinement", 1, 1);
  result.joint = joint.report;
  if (!joint.report.converged)
    result.refusalReasons.push("joint-not-converged");
  const back: number[] = AutoMovieMatrix3.transpose(joint.poses[1]!.rotation);
  const cameraCentre: [number, number, number] = AutoMovieMatrix3.apply(
    back,
    joint.poses[1]!.translation.map((value: number): number => -value),
  );
  let maximumError: number = 0,
    minimumAngle: number = Infinity;
  for (const landmark of joint.landmarks) {
    for (const observation of landmark.observations) {
      const projected: ReturnType<typeof projectRecoveryMapPoint> =
        projectRecoveryMapPoint(
          joint.poses[observation.viewIndex]!,
          landmark.point,
          charts[observation.viewIndex]!.matrix,
        );
      if (projected === null) {
        if (!result.refusalReasons.includes("nonpositive-final-depth"))
          result.refusalReasons.push("nonpositive-final-depth");
        continue;
      }
      maximumError = Math.max(
        maximumError,
        Math.hypot(
          projected.pixel[0] - observation.pixel[0],
          projected.pixel[1] - observation.pixel[1],
        ),
      );
    }
    const a: number[] = landmark.point.slice(),
      b: number[] = landmark.point.map(
        (value: number, at: number): number => value - cameraCentre[at]!,
      );
    const normA: number = Math.hypot(...a),
      normB: number = Math.hypot(...b);
    for (let axis: number = 0; axis < 3; axis++) {
      a[axis] = a[axis]! / normA;
      b[axis] = b[axis]! / normB;
    }
    const cross: number = Math.hypot(
      a[1]! * b[2]! - a[2]! * b[1]!,
      a[2]! * b[0]! - a[0]! * b[2]!,
      a[0]! * b[1]! - a[1]! * b[0]!,
    );
    minimumAngle = Math.min(
      minimumAngle,
      (Math.atan2(
        cross,
        Math.abs(
          a.reduce(
            (sum: number, value: number, at: number): number =>
              sum + value * b[at]!,
            0,
          ),
        ),
      ) *
        180) /
        Math.PI,
    );
  }
  result.maximumReprojectionErrorPx =
    Number.isFinite(maximumError) &&
    !result.refusalReasons.includes("nonpositive-final-depth")
      ? maximumError
      : null;
  result.minimumPointParallaxDegrees = Number.isFinite(minimumAngle)
    ? minimumAngle
    : null;
  if (!(maximumError <= input.policy.maximumReprojectionErrorPx))
    result.refusalReasons.push("final-reprojection-error");
  if (!(minimumAngle >= input.policy.minimumPointParallaxDegrees))
    result.refusalReasons.push("final-point-parallax");
  if (Math.abs(Math.hypot(...joint.poses[1]!.translation) - 1) > 1e-10)
    result.refusalReasons.push("seed-gauge-drift");
  if (result.refusalReasons.length === 0) {
    result.status = "accepted-sparse-map";
    result.poses = joint.poses;
    result.landmarks = joint.landmarks;
  }
  return result;
}
