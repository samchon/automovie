import { AutoMovieViewOutline } from "@automovie/engine";
import type {
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieConstructionOutlineRange,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

type Created = IAutoMovieViewOutline.IResult;

/**
 * `AutoMovieViewOutline.create` and `at` admit a floating-point excess within
 * the shared relative construction tolerance, 5e-3 of the outline's own extent,
 * and refuse a real excess.
 *
 * Scenarios:
 *
 * 1. Range [0, 100]: a knot of 100.1 (allowance 5e-3 x 100.1 = 0.5) is admitted;
 *    one of 101 is refused by `outline`, "outside its declared range".
 * 2. Finite top pole at station 2: a closing knot of -3.55e-15 is admitted and
 *    reads exactly 0 there; one of 0.5 against values of 10 (allowance 0.05) is
 *    refused by `pole knot`, "is not 0 at the finite pole station".
 * 3. Angle map over [0, 4] (allowance 0.02): station 4.004 reads the endpoint's
 *    value and parameter; station 4.1 is "not finite inside the source
 *    parameter domain".
 */
export function test_unit_engine_geometry_view_outline_tolerance(): void {
  const outline = (
    values: readonly number[],
    parameter?: IAutoMovieConstructionOutlineParameter,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [0, 1, 2].map(
      (i: number): IAutoMovieViewPart.IKnot => ({
        site: `source.${i}`,
        station: parameter === undefined ? i : 2 * i,
        value: values[i]!,
      }),
    ),
    ...(parameter === undefined ? {} : { parameter }),
  });
  const admitted = (
    label: string,
    created: Created,
  ): IAutoMovieViewOutline.IOutline => {
    if ("detail" in created) throw new Error(`${label}: ${created.detail}`);
    return created;
  };
  const refused = (
    label: string,
    created: Created,
    contract: string,
    text: string,
  ): void =>
    TestValidator.predicate(
      label,
      "detail" in created &&
        created.contract === contract &&
        created.detail.includes(text),
    );
  const read = (
    source: IAutoMovieViewOutline.IOutline,
    station: number,
  ): IAutoMovieViewOutline.IReading => {
    const reading: IAutoMovieViewOutline.IReading | string =
      AutoMovieViewOutline.at(source, station);
    if (typeof reading === "string") throw new Error(reading);
    return reading;
  };
  const range: IAutoMovieConstructionOutlineRange = {
    minimum: 0,
    maximum: 100,
  };

  // 1.
  admitted(
    "range 100.1",
    AutoMovieViewOutline.create({ ...outline([0, 50, 100.1]), range }),
  );
  refused(
    "range 101",
    AutoMovieViewOutline.create({ ...outline([0, 50, 101]), range }),
    "outline",
    "outside its declared range",
  );

  // 2.
  const pole: IAutoMovieViewOutline.IOutline = admitted(
    "pole -3.55e-15",
    AutoMovieViewOutline.create(outline([5, 10, -3.552713678800501e-15]), {
      top: 2,
    }),
  );
  TestValidator.equals("pole reads 0", read(pole, 2).value, 0);
  refused(
    "pole 0.5",
    AutoMovieViewOutline.create(outline([5, 10, 0.5]), { top: 2 }),
    "pole knot",
    "is not 0 at the finite pole station",
  );

  // 3.
  const angle: IAutoMovieViewOutline.IOutline = admitted(
    "angle",
    AutoMovieViewOutline.create(
      outline([10, 11, 10], { type: "angle", bottom: 0, top: 4 }),
    ),
  );
  const end: IAutoMovieViewOutline.IReading = read(angle, 4);
  const near: IAutoMovieViewOutline.IReading = read(angle, 4.004);
  TestValidator.equals(
    "4.004 reads the endpoint",
    [near.value, near.parameter],
    [end.value, end.parameter],
  );
  const far: IAutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(
    angle,
    4.1,
  );
  TestValidator.predicate(
    "4.1 outside the domain",
    typeof far === "string" &&
      far.includes("not finite inside the source parameter domain"),
  );
}
