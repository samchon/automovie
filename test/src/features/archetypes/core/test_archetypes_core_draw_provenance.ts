import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeDrawSession,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * An explicitly derived dimension replaces its earlier band or catalogue
 * figure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two replaced fields, the unchanged model selection and the surviving sources of other dimensions.
 * @evidence contracts/development/testing.md#behavioral-verification Uses real band, catalogue and derived dimension readers in one public draw session. Compares actual values and the complete provenance maps after recording both replacements.
 * @evidence contracts/development/testing.md#independent-expectations The fixture keeps length in a one-to-two metre band and depth at the catalogue's 0.4 metres. Literal replacements are 1.25 metres wide and 3 kilograms. Each one keeps only its original unit while the separately selected catalogue name remains recorded.
 */
export function test_archetypes_core_draw_provenance(): void {
  const draw = new AutoMovieArchetypeDrawSession(
    "cabinet",
    { width: "m", length: "m", mass: "kg", depth: "m" },
    undefined,
  );
  const band = AutoMovieArchetypeBand.metres(1, 2, "fixture");
  draw.dimensions({ width: band, length: band });
  draw.model("size", "case", { case: { mass: 2, depth: 0.4 } });

  draw.derive("width", 1.25);
  draw.derive("mass", 3);

  TestValidator.equals(
    "the derived values replace the original scalars",
    draw.values,
    {
      width: 1.25,
      length: 1.5,
      mass: 3,
      depth: 0.4,
    },
  );
  TestValidator.equals(
    "only the current source of each dimension is recorded",
    draw.provenance,
    {
      bands: { length: band },
      models: { size: "case" },
      figures: { depth: "size" },
      units: { width: "m", length: "m", mass: "kg", depth: "m" },
    },
  );
}
