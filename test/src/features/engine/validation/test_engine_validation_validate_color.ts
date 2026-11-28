import { AutoMovieEngineViolationCollector, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieColor,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `validateColor` holds each linear channel and a stated alpha to [0, 1], a
 * stated hex label to `#RRGGBB`, and, when the channels are valid, that label
 * to the sRGB encoding of the channels in either case.
 *
 * Scenarios:
 *
 * 1. Mid grey with no alpha or hex, and white labelled `#FFFFFF`, pass.
 * 2. R = 1.5 and a = 2 are range findings at their channels.
 * 3. A label `red` is a type finding at `hex`.
 * 4. White labelled `#000000` contradicts its channels: a type finding at `hex`.
 * 5. With r out of range the label is not compared: only the range finding.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers channel range, optional and uppercase labels, malformed or contradictory swatches and dependent-validation order.
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateColor on literal linear colors and collects the kind and path of each finding.
 * @evidence contracts/development/testing.md#independent-expectations White encodes white irrespective of hex letter case. The malformed word cannot be a six-digit swatch, black contradicts white, and an invalid numeric triple does not supply a comparison swatch.
 */
export function test_engine_validation_validate_color(): void {
  const findings = (color: IAutoMovieColor): string[][] => {
    const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
    AutoMovieEngineValidation.validateColor(color, "$c", collector);
    return collector.items.map(
      (item: IAutoMovieConstraintViolation): string[] => [item.kind, item.path],
    );
  };
  const white: IAutoMovieColor = { r: 1, g: 1, b: 1, a: null, hex: null };
  TestValidator.equals(
    "each color's findings",
    [
      findings({ r: 0.5, g: 0.5, b: 0.5, a: null, hex: null }),
      findings({ ...white, hex: "#FFFFFF" }),
      findings({ ...white, r: 1.5, a: 2 }),
      findings({ ...white, hex: "red" }),
      findings({ ...white, hex: "#000000" }),
      findings({ ...white, r: 1.5, hex: "#000000" }),
    ],
    [
      [],
      [],
      [
        ["range", "$c.r"],
        ["range", "$c.a"],
      ],
      [["type", "$c.hex"]],
      [["type", "$c.hex"]],
      [["range", "$c.r"]],
    ],
  );
}
