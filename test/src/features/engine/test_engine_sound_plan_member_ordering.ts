import {
  deriveProductionSoundPlan,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledShotSource,
} from "@automovie/interface";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 *
 * Event planning retains equal sort keys and resolves a static formation aggregate without inventing a motion list.
 *
 * Scenarios:
 * 1. Two event samples with identical sort keys remain present.
 * 2. A static two-member formation remains a resolved aggregate when no formation-motion list exists.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `deriveProductionSoundPlan` on a compiled shot whose two event samples share every sort key, then on one whose contact subject is a static formation with no `formationMotions` list, asserting the planned event count and the formation event's `memberCount`; it catches a sort or dedupe that collapses equal-keyed samples into one event, and a formation lookup that fails or reports one member when the optional motion list is absent.
 * @evidence contracts/testing.md#independent-expectations Two events follow from two authored samples, and a member count of 2 is the formation's declared `count`; only counts are asserted, so the order of the equal-keyed events and the aggregate's position are not pinned here.
 * @evidence contracts/testing.md#distinguishing-cases Boundary of equal sort keys and boundary of a formation with no motion list; moving emitters and listeners and profile snapshots belong to `test_engine_sound_plan_motion_and_profiles`, and profile variants to `test_engine_sound_plan_acoustic_profile_variants`.
 */
export const test_engine_sound_plan_member_ordering = (): void => {
  const { minimalTimeline, minimalContract, minimalCompiled } = createSoundPropagationTestInputs();

  const duplicatedSampleCompiled = minimalCompiled();

  duplicatedSampleCompiled.eventSamples = [
      duplicatedSampleCompiled.eventSamples[0]!,
      { ...duplicatedSampleCompiled.eventSamples[0]! },
    ];

  TestValidator.equals(
  "equal sort keys retain both authored event samples",
  {
  equalSortKeysRetained: deriveProductionSoundPlan({
          timeline: minimalTimeline(),
          contracts: new Map([["shot", minimalContract()]]),
          compiled: new Map([["shot", duplicatedSampleCompiled]]),
        }).events.length
  },
  {
  equalSortKeysRetained: 2
  }
  );

  const crowdCompiled = minimalCompiled();

  crowdCompiled.scene.nodes = [];

  crowdCompiled.formations = [
      {
        id: "crowd",
        centroid: { x: 2, y: 0, z: 0 },
        anchor: { x: 2, y: 0, z: 0 },
        count: 2,
        facingDeg: 0,
        bounds: {
          min: { x: 1, y: 0, z: 0 },
          max: { x: 3, y: 0, z: 0 },
        },
      },
    ] as IAutoMovieCompiledShotSource["formations"];

  delete (crowdCompiled as { formationMotions?: unknown }).formationMotions;

  const crowdContract = minimalContract();

  crowdContract.events[0]!.subjects = ["crowd"];

  TestValidator.equals(
      "a static formation remains a resolved aggregate when no motion list exists",
      deriveProductionSoundPlan({
        timeline: minimalTimeline(),
        contracts: new Map([["shot", crowdContract]]),
        compiled: new Map([["shot", crowdCompiled]]),
      }).events[0]!.memberCount,
      2,
    );
};
