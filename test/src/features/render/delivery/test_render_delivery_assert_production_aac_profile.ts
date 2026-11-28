import { AutoMovieRenderDelivery } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createProductionAudioProbe } from "../../internal/createProductionAudioProbe";

/**
 * `AutoMovieRenderDelivery.assertAacProfile` accepts a probed audio track of AAC-LC at 48 kHz
 * in two channels with at least one sample.
 *
 * Scenarios:
 *
 * 1. The production probe passes.
 * 2. A different object type, sample rate, channel count and an empty track are
 *    each refused, naming the field.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Requires AAC-LC with the commissioned sample rate, channel count and nonempty track.
 * @evidence contracts/development/testing.md#behavioral-verification Calls audio-profile admission on a valid typed probe and probes with independent object type, rate, channel or sample defects.
 * @evidence contracts/development/testing.md#independent-expectations The literal 48 kHz stereo AAC-LC profile and the named failing fields distinguish all four mismatches.
 */
export function test_render_delivery_assert_production_aac_profile(): void {
  AutoMovieRenderDelivery.assertAacProfile(createProductionAudioProbe());
  const message = (edit: (probe: ReturnType<typeof createProductionAudioProbe>) => void): string => {
    const probe = createProductionAudioProbe();
    edit(probe);
    try {
      AutoMovieRenderDelivery.assertAacProfile(probe);
    } catch (error) {
      return error instanceof Error ? error.message : "";
    }
    return "";
  };
  type Probe = ReturnType<typeof createProductionAudioProbe>;
  const cases: [string, (probe: Probe) => void][] = [
    ["audioObjectType", (probe: Probe): void => {
      probe.sampleEntry.audioObjectType = 5;
    }],
    ["sampleRate", (probe: Probe): void => {
      probe.sampleEntry.sampleRate = 44_100;
    }],
    ["channelCount", (probe: Probe): void => {
      probe.sampleEntry.channelCount = 1;
    }],
    ["sampleCount", (probe: Probe): void => {
      probe.sampleCount = 0;
    }],
  ];
  for (const [field, edit] of cases)
    TestValidator.predicate(
      field,
      message(edit).startsWith(`unsupported-audio-profile.${field}`),
    );
}
