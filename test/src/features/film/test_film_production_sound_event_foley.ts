import { deriveProductionSoundPlan } from "@automovie/engine";
import type {
  IAutoMovieDeriveProductionSoundPlan,
  IAutoMovieFilmTimeline,
  IAutoMovieFilmTimelineSegment,
  IAutoMovieProductionSoundCue,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import {
  productionSoundCompiled,
  productionSoundContract,
  productionSoundTimeline,
} from "./productionSoundFixtures";

/**
 * Adopted source cues follow picture events through trims and repeated shots.
 *
 * Scenarios:
 *
 * 1. The same contact lies on an excluded exclusive out, on an included in,
 *    and inside another occurrence. A negative cue offset preserves its attack alignment.
 * 2. Cues for fully trimmed events contribute no placement. Fixed cues and
 *    semantic events retain their legacy values when event cues are supplied.
 * 3. Missing shot, event, or asset references, fractional offsets, duplicate ids, and invalid source or film spans refuse.
 * 4. Gain and fades follow the audio cue bounds even when the event is trimmed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes placement, compatibility, cue reference and span refusal, and gain and fade bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public sound planner with real shot contracts, compiled event samples, timeline cuts and normalized asset trims.
 * @evidence contracts/development/testing.md#independent-expectations The authored 0.2 second contact at 20 fps is source frame 4. The three cuts exclude it at source-out 4, keep it at film frame 4, and map it to film frame 16. Literal cue starts 2 and 14 verify two frames of lead without reusing planner output as the timing oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates cut-away events from missing declarations or samples, exclusive out from inclusive in, repeated occurrences from fixed placements, present from missing asset identities even after trim, and valid trim/offsets from fractional or overflowing placements. It accepts fades that exactly fill the cue and rejects invalid gain or fades on retained and trimmed cues.
 * @evidence contracts/development/testing.md#execution-ownership The feature entry owns in-memory compiler assertions through deriveProductionSoundPlan and acquires no renderer, filesystem, decoder, process or completed-result cache.
 */
export function test_film_production_sound_event_foley(): void {
  const timeline: IAutoMovieFilmTimeline = productionSoundTimeline();
  const shot: IAutoMovieFilmTimelineSegment = timeline.segments[0]!;
  timeline.segments = [
    { ...shot, sourceOutFrame: 4, endFrame: 4 },
    {
      ...shot,
      sourceInFrame: 4,
      sourceOutFrame: 14,
      startFrame: 4,
      endFrame: 14,
    },
    {
      ...shot,
      sourceInFrame: 2,
      sourceOutFrame: 48,
      startFrame: 14,
      endFrame: 60,
    },
  ];
  const input: IAutoMovieDeriveProductionSoundPlan.IProps = {
    timeline,
    eventCueAssets: new Set(["public/contact.wav"]),
    contracts: new Map([[shot.shot, productionSoundContract()]]),
    compiled: new Map([[shot.shot, productionSoundCompiled()]]),
  };
  const cue: IAutoMovieDeriveProductionSoundPlan.IEventCue = {
    id: "recorded-contact",
    asset: "public/contact.wav",
    shot: shot.shot,
    event: "contact",
    offsetFrames: -2,
    durationFrames: 4,
    sourceOffsetFrame: 3,
    sourceDurationFrames: 8,
    gain: 0.5,
    fadeInFrames: 1,
    fadeOutFrames: 3,
    bus: "effects",
  };
  const fixed: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan(input);
  const synced: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan({
    ...input,
    eventCues: [
      cue,
      { ...cue, id: "trimmed-foley", event: "trimmed", offsetFrames: 0 },
    ],
  });
  const placements: IAutoMovieProductionSoundCue[] = synced.cues.slice(
    fixed.cues.length,
  );
  TestValidator.equals(
    "a contact cue follows both retained starts and honors signed lead",
    placements.map(
      (placement: IAutoMovieProductionSoundCue): number => placement.startFrame,
    ),
    [2, 14],
  );
  TestValidator.predicate(
    "repeated placements own unique ids and retain the same source trim",
    new Set(
      placements.map(
        (placement: IAutoMovieProductionSoundCue): string => placement.id,
      ),
    ).size === 2 &&
      placements.every(
        (placement: IAutoMovieProductionSoundCue): boolean =>
          placement.asset === cue.asset &&
          placement.sourceOffsetFrame === 3 &&
          placement.sourceDurationFrames === 8 &&
          placement.durationFrames === 4 &&
          placement.gain === 0.5 &&
          placement.fadeInFrames === 1 &&
          placement.fadeOutFrames === 3 &&
          placement.bus === "effects",
      ),
  );
  TestValidator.equals(
    "fixed cues preserve order and complete payload",
    synced.cues.slice(0, fixed.cues.length),
    fixed.cues,
  );
  TestValidator.equals(
    "semantic events keep their own placement",
    synced.events,
    fixed.events,
  );

  const withoutSample: IAutoMovieDeriveProductionSoundPlan.IProps = {
    ...input,
    compiled: new Map([
      [shot.shot, { ...productionSoundCompiled(), eventSamples: [] }],
    ]),
  };
  TestValidator.predicate(
    "unresolved references and invalid cue placements refuse with cue identity",
    throwsError(
      (): IAutoMovieProductionSoundPlan =>
        deriveProductionSoundPlan({
          ...input,
          eventCues: [{ ...cue, event: "unknown" }],
        }),
      ['"recorded-contact"', '"unknown"'],
    ) &&
      throwsError(
        (): IAutoMovieProductionSoundPlan =>
          deriveProductionSoundPlan({
            ...input,
            eventCues: [{ ...cue, shot: "unknown-shot" }],
          }),
        ['"recorded-contact"', '"unknown-shot"'],
      ) &&
      throwsError(
        (): IAutoMovieProductionSoundPlan =>
          deriveProductionSoundPlan({
            ...input,
            eventCues: [
              { ...cue, event: "trimmed", asset: "public/missing.wav" },
            ],
          }),
        ['"recorded-contact"', '"public/missing.wav"'],
      ) &&
      throwsError(
        (): IAutoMovieProductionSoundPlan =>
          deriveProductionSoundPlan({
            ...input,
            eventCues: [{ ...cue, sourceOffsetFrame: 5 }],
          }),
        ['"recorded-contact"', "whole-frame trim"],
      ) &&
      throwsError(
        (): IAutoMovieProductionSoundPlan =>
          deriveProductionSoundPlan({ ...withoutSample, eventCues: [cue] }),
        ['"recorded-contact"', "declared and realized"],
      ) &&
      throwsError(
        (): IAutoMovieProductionSoundPlan =>
          deriveProductionSoundPlan({
            ...input,
            eventCues: [{ ...cue, offsetFrames: -1.5 }],
          }),
        ['"recorded-contact"', "whole-frame offset"],
      ) &&
      throwsError(
        (): IAutoMovieProductionSoundPlan =>
          deriveProductionSoundPlan({ ...input, eventCues: [cue, cue] }),
        ['"recorded-contact"', "repeats an authored cue id"],
      ) &&
      throwsError(
        (): IAutoMovieProductionSoundPlan =>
          deriveProductionSoundPlan({
            ...input,
            eventCues: [{ ...cue, offsetFrames: 41 }],
          }),
        ['"recorded-contact"', "must fit inside the film"],
      ),
  );

  const invalidLevels: Array<{
    name: string;
    cue: IAutoMovieDeriveProductionSoundPlan.IEventCue;
    diagnostic: string;
  }> = [
    {
      name: "non-finite gain on a retained cue",
      cue: { ...cue, gain: Number.NaN },
      diagnostic: "finite gain",
    },
    {
      name: "negative gain on a trimmed cue",
      cue: { ...cue, event: "trimmed", gain: -1 },
      diagnostic: "finite gain",
    },
    {
      name: "gain above the authored ceiling",
      cue: { ...cue, gain: 4.01 },
      diagnostic: "finite gain",
    },
    {
      name: "negative fade-in",
      cue: { ...cue, fadeInFrames: -1 },
      diagnostic: "whole-frame fades",
    },
    {
      name: "fractional fade-in",
      cue: { ...cue, fadeInFrames: 0.5 },
      diagnostic: "whole-frame fades",
    },
    {
      name: "non-finite fade-out",
      cue: { ...cue, fadeOutFrames: Number.POSITIVE_INFINITY },
      diagnostic: "whole-frame fades",
    },
    {
      name: "combined fades longer than the span on a trimmed cue",
      cue: { ...cue, event: "trimmed", fadeInFrames: 2 },
      diagnostic: "sum fits the cue span",
    },
  ];
  for (const invalid of invalidLevels)
    TestValidator.predicate(
      invalid.name,
      throwsError(
        (): IAutoMovieProductionSoundPlan =>
          deriveProductionSoundPlan({ ...input, eventCues: [invalid.cue] }),
        ['"recorded-contact"', invalid.diagnostic],
      ),
    );
}
