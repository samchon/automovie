import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeDrawSession,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** A draw stays inside its band when the midpoint or width overflows. */
export function test_archetypes_core_draw_interpolation(): void {
  const draw = (minimum: number, maximum: number, seed?: number): number =>
    new AutoMovieArchetypeDrawSession<"length">(
      "beam",
      { length: "m" },
      seed,
    ).dimensions({
      length: AutoMovieArchetypeBand.metres(minimum, maximum, "test interval"),
    }).length;

  const end: number = 2 ** 1023;
  TestValidator.equals(
    "equal finite bounds keep their exact value",
    draw(end, end),
    end,
  );
  TestValidator.equals(
    "same-sign endpoints halve before adding when the sum overflows",
    draw(end, end + end / 2),
    end + end / 4,
  );

  const seed: number = 503;
  // The same dimension's unit-interval draw exposes just its Philox share.
  // A dyadic symmetric band maps the share u to (2u - 1) times its endpoint.
  const share: number = draw(0, 1, seed);
  const expected: number = (2 * share - 1) * end;
  TestValidator.equals(
    "signed band uses both finite endpoints",
    draw(-end, end, seed),
    expected,
  );
}
