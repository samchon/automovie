import { linearColorToSrgbHex, srgbHexToLinearColor } from "@automovie/engine";
import type { IAutoMovieColor } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose, throwsError } from "../internal/predicates";

/**
 * sRGB decoding and quantized encoding follow the declared piecewise transfer
 * curves, with independently calculated channel values and refusal boundaries.
 *
 * Scenarios:
 *
 * 1. `#000000` and `#ffffff` decode to exact `0` and `1`, the two values where
 *    an approximate curve is still allowed to look right, and they re-encode to
 *    themselves.
 * 2. `#7d828c`, the swatch that split one production's roof in two, decodes to
 *    the standard's `0.2051 / 0.2232 / 0.2623` rather than the transcribed
 *    `0.4902 / 0.5098 / 0.5490`, and `#808080` decodes to `0.2159` rather than
 *    `0.5020`.
 * 3. The decode's piecewise split is exercised on both sides: byte `10` sits
 *    below the `0.04045` breakpoint and takes the `/ 12.92` segment, byte `11`
 *    sits above it and takes the power segment, and the two agree at the
 *    breakpoint itself to within `1e-8`.
 * 4. The encode's piecewise split is exercised the same way: linear `0.001`
 *    takes the `* 12.92` segment while `0.5` takes the power segment, and the
 *    values straddling the `0.0031308` breakpoint land on one byte.
 * 5. All 256 grayscale channel values round-trip exactly through decode and encode;
 *    arbitrary linear triples remain subject to eight-bit quantization.
 * 6. A mixed-case swatch returns its lowercase label and alpha `1`; these
 *    observations do not distinguish re-encoding from lowercasing the input.
 * 7. Components outside `[0, 1]` clamp to the gamut ends because eight bits
 *    cannot state light the display cannot emit.
 * 8. A malformed swatch is refused rather than decoded: a missing `#`, five
 *    digits, eight digits, a non-hexadecimal digit, and the empty string.
 * 9. A non-finite component is refused rather than clamped, so `NaN` can never
 *    be rounded into a string that reads like a swatch.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual sRGB decode/encode and asserts channel values, opaque alpha, normalized labels, quantized bytes, gamut clipping and named refusals. Treating display bytes as linear channels, choosing the wrong transfer branch or encoding nonfinite data fails these assertions.
 * @evidence contracts/testing.md#independent-expectations The declared sRGB thresholds 0.04045/0.0031308, divisor 12.92, offset .055 and exponent 2.4 determine the literal/formula expectations and rounded output bytes. Grayscale roundtrip parity alone can share an inverse-pair defect, so independent midtone and branch values constrain it; this unit observes numbers rather than displayed color.
 * @evidence contracts/testing.md#distinguishing-cases Preserves black/white, slate/midgrey, bytes immediately below/above decode split, both encode branches and split adjacency, all 256 grayscale bytes, mixed-case labels, opaque alpha, finite out-of-gamut channels, five malformed swatches and all three nonfinite values. Arbitrary linear RGB cannot round-trip losslessly through eight-bit labels.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns every transfer case and invokes portable color source with local arithmetic observers, without installing a consumer, compiling a native artifact, starting a process/browser/GPU or dynamically registering tests.
 */
export function test_math_srgb_linear_transfer(): void {
  const black: IAutoMovieColor = srgbHexToLinearColor("#000000");
  const white: IAutoMovieColor = srgbHexToLinearColor("#ffffff");
  TestValidator.predicate(
    "black decodes to the linear origin",
    equalGeometryTestValues(
      { r: black.r, g: black.g, b: black.b },
      { r: 0, g: 0, b: 0 },
    ),
  );
  TestValidator.predicate(
    "white decodes to exact unity",
    equalGeometryTestValues(
      { r: white.r, g: white.g, b: white.b },
      { r: 1, g: 1, b: 1 },
    ),
  );
  TestValidator.equals(
    "the gamut ends re-encode to themselves",
    [linearColorToSrgbHex(black), linearColorToSrgbHex(white)],
    ["#000000", "#ffffff"],
  );

  // ((0x7d / 255 + 0.055) / 1.055) ** 2.4 and its two siblings, by hand.
  const slate: IAutoMovieColor = srgbHexToLinearColor("#7d828c");
  TestValidator.predicate(
    "the roof swatch decodes to the standard's linear triple",
    nclose(slate.r, 0.20507874, 1e-8) &&
      nclose(slate.g, 0.22322796, 1e-8) &&
      nclose(slate.b, 0.26225066, 1e-8),
  );
  TestValidator.predicate(
    "the transcribed reading is not what the swatch means",
    nclose(0x7d / 255, 0.49019608, 1e-8) &&
      nclose(slate.r, 0.49019608, 1e-8) === false,
  );
  TestValidator.predicate(
    "mid grey is linear 0.2159, not 0.5020",
    nclose(srgbHexToLinearColor("#808080").r, 0.2158605, 1e-8),
  );

  // 10 / 255 = 0.0392157 is below the 0.04045 breakpoint, 11 / 255 = 0.0431373
  // is above it, so one byte apart takes the two different segments.
  TestValidator.predicate(
    "the byte below the breakpoint takes the linear segment",
    nclose(srgbHexToLinearColor("#0a0a0a").r, 10 / 255 / 12.92, 1e-15),
  );
  TestValidator.predicate(
    "the byte above the breakpoint takes the power segment",
    nclose(
      srgbHexToLinearColor("#0b0b0b").r,
      Math.pow((11 / 255 + 0.055) / 1.055, 2.4),
      1e-15,
    ),
  );
  TestValidator.predicate(
    "the two decode segments meet at the breakpoint",
    nclose(0.04045 / 12.92, Math.pow((0.04045 + 0.055) / 1.055, 2.4), 1e-8),
  );

  const grey: (component: number) => Pick<IAutoMovieColor, "r" | "g" | "b"> = (
    component: number,
  ): Pick<IAutoMovieColor, "r" | "g" | "b"> => ({
    r: component,
    g: component,
    b: component,
  });
  // 0.001 * 12.92 * 255 = 3.2946 rounds to 3; the power segment at 0.5 gives
  // 1.055 * 0.5 ** (1 / 2.4) - 0.055 = 0.735357, and * 255 = 187.5 rounds to
  // 188.
  TestValidator.equals(
    "the encode segments produce their hand-computed bytes",
    [linearColorToSrgbHex(grey(0.001)), linearColorToSrgbHex(grey(0.5))],
    ["#030303", "#bcbcbc"],
  );
  TestValidator.equals(
    "the two encode segments meet at the breakpoint",
    [
      linearColorToSrgbHex(grey(0.0031308)),
      linearColorToSrgbHex(grey(0.0031309)),
    ],
    ["#0a0a0a", "#0a0a0a"],
  );

  const digits: string = "0123456789abcdef";
  const byte: (value: number) => string = (value: number): string =>
    `${digits[value >> 4]}${digits[value & 0xf]}`;
  TestValidator.equals(
    "every channel value round-trips exactly",
    Array.from({ length: 256 }, (_: unknown, value: number): string =>
      byte(value),
    ).filter((pair: string): boolean => {
      const swatch: string = `#${pair}${pair}${pair}`;
      return linearColorToSrgbHex(srgbHexToLinearColor(swatch)) !== swatch;
    }),
    [],
  );

  const mixed: IAutoMovieColor = srgbHexToLinearColor("#7D828C");
  TestValidator.equals(
    "the label is re-derived from the triple and normalized",
    mixed.hex,
    "#7d828c",
  );
  TestValidator.predicate(
    "a six-digit swatch is opaque",
    typeof mixed.a === "number" && nclose(mixed.a, 1, 0),
  );

  TestValidator.equals(
    "components outside the gamut clamp to its ends",
    linearColorToSrgbHex({ r: 2, g: -1, b: 0.5 }),
    "#ff00bc",
  );

  TestValidator.equals(
    "a malformed swatch is refused rather than decoded",
    ["7d828c", "#7d828", "#7d828cff", "#gg0000", ""].filter(
      (swatch: string): boolean =>
        throwsError(
          (): IAutoMovieColor => srgbHexToLinearColor(swatch),
          ["is not one opaque six-digit #RRGGBB swatch"],
        ) === false,
    ),
    [],
  );
  TestValidator.equals(
    "a non-finite component is refused rather than clamped",
    [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].filter(
      (component: number): boolean =>
        throwsError(
          (): string => linearColorToSrgbHex(grey(component)),
          ["is not a finite number"],
        ) === false,
    ),
    [],
  );
}
