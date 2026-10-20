import { TestValidator } from "@nestia/e2e";

import { admitRecoveryCameraMap } from "../../../../packages/recovery/src/internal/admitRecoveryCameraMap";
import { createRecoveryCameraMap } from "../../../../packages/recovery/src/internal/createRecoveryCameraMap";
import { linkRecoveryCameraTracks } from "../../../../packages/recovery/src/internal/linkRecoveryCameraTracks";
import { matchRecoveryImageFeatures } from "../../../../packages/recovery/src/internal/matchRecoveryImageFeatures";
import { createRecoveryMapNumericalFixture } from "../internal/createRecoveryMapNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Shared automatic feature identities connect a seed to independent resection.
 *
 * Scenarios:
 * 1. Independently projected nonplanar coordinates and deliberately separated synthetic descriptors exercise the complete seed, triangulation, third-resection and joint loop at the numerical observation seam.
 * 2. A transitive cycle with different indices in the same view becomes an explicit conflict, never a silently split or usable track.
 * 3. Removing third-image observations retains a seed-only result with no third pose, rather than accepting a pairwise composition as a map.
 * 4. A refused seed with third-mediated tracks counts all nonconflicting components as untriangulated rather than losing them from the coverage ledger.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes actual bidirectional matching, track linkage, full seed qualification, point reconstruction, robust existing-map registration and joint fitting, asserting final sparse geometry, common gauge, coverage, conflict refusal and seed-only behavior.
 * @evidence contracts/testing.md#independent-expectations Prescribed trig rotations, nonunit third translation and scalar pinhole projections define geometry. Synthetic one-channel descriptors intentionally isolate numerical orchestration from feature detection and do not claim photographic or detector accuracy. A changed index cycle has two nodes in one view by construction.
 * @evidence contracts/testing.md#distinguishing-cases Covers a successful three-view loop, original world-point recovery, first/unit-seed gauge, real third translation scale, shared track identities, complete joint population, cyclic conflicts and absent third support. Public RGB extraction/admission and numerical degeneracies have separate tests.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_map_pipeline entry owns finite resident arrays and CPU assertions; it starts no filesystem host, process, compiler, installation, browser or GPU and replaces no foreign function.
 */
export function test_recovery_camera_map_pipeline(): void {
  const fixture: ReturnType<typeof createRecoveryMapNumericalFixture> =
    createRecoveryMapNumericalFixture();
  const charts: ReturnType<typeof admitRecoveryCameraMap> =
    admitRecoveryCameraMap(fixture.input);
  const pairs: Parameters<typeof linkRecoveryCameraTracks>[1][number][] = [
    [0, 1],
    [0, 2],
    [1, 2],
  ].map(
    ([first, second]: number[]): Parameters<
      typeof linkRecoveryCameraTracks
    >[1][number] => ({
      first: first!,
      second: second!,
      forward: matchRecoveryImageFeatures(
        fixture.features[first!]!.points,
        fixture.features[second!]!.points,
        0.7,
        4096,
      ),
      reverse: matchRecoveryImageFeatures(
        fixture.features[second!]!.points,
        fixture.features[first!]!.points,
        0.7,
        4096,
      ),
    }),
  );
  const result: ReturnType<typeof createRecoveryCameraMap> =
    createRecoveryCameraMap(
      fixture.input,
      fixture.features,
      charts,
      pairs,
      9600,
      (): void => {},
    );
  TestValidator.predicate(
    "complete independent three-camera geometry qualifies",
    result.status === "accepted-sparse-map" &&
      result.refusalReasons.length === 0 &&
      result.seed.status === "accepted-relative-pose" &&
      result.poses.every(
        (pose: (typeof result.poses)[number]): boolean => pose !== null,
      ) &&
      result.landmarks.length === 40 &&
      result.resection?.inliers === 40 &&
      result.joint?.converged === true &&
      result.joint.observationCount === 120 &&
      result.conflictingTracks === 0,
  );
  TestValidator.predicate(
    "shared gauge and independent points survive all phases",
    result.poses[2]?.translation.every((value: number, axis: number): boolean =>
      nclose(value, fixture.poses[2]!.translation[axis]!, 1e-4),
    ) === true &&
      result.landmarks.every(
        (landmark: (typeof result.landmarks)[number]): boolean =>
          landmark.point.every((value: number, axis: number): boolean =>
            nclose(
              value,
              fixture.points[
                landmark.observations.find(
                  (
                    observation: (typeof landmark.observations)[number],
                  ): boolean => observation.viewIndex === 0,
                )!.featureIndex
              ]![axis]!,
              1e-3,
            ),
          ),
      ) &&
      result.metricScale === "unknown" &&
      result.maximumReprojectionErrorPx !== null &&
      result.maximumReprojectionErrorPx < 1e-3,
  );
  const inconsistent: (typeof pairs)[number] = {
    first: 1,
    second: 2,
    forward: pairs[2]!.forward.map(
      (match: (typeof pairs)[number]["forward"][number]): typeof match => ({
        ...match,
        secondIndex: (match.secondIndex + 1) % 40,
      }),
    ),
    reverse: pairs[2]!.reverse.map(
      (match: (typeof pairs)[number]["reverse"][number]): typeof match => ({
        ...match,
        firstIndex: (match.firstIndex + 1) % 40,
      }),
    ),
  };
  const conflicted: ReturnType<typeof linkRecoveryCameraTracks> =
    linkRecoveryCameraTracks(
      fixture.features,
      [pairs[0]!, pairs[1]!, inconsistent],
      fixture.input.budget,
    );
  TestValidator.predicate(
    "inconsistent transitive index cycle is explicitly withheld",
    conflicted.conflictingComponents > 0 &&
      conflicted.tracks.length === 0 &&
      conflicted.linkedObservations === 120,
  );
  const seedOnly: ReturnType<typeof createRecoveryCameraMap> =
    createRecoveryCameraMap(
      fixture.input,
      fixture.features,
      charts,
      [
        pairs[0]!,
        { ...pairs[1]!, forward: [], reverse: [] },
        { ...pairs[2]!, forward: [], reverse: [] },
      ],
      9600,
      (): void => {},
    );
  TestValidator.predicate(
    "no third support preserves only independently accepted seed geometry",
    seedOnly.status === "seed-only" &&
      seedOnly.poses[0] !== null &&
      seedOnly.poses[1] !== null &&
      seedOnly.poses[2] === null &&
      seedOnly.resection === null &&
      seedOnly.landmarks.length === 40 &&
      seedOnly.landmarks.every(
        (landmark: (typeof seedOnly.landmarks)[number]): boolean =>
          landmark.observations.length === 2,
      ) &&
      seedOnly.refusalReasons.includes(
        "insufficient-existing-map-observations",
      ),
  );
  const seedRefused: ReturnType<typeof createRecoveryCameraMap> =
    createRecoveryCameraMap(
      fixture.input,
      fixture.features,
      charts,
      [{ ...pairs[0]!, forward: [], reverse: [] }, pairs[1]!, pairs[2]!],
      9600,
      (): void => {},
    );
  TestValidator.predicate(
    "refused seed preserves the third-mediated untriangulated population",
    seedRefused.status === "refused" &&
      seedRefused.linkedTracks === 40 &&
      seedRefused.conflictingTracks === 0 &&
      seedRefused.untriangulatedTracks === 40 &&
      seedRefused.landmarks.length === 0 &&
      seedRefused.poses.every(
        (pose: (typeof seedRefused.poses)[number]): boolean => pose === null,
      ),
  );
}
