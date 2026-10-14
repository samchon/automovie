import type { IAutoMovieProductionVideoProbe } from "@automovie/interface";
import {
  assertProductionVideoProfile,
  resolveProductionVideoProfile,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

const video: () => IAutoMovieProductionVideoProbe = (): IAutoMovieProductionVideoProbe => ({
  kind: "video",
  container: "mp4",
  codec: "h264",
  width: 16,
  height: 16,
  runtimeSeconds: 1,
  frameCount: 24,
  fps: 24,
  frameRate: { numerator: 24, denominator: 1 },
  brands: { major: "isom", compatible: ["isom", "iso2", "avc1", "mp41"] },
  coded: { width: 16, height: 16 },
  trackDisplay: { width16_16: 16 * 65_536, height16_16: 16 * 65_536 },
  trackMatrix: [65_536, 0, 0, 0, 65_536, 0, 0, 0, 1_073_741_824],
  pixelAspect: { kind: "implicit-square" },
  presentation: {
    movieTimescale: 90_000,
    mediaTimescale: 90_000,
    movieDuration: 90_000,
    mediaDuration: 90_000,
    edits: [],
  },
  samples: {
    count: 24,
    duration: 3_750,
    timescale: 90_000,
    firstDts: 0,
    lastDts: 86_250,
    firstCts: 0,
    lastCts: 86_250,
  },
  color: {
    container: {
      kind: "nclx",
      primaries: 1,
      transfer: 13,
      matrix: 1,
      fullRange: true,
    },
    resolved: { kind: "srgb", source: "container" },
  },
});

const refused: (closure: () => unknown, message: string) => boolean = (closure: () => unknown, message: string): boolean => {
  try {
    closure();
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(message);
  }
};

/**
 * Validate exact MP4 presentation, timebase, brand, aspect, and color facts.
 *
 * Scenarios:
 * 1. The neutral current profile accepts implicit or explicit square pixels and
 *    either no edit or one exact full-duration zero-start edit.
 * 2. Matrix, display raster, sample clock, brands, edits, aspect, and every
 *    nclx component have one-field negative twins.
 * 3. Missing color identity and a decimal-near but rationally distinct rate
 *    refuse even when legacy raster, sample count, runtime, and fps agree.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves the delivery profile, admits neutral/explicit-square/full-zero-start-edit probes and requires each one-field presentation/color/timebase substitution to throw a refusal naming its field. A profile checker omitting any tested fact fails that negative twin.
 * @evidence contracts/testing.md#independent-expectations Authored 16-square raster, 24/1 frame rate, unity fixed-point matrix, isom brands and full-range sRGB declaration supply literal protocol expectations. Twenty-four samples of 3750 ticks at 90000 ticks/second yield one second and last sample time 86250; decimal fps alone cannot authenticate a changed rational clock. This tests probe-policy comparison, not whether a real decoder produced these observations.
 * @evidence contracts/testing.md#distinguishing-cases Retains absent/full-duration edits, implicit/explicit square pixels, every original one-field substitution, absent color and changed sample/rational clocks. Container parsing, encoded sample residency and color-box writing belong to adjacent video probe/normalization tests.
 * @evidence contracts/testing.md#execution-ownership The named test_production_video_profile owns portable synchronous profile construction/admission and every table mutation through private typed helpers. No MP4 is encoded/decoded, filesystem accessed or renderer/native host started.
 */
export function test_production_video_profile(): void {
  const expected: ReturnType<typeof resolveProductionVideoProfile> = resolveProductionVideoProfile({
    width: 16,
    height: 16,
    frameRate: { numerator: 24, denominator: 1 },
  });
  const actual: IAutoMovieProductionVideoProbe = video();
  assertProductionVideoProfile({ expected, actual });
  const explicitSquare: IAutoMovieProductionVideoProbe = structuredClone(actual);
  explicitSquare.pixelAspect = { kind: "explicit", hSpacing: 1, vSpacing: 1 };
  assertProductionVideoProfile({ expected, actual: explicitSquare });
  const canonicalEdit: IAutoMovieProductionVideoProbe = structuredClone(actual);
  canonicalEdit.presentation.edits = [
    {
      segmentDuration: canonicalEdit.presentation.movieDuration,
      mediaTime: 0,
      mediaRateInteger: 1,
      mediaRateFraction: 0,
    },
  ];
  assertProductionVideoProfile({ expected, actual: canonicalEdit });
  TestValidator.equals(
    "the current profile resolves exact neutral presentation and sRGB facts",
    expected,
    {
      width: 16,
      height: 16,
      frameRate: { numerator: 24, denominator: 1 },
      brands: { major: "isom", requiredCompatible: ["isom"] },
      trackMatrix: [65_536, 0, 0, 0, 65_536, 0, 0, 0, 1_073_741_824],
      pixelAspect: "square",
      color: { primaries: 1, transfer: 13, matrix: 1, fullRange: true },
    },
  );
  const substitutions: Array<
    [string, (value: IAutoMovieProductionVideoProbe) => void]
  > = [
    ["brands.major", (value: IAutoMovieProductionVideoProbe): void => { value.brands.major = "mp42"; }],
    ["brands.compatible.isom", (value: IAutoMovieProductionVideoProbe): void => { value.brands.compatible = ["mp42"]; }],
    ["width", (value: IAutoMovieProductionVideoProbe): void => { value.width = 15; }],
    ["height", (value: IAutoMovieProductionVideoProbe): void => { value.height = 15; }],
    ["coded.width", (value: IAutoMovieProductionVideoProbe): void => { value.coded.width = 15; }],
    ["coded.height", (value: IAutoMovieProductionVideoProbe): void => { value.coded.height = 15; }],
    [
      "trackDisplay.width16_16",
      (value: IAutoMovieProductionVideoProbe): void => { value.trackDisplay.width16_16 *= 2; },
    ],
    [
      "trackDisplay.height16_16",
      (value: IAutoMovieProductionVideoProbe): void => { value.trackDisplay.height16_16 *= 2; },
    ],
    [
      "trackMatrix",
      (value: IAutoMovieProductionVideoProbe): void => {
        value.trackMatrix = [
          0, 65_536, 0, -65_536, 0, 0, 0, 0, 1_073_741_824,
        ];
      },
    ],
    ["samples.count", (value: IAutoMovieProductionVideoProbe): void => { value.samples.count = 23; }],
    ["samples.duration", (value: IAutoMovieProductionVideoProbe): void => { value.samples.duration = 0; }],
    ["samples.timescale", (value: IAutoMovieProductionVideoProbe): void => { value.samples.timescale = 0; }],
    ["samples.firstDts", (value: IAutoMovieProductionVideoProbe): void => { value.samples.firstDts = 1; }],
    ["samples.lastDts", (value: IAutoMovieProductionVideoProbe): void => { value.samples.lastDts -= 1; }],
    ["samples.firstCts", (value: IAutoMovieProductionVideoProbe): void => { value.samples.firstCts = 1; }],
    ["samples.lastCts", (value: IAutoMovieProductionVideoProbe): void => { value.samples.lastCts -= 1; }],
    [
      "presentation.movieTimescale",
      (value: IAutoMovieProductionVideoProbe): void => { value.presentation.movieTimescale = 0; },
    ],
    [
      "presentation.mediaTimescale",
      (value: IAutoMovieProductionVideoProbe): void => { value.presentation.mediaTimescale = 48_000; },
    ],
    [
      "presentation.mediaDuration",
      (value: IAutoMovieProductionVideoProbe): void => { value.presentation.mediaDuration -= 1; },
    ],
    ["runtimeSeconds.media", (value: IAutoMovieProductionVideoProbe): void => { value.runtimeSeconds -= 0.1; }],
    [
      "runtimeSeconds.movie",
      (value: IAutoMovieProductionVideoProbe): void => { value.presentation.movieDuration -= 1; },
    ],
    [
      "color.container.kind",
      (value: IAutoMovieProductionVideoProbe): void => {
        value.color.container = { kind: "absent" };
        value.color.resolved = { kind: "absent" };
      },
    ],
    [
      "color.resolved.kind",
      (value: IAutoMovieProductionVideoProbe): void => { value.color.resolved = { kind: "absent" }; },
    ],
    ["frameRate", (value: IAutoMovieProductionVideoProbe): void => { value.frameRate.denominator = 2; }],
    ["frameRate", (value: IAutoMovieProductionVideoProbe): void => { value.samples.duration = 3_754; }],
    [
      "pixelAspect",
      (value: IAutoMovieProductionVideoProbe): void => {
        value.pixelAspect = { kind: "explicit", hSpacing: 2, vSpacing: 1 };
      },
    ],
    [
      "color.primaries",
      (value: IAutoMovieProductionVideoProbe): void => {
        if (value.color.container.kind === "nclx")
          value.color.container.primaries = 9;
      },
    ],
    [
      "color.transfer",
      (value: IAutoMovieProductionVideoProbe): void => {
        if (value.color.container.kind === "nclx")
          value.color.container.transfer = 1;
      },
    ],
    [
      "color.matrix",
      (value: IAutoMovieProductionVideoProbe): void => {
        if (value.color.container.kind === "nclx")
          value.color.container.matrix = 9;
      },
    ],
    [
      "color.fullRange",
      (value: IAutoMovieProductionVideoProbe): void => {
        if (value.color.container.kind === "nclx")
          value.color.container.fullRange = false;
      },
    ],
    [
      "presentation.edits",
      (value: IAutoMovieProductionVideoProbe): void => {
        value.presentation.edits = [
          {
            segmentDuration: 1,
            mediaTime: -1,
            mediaRateInteger: 1,
            mediaRateFraction: 0,
          },
        ];
      },
    ],
  ];
  TestValidator.predicate(
    "every omitted presentation and color fact has a refusing twin",
    substitutions.every(([field, mutate]: typeof substitutions[number]): boolean => {
      const value: IAutoMovieProductionVideoProbe = structuredClone(actual);
      mutate(value);
      return refused(
        (): void => assertProductionVideoProfile({ expected, actual: value }),
        field,
      );
    }),
  );
}
