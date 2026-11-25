import { assertProductionVideoProfile, resolveProductionVideoProfile } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createProductionVideoProbe } from "../../internal/createProductionVideoProbe";

/**
 * `assertProductionVideoProfile` accepts a probed MP4 that has the profile.
 *
 * Scenarios:
 *
 * 1. A probe built from the profile, 24 frames at 24 fps, passes.
 * 2. A different width, a missing required brand, a frame count that is not the
 *    sample count, a first decode time past 0, a non-unity matrix, a colour
 *    other than the profile's and a partial edit are each refused, naming the
 *    first mismatching field.
 */
export function test_render_delivery_assert_production_video_profile(): void {
  const expected = resolveProductionVideoProfile({
    width: 64,
    height: 32,
    frameRate: { numerator: 24, denominator: 1 },
  });
  const run = (edit: (probe: ReturnType<typeof createProductionVideoProbe>) => void): string => {
    const actual = createProductionVideoProbe({ profile: expected, frameCount: 24 });
    edit(actual);
    try {
      assertProductionVideoProfile({ expected, actual });
    } catch (error) {
      return error instanceof Error ? error.message : "";
    }
    return "";
  };
  TestValidator.equals("accepted", run((): void => {}), "");
  type Probe = ReturnType<typeof createProductionVideoProbe>;
  const cases: [string, (probe: Probe) => void][] = [
    ["width", (probe: Probe): void => {
      probe.width = 65;
    }],
    ["brands.compatible.isom", (probe: Probe): void => {
      probe.brands.compatible = ["mp41"];
    }],
    ["samples.count", (probe: Probe): void => {
      probe.samples.count = 23;
    }],
    ["samples.firstDts", (probe: Probe): void => {
      probe.samples.firstDts = 1;
    }],
    ["trackMatrix", (probe: Probe): void => {
      probe.trackMatrix[0] = 2;
    }],
    ["color.primaries", (probe: Probe): void => {
      if (probe.color.container.kind === "nclx") probe.color.container.primaries += 1;
    }],
    ["presentation.edits", (probe: Probe): void => {
      probe.presentation.edits.push({
        segmentDuration: 1,
        mediaTime: 3,
        mediaRateInteger: 1,
        mediaRateFraction: 0,
      });
    }],
  ];
  for (const [field, edit] of cases)
    TestValidator.predicate(
      field,
      run(edit).startsWith(`unsupported-video-profile.${field}`),
    );
}