import { equalProductionFrameRates } from "@automovie/engine";
import type {
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionVideoProbe,
} from "@automovie/interface";

import type { IAutoMovieProductionVideoProfile } from "./IAutoMovieProductionVideoProfile";

/**
 * Refuse every presentation, timing or color fact of a probed H.264-in-MP4
 * video that differs from its delivery profile.
 *
 * The file must be MP4 with H.264, the profile's major brand and every required
 * compatible brand, the profile raster as coded size and as 16.16 track display
 * size, and the unity track matrix. Its samples must number the probed frame
 * count with one positive constant duration, start at decode and composition
 * time zero, and run at exactly the profile's frame rate, and both runtimes,
 * media and movie, must equal the reported runtime. Pixels must be square, the
 * `nclx` color box must declare the profile's sRGB code points, and the edit
 * list must be empty or one full-length edit starting at media time zero. The
 * first difference throws an `Error` whose message starts with
 * `unsupported-video-profile.<field>` and names the expected and observed
 * values.
 *
 * @evidence contracts/common.md#principled-implementation Each fact is compared exactly in the file's own integer units; the frame rate is compared as a reduced rational through `equalProductionFrameRates` on timescale over sample duration, and the sample clock is checked by name before that rate is derived, so a zero clock is reported as its field rather than as an arithmetic failure.
 * @evidence contracts/common.md#clear-and-simple-design One ordered list of named comparisons, with conditional rows for brands, explicit pixel aspect, `nclx` fields and edits, is the whole check, so every normalizer, assembler and delivery validator applies the same profile and reports the same field name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Container, codec, `nclx` and sRGB identities are the single delivery format the normalizer writes, an extra compatible brand is allowed because brands only advertise readers, and no file or caller is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc lists every compared group, the timing and edit-list conditions, and the error format; the order of rows decides which field a multiply-wrong file reports.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar checks are constant work; required-brand membership costs the product of required and observed brand counts. Matrix serialization and any mismatched edit-list serialization depend on their lengths, which caller-supplied records do not cap here. No coded sample bytes are read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call judges one probe of one file, and the several callers check different files or the same file after it changed, so no earlier verdict is equivalent.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The comparison list is the only allocation and dies with the call; the function opens no file, process or task.
 */
export const assertProductionVideoProfile: (props: { expected: IAutoMovieProductionVideoProfile; actual: IAutoMovieProductionVideoProbe }) => void = (props: {
  /** Profile resolved from the deliverable's authored raster and rate. */
  expected: IAutoMovieProductionVideoProfile;

  /** Facts the MP4 probe observed in the file. */
  actual: IAutoMovieProductionVideoProbe;
}): void => {
  const expected: IAutoMovieProductionVideoProfile = props.expected;
  const actual: IAutoMovieProductionVideoProbe = props.actual;
  const clockValid: boolean =
    positiveClock(actual.samples.timescale) &&
    positiveClock(actual.samples.duration);
  const actualRate: IAutoMovieProductionFrameRate = {
    numerator: actual.samples.timescale,
    denominator: actual.samples.duration,
  };
  const lastSampleTime: number =
    (actual.samples.count - 1) * actual.samples.duration;
  const comparisons: Array<[string, unknown, unknown]> = [
    ["container", "mp4", actual.container],
    ["codec", "h264", actual.codec],
    ["brands.major", expected.brands.major, actual.brands.major],
    ["width", expected.width, actual.width],
    ["height", expected.height, actual.height],
    ["coded.width", expected.width, actual.coded.width],
    ["coded.height", expected.height, actual.coded.height],
    [
      "trackDisplay.width16_16",
      expected.width * 65_536,
      actual.trackDisplay.width16_16,
    ],
    [
      "trackDisplay.height16_16",
      expected.height * 65_536,
      actual.trackDisplay.height16_16,
    ],
    [
      "trackMatrix",
      JSON.stringify(expected.trackMatrix),
      JSON.stringify(actual.trackMatrix),
    ],
    ["samples.count", actual.frameCount, actual.samples.count],
    ["samples.duration", true, positiveClock(actual.samples.duration)],
    ["samples.timescale", true, positiveClock(actual.samples.timescale)],
    [
      "frameRate",
      true,
      clockValid &&
        equalProductionFrameRates(expected.frameRate, actualRate) &&
        equalProductionFrameRates(actual.frameRate, actualRate),
    ],
    ["samples.firstDts", 0, actual.samples.firstDts],
    [
      "samples.lastDts",
      lastSampleTime,
      actual.samples.lastDts,
    ],
    ["samples.firstCts", 0, actual.samples.firstCts],
    [
      "samples.lastCts",
      lastSampleTime,
      actual.samples.lastCts,
    ],
    [
      "presentation.movieTimescale",
      true,
      actual.presentation.movieTimescale > 0,
    ],
    [
      "presentation.mediaTimescale",
      actual.samples.timescale,
      actual.presentation.mediaTimescale,
    ],
    [
      "presentation.mediaDuration",
      actual.samples.count * actual.samples.duration,
      actual.presentation.mediaDuration,
    ],
    [
      "runtimeSeconds.media",
      actual.presentation.mediaDuration / actual.presentation.mediaTimescale,
      actual.runtimeSeconds,
    ],
    [
      "runtimeSeconds.movie",
      actual.presentation.movieDuration / actual.presentation.movieTimescale,
      actual.runtimeSeconds,
    ],
    ["color.container.kind", "nclx", actual.color.container.kind],
    ["color.resolved.kind", "srgb", actual.color.resolved.kind],
  ];
  for (const brand of expected.brands.requiredCompatible)
    comparisons.push([
      `brands.compatible.${brand}`,
      true,
      actual.brands.compatible.includes(brand),
    ]);
  if (actual.pixelAspect.kind === "explicit")
    comparisons.push([
      "pixelAspect",
      actual.pixelAspect.hSpacing,
      actual.pixelAspect.vSpacing,
    ]);
  if (actual.color.container.kind === "nclx") {
    comparisons.push(
      [
        "color.primaries",
        expected.color.primaries,
        actual.color.container.primaries,
      ],
      [
        "color.transfer",
        expected.color.transfer,
        actual.color.container.transfer,
      ],
      ["color.matrix", expected.color.matrix, actual.color.container.matrix],
      [
        "color.fullRange",
        expected.color.fullRange,
        actual.color.container.fullRange,
      ],
    );
  }
  const edits: IAutoMovieProductionVideoProbe["presentation"]["edits"] =
    actual.presentation.edits;
  if (
    edits.length !== 0 &&
    !(
      edits.length === 1 &&
      edits[0]!.mediaTime === 0 &&
      edits[0]!.mediaRateInteger === 1 &&
      edits[0]!.mediaRateFraction === 0 &&
      edits[0]!.segmentDuration === actual.presentation.movieDuration
    )
  )
    comparisons.push([
      "presentation.edits",
      "none or one full zero-start edit",
      JSON.stringify(edits),
    ]);
  const mismatch: [string, unknown, unknown] | undefined = comparisons.find(
    ([, wanted, observed]: [string, unknown, unknown]): boolean =>
      wanted !== observed,
  );
  if (mismatch !== undefined)
    throw new Error(
      `unsupported-video-profile.${mismatch[0]}: expected ${String(mismatch[1])}, observed ${String(mismatch[2])}.`,
    );
};

/** Whether a sample-clock term is a positive safe integer. */
const positiveClock: (value: number) => boolean = (value: number): boolean =>
  Number.isSafeInteger(value) && value > 0;
