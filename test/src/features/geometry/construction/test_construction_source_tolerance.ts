import {
  AutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type {
  AutoMovieConstructionOutlineParameter,
  IAutoMovieConstructionOutlineRange,
} from "@automovie/interface";

/**
 * Source admission accepts a floating-point excess within the shared relative construction tolerance (5e-3 of the outline's own extent) and still refuses a real excess.
 *
 * Scenarios:
 * 1. Range: a knot 0.1 past its declared maximum 100 (allowance 5e-3 x 100.1 = 0.5) is admitted; a knot 1 past it is refused naming the declared range.
 * 2. Pole: a closing knot of -3.55e-15 at the finite top pole is admitted and reads exactly 0 there; a closing knot of 0.5 against values of 10 (allowance 0.05) is refused as a pole knot.
 * 3. Station: on the angle map over [0, 4] (allowance 0.02), station 4.004 reads as the endpoint 4; station 4.1 stays an explicit outside-domain failure.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual AutoMovieViewOutline.create admission and AutoMovieViewOutline.at reading the Human head guides go through.
 * @evidence contracts/development/testing.md#independent-expectations Allowances are the stated fraction times each outline's largest value or span, computed by hand; the endpoint reading is compared with the same source read exactly at the endpoint.
 * @evidence contracts/development/testing.md#distinguishing-cases Each boundary has an admitted case inside the allowance and a refused case beyond it, so an exact check and an unbounded tolerance both fail.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU unit through --include construction_source_tolerance; synthetic three-knot sources start no Human generation, viewer or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Range: a knot 0.1 past its declared maximum 100 is admitted and a knot 1 past it is refused).
 */
export function test_construction_source_tolerance(): void {
  const failures: string[] = [];
  const range: IAutoMovieConstructionOutlineRange = {
    minimum: 0,
    maximum: 100,
  };
  const admitted = (
    label: string,
    created: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure,
  ): AutoMovieViewOutline.IOutline | undefined => {
    if ("detail" in created)
      failures.push(`${label} refused: ${created.detail}`);
    else return created;
    return undefined;
  };
  const refused = (
    label: string,
    created: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure,
    contract: string,
    text: string,
  ): void => {
    if (!("detail" in created)) failures.push(`${label} was admitted`);
    else if (created.contract !== contract || !created.detail.includes(text))
      failures.push(
        `${label} refused for another reason: ${created.contract}: ${created.detail}`,
      );
  };

  admitted(
    "range overshoot 0.1",
    AutoMovieViewOutline.create({
      ...outline([0, 1, 2], [0, 50, 100.1]),
      range,
    }),
  );
  refused(
    "range overshoot 1",
    AutoMovieViewOutline.create({ ...outline([0, 1, 2], [0, 50, 101]), range }),
    "outline",
    "outside its declared range",
  );

  const pole: AutoMovieViewOutline.IOutline | undefined = admitted(
    "pole knot -3.55e-15",
    AutoMovieViewOutline.create(
      outline([0, 1, 2], [5, 10, -3.552713678800501e-15]),
      { top: 2 },
    ),
  );
  if (pole !== undefined) {
    const tip: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(
      pole,
      2,
    );
    if (typeof tip === "string" || tip.value !== 0)
      failures.push(
        `pole knot does not read exactly 0: ${typeof tip === "string" ? tip : tip.value}`,
      );
  }
  refused(
    "pole knot 0.5",
    AutoMovieViewOutline.create(outline([0, 1, 2], [5, 10, 0.5]), { top: 2 }),
    "pole knot",
    "is not 0 at the finite pole station",
  );

  const angle: AutoMovieViewOutline.IOutline | undefined = admitted(
    "angle source",
    AutoMovieViewOutline.create(
      outline([0, 2, 4], [10, 11, 10], { type: "angle", bottom: 0, top: 4 }),
    ),
  );
  if (angle !== undefined) {
    const end: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(
      angle,
      4,
    );
    const near: AutoMovieViewOutline.IReading | string =
      AutoMovieViewOutline.at(angle, 4.004);
    if (
      typeof end === "string" ||
      typeof near === "string" ||
      near.value !== end.value ||
      near.parameter !== end.parameter
    )
      failures.push(
        `station 4.004 does not read as the endpoint: ${typeof near === "string" ? near : near.value}`,
      );
    const far: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(
      angle,
      4.1,
    );
    if (
      typeof far !== "string" ||
      !far.includes("not finite inside the source parameter domain")
    )
      failures.push(`station 4.1 was admitted outside the domain`);
  }

  if (failures.length !== 0)
    throw new Error(`construction source tolerance:\n${failures.join("\n")}`);
}

/** A three-knot outline with generated site names and an optional parameter map. */
function outline(
  stations: readonly number[],
  values: readonly number[],
  parameter?: AutoMovieConstructionOutlineParameter,
): IAutoMovieViewPart.IOutline {
  return {
    knots: stations.map(
      (station: number, i: number): IAutoMovieViewPart.IKnot => ({
        site: `source.${i}`,
        station,
        value: values[i]!,
      }),
    ),
    ...(parameter === undefined ? {} : { parameter }),
  };
}
