import { AutoMovieEngineSound } from "@automovie/engine";
import type { IAutoMovieCompiledShotSource } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 * Event planning retains equal sort keys and resolves a static formation
 * aggregate without inventing a motion list.
 *
 * Scenarios:
 *
 * 1. Two event samples with identical sort keys remain present.
 * 2. A static two-member formation remains a resolved aggregate when no
 *    formation-motion list exists.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Executes the actual planner after duplicating one event sample and after replacing the individual subject with a static two-member formation whose motion list is absent, observing retained event count and resolved aggregate member count.
 * @evidence contracts/development/testing.md#independent-expectations Two authored samples and the literal formation count of two determine independent integer expectations. Equal-key retention alone does not prove ordering among distinct keys or stable identity ordering of identical events, and aggregate resolution does not inspect actual slots or acoustic pressure.
 * @evidence contracts/development/common.md#meaningful-documentation Tied event records both survive planning. A static two-member formation retains its resolved aggregate outcome.
 */
export function test_engine_sound_plan_member_ordering(): void {
  const {
    minimalTimeline,
    minimalContract,
    minimalCompiled,
  }: ReturnType<typeof createSoundPropagationTestInputs> =
    createSoundPropagationTestInputs();

  const duplicatedSampleCompiled: ReturnType<typeof minimalCompiled> =
    minimalCompiled();

  duplicatedSampleCompiled.eventSamples = [
    duplicatedSampleCompiled.eventSamples[0]!,
    { ...duplicatedSampleCompiled.eventSamples[0]! },
  ];

  TestValidator.equals(
    "equal sort keys retain both authored event samples",
    {
      equalSortKeysRetained: AutoMovieEngineSound.deriveProductionSoundPlan({
        timeline: minimalTimeline(),
        contracts: new Map([["shot", minimalContract()]]),
        compiled: new Map([["shot", duplicatedSampleCompiled]]),
      }).events.length,
    },
    {
      equalSortKeysRetained: 2,
    },
  );

  const crowdCompiled: ReturnType<typeof minimalCompiled> = minimalCompiled();

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

  const crowdContract: ReturnType<typeof minimalContract> = minimalContract();

  crowdContract.events[0]!.subjects = ["crowd"];

  TestValidator.equals(
    "a static formation remains a resolved aggregate when no motion list exists",
    AutoMovieEngineSound.deriveProductionSoundPlan({
      timeline: minimalTimeline(),
      contracts: new Map([["shot", crowdContract]]),
      compiled: new Map([["shot", crowdCompiled]]),
    }).events[0]!.memberCount,
    2,
  );
}
