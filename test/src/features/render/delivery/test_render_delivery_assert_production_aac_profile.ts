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
