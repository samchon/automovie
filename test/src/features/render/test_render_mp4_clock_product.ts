import { TestValidator } from "@nestia/e2e";

import { equalRational } from "@automovie/render/node/equalRational";
import { exactProductionClockProduct } from "@automovie/render/node/exactProductionClockProduct";

/**
 * Two MP4 tracks are compared by an exact cross-product, never by division.
 *
 * A feature's video and audio tracks carry their own timescales, so equality of runtime is `videoDuration * audioTimescale === audioDuration * videoTimescale`. Each term is a safe integer, but their product is not bounded by that range, so the multiplication happens in `bigint`: a `number` product would round to the nearest representable double and report two different runtimes as equal. That is why every term is refused unless it is a positive safe integer, and why the product is never divided. The mux and the delivered-feature probe share this arithmetic and keep their own refusal texts, so this pins the shared half.
 *
 * Scenarios:
 *
 * 1. Two cross-products of one equal-runtime pair agree, and a one-tick-longer audio track disagrees.
 * 2. A product past the safe-integer range is exact: the largest admitted term times three differs from the double a `number` multiplication would give.
 * 3. Zero, negative, fractional and non-finite terms are refused on either side with the shared message, and the largest safe integer is still admitted.
 * 4. The boolean rational equality used for clock ratios matches equal ratios on different timescales, separates ratios a double cannot tell apart, and reports a zero or negative denominator or an unsafe term as unequal, so `1/0` never equals `2/0`.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual exact clock-product and rational-equality owners, distinguishing equal runtimes, one-tick changes and double-rounded large products while refusing inadmissible terms.
 * @evidence contracts/testing.md#independent-expectations The hand-computed 90-minute product is 3185049600000, below 2^53; the separate maximum-safe term times three supplies the genuine beyond-double witness with exact digits 27021597764222973. Positive safe clock terms and cross multiplication supply expectations without creating or probing MP4 media.
 * @evidence contracts/testing.md#distinguishing-cases Zero, negative, fractional, unsafe, NaN and infinite terms contrast with maximum-safe admission; rational cases cover equal scales, rounding-indistinguishable ratios and invalid denominators.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_mp4_clock_product owns its cases. Portable arithmetic through direct source imports; no mux, ffprobe, media file or child process runs.
 */
export function test_render_mp4_clock_product(): void {
  // 90 minutes of picture on a 24 fps, 12288-tick media clock beside the same
  // runtime on a 48 kHz audio clock: this equal-runtime product is below 2^53.
  // The separate maximum-safe-term case below exercises rounded double products.
  const videoDuration: number = 90 * 60 * 12_288;
  const videoTimescale: number = 12_288;
  const audioDuration: number = 90 * 60 * 48_000;
  const audioTimescale: number = 48_000;
  const left: bigint = exactProductionClockProduct(
    videoDuration,
    audioTimescale,
  );
  const right: bigint = exactProductionClockProduct(
    audioDuration,
    videoTimescale,
  );
  TestValidator.equals(
    "equal runtimes cross-multiply to one exact product",
    {
      left: left.toString(),
      right: right.toString(),
      equal: left === right,
    },
    {
      left: "3185049600000",
      right: "3185049600000",
      equal: true,
    },
  );
  TestValidator.predicate(
    "one audio tick more is a different runtime, not a rounding difference",
    exactProductionClockProduct(audioDuration + 1, videoTimescale) !== left,
  );

  // Past the safe-integer range a `number` product rounds to the nearest double,
  // which is the loss the bigint multiplication exists to avoid.
  TestValidator.equals(
    "a product past the safe-integer range keeps every digit",
    {
      exact: exactProductionClockProduct(Number.MAX_SAFE_INTEGER, 3).toString(),
      rounded: (Number.MAX_SAFE_INTEGER * 3).toString(),
    },
    { exact: "27021597764222973", rounded: "27021597764222972" },
  );

  const refused: (left: number, right: number) => boolean = (
    left: number,
    right: number,
  ): boolean => {
    try {
      exactProductionClockProduct(left, right);
      return false;
    } catch (error: unknown) {
      return (
        error instanceof Error &&
        error.message ===
          "MP4 presentation clocks must be positive safe integers."
      );
    }
  };
  TestValidator.equals(
    "every term outside the positive safe-integer domain is refused",
    {
      zeroLeft: refused(0, 48_000),
      zeroRight: refused(48_000, 0),
      negativeLeft: refused(-1, 48_000),
      negativeRight: refused(48_000, -1),
      fractionalLeft: refused(1.5, 48_000),
      fractionalRight: refused(48_000, 1.5),
      unsafeLeft: refused(Number.MAX_SAFE_INTEGER + 2, 48_000),
      infiniteRight: refused(48_000, Number.POSITIVE_INFINITY),
      notANumber: refused(Number.NaN, 48_000),
      maximumSafeAdmitted: refused(Number.MAX_SAFE_INTEGER, 1) === false,
    },
    {
      zeroLeft: true,
      zeroRight: true,
      negativeLeft: true,
      negativeRight: true,
      fractionalLeft: true,
      fractionalRight: true,
      unsafeLeft: true,
      infiniteRight: true,
      notANumber: true,
      maximumSafeAdmitted: true,
    },
  );

  TestValidator.equals(
    "rational clock equality is exact and needs positive denominators",
    {
      equalOnDifferentTimescales: equalRational(
        videoDuration,
        videoTimescale,
        audioDuration,
        audioTimescale,
      ),
      // (2^53 - 3) / 3 and (2^53 - 4) / 3 divide to the same double.
      unequalBeyondDoublePrecision: equalRational(
        Number.MAX_SAFE_INTEGER - 2,
        3,
        Number.MAX_SAFE_INTEGER - 3,
        3,
      ),
      zeroDenominators: equalRational(1, 0, 2, 0),
      negativeDenominator: equalRational(1, -2, -1, 2),
      unsafeTerm: equalRational(1.5, 3, 1, 2),
    },
    {
      equalOnDifferentTimescales: true,
      unequalBeyondDoublePrecision: false,
      zeroDenominators: false,
      negativeDenominator: false,
      unsafeTerm: false,
    },
  );
}
