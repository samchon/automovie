import {
  AutoMovieEngineViewJointedCourse,
  AutoMovieEngineViewOutline,
  AutoMovieEngineViewParameter,
  AutoMovieEngineViewSectionField,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieViewPart,
  IAutoMovieViewSectionField,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Reject unrepresentable View source numbers before evaluating their outline,
 * course or section. Preserve finite limits, direction and phase reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names source chart coordinates, axis lengths, section derivatives and outline controls, with admitted and refused cases for each.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual four Engine preparation owners and reads their diagnosed numeric failures and independent finite geometry. Includes nonfinite bounds or values, sparse and nonfinite triples, finite span overflow, and phase wrapping.
 * @evidence contracts/development/testing.md#independent-expectations A 3–4–5 segment has direction [3/5, 4/5, 0]. Station distances 9 and 4 give root 3 and angle π/2 on an 8 mm span. A radius-8 circle with station radius slope 2 and curvature -1 has those same scalar derivatives at its cardinal phase. Two knots at (0,2) and (2,6) give a midpoint of 4 and slope 2.
 */
export function test_engine_geometry_view_source_numeric_admission(): void {
  const problems: string[] = [];
  const check = (name: string, holds: boolean): void => {
    if (!holds) problems.push(name);
  };
  const close = (x: number, y: number): boolean => Math.abs(x - y) <= 1e-12;

  const root: IAutoMovieConstructionOutlineParameter = {
    type: "root",
    end: "bottom",
    pole: 0,
  };
  const angle: IAutoMovieConstructionOutlineParameter = {
    type: "angle",
    bottom: 0,
    top: 8,
  };
  check(
    "identity map at finite station",
    AutoMovieEngineViewParameter.prepare(undefined) === undefined &&
      AutoMovieEngineViewParameter.at(undefined, 4) === 4 &&
      AutoMovieEngineViewParameter.contains(undefined, 4),
  );
  const copied = AutoMovieEngineViewParameter.prepare(root);
  check(
    "copied root map and 9mm roundtrip",
    typeof copied === "object" &&
      copied !== root &&
      AutoMovieEngineViewParameter.at(copied, 9) === 3 &&
      AutoMovieEngineViewParameter.station(copied, 3) === 9,
  );
  check(
    "angular midpoint, end and inverse",
    close(AutoMovieEngineViewParameter.at(angle, 4), Math.PI / 2) &&
      AutoMovieEngineViewParameter.at(angle, 8) === Math.PI &&
      close(AutoMovieEngineViewParameter.station(angle, Math.PI / 2), 4),
  );
  check(
    "top root retains sign and endpoint",
    AutoMovieEngineViewParameter.at({ ...root, end: "top", pole: 9 }, 0) === -3,
  );
  for (const value of [NaN, Infinity, -Infinity]) {
    check(
      "root pole refusal " + value,
      typeof AutoMovieEngineViewParameter.prepare({ ...root, pole: value }) ===
        "string",
    );
    check(
      "angle endpoint refusal " + value,
      typeof AutoMovieEngineViewParameter.prepare({ ...angle, top: value }) ===
        "string" &&
        typeof AutoMovieEngineViewParameter.prepare({
          ...angle,
          bottom: value,
        }) === "string",
    );
    check(
      "nonfinite physical station rejected " + value,
      !AutoMovieEngineViewParameter.contains(undefined, value) &&
        !AutoMovieEngineViewParameter.contains(root, value) &&
        Number.isNaN(AutoMovieEngineViewParameter.at(undefined, value)) &&
        Number.isNaN(AutoMovieEngineViewParameter.at(root, value)),
    );
  }
  check(
    "finite angle endpoints with unrepresentable span",
    typeof AutoMovieEngineViewParameter.prepare({
      ...angle,
      bottom: -Number.MAX_VALUE,
      top: Number.MAX_VALUE,
    }) === "string",
  );

  const straight = AutoMovieEngineViewJointedCourse.prepare(
    [
      [0, 0, 0],
      [3, 4, 0],
    ],
    [],
  );
  check(
    "3-4-5 physical length and direction",
    typeof straight !== "string" &&
      straight.lengths[0] === 5 &&
      close(straight.directions[0]![0], 3 / 5) &&
      close(straight.directions[0]![1], 4 / 5) &&
      straight.directions[0]![2] === 0,
  );
  for (const length of [Number.MIN_VALUE, Number.MAX_VALUE / 4]) {
    const path = AutoMovieEngineViewJointedCourse.prepare(
      [
        [0, 0, 0],
        [length, 0, 0],
      ],
      [],
    );
    check(
      "finite extreme axis length " + length,
      typeof path !== "string" &&
        path.lengths[0] === length &&
        close(path.directions[0]![0], 1),
    );
  }
  for (const end of [
    [Infinity, 0, 0],
    [NaN, 0, 0],
    [Number.MAX_VALUE, Number.MAX_VALUE, 0],
  ] as const) {
    const path = AutoMovieEngineViewJointedCourse.prepare(
      [[0, 0, 0], [...end]],
      [],
    );
    check(
      "unrepresentable centre separation " + end,
      typeof path === "string" && path.includes("centres 0 and 1"),
    );
  }
  const badTurn = AutoMovieEngineViewJointedCourse.prepare(
    [
      [0, 0, 0],
      [20, 0, 0],
      [40, 0, 0],
    ],
    [Infinity],
  );
  check(
    "straight centre still needs a finite authored turn half length",
    typeof badTurn === "string" && badTurn.includes("at centre 1"),
  );
  const tooLong = AutoMovieEngineViewJointedCourse.prepare(
    [
      [0, 0, 0],
      [1e308, 0, 0],
      [1e308, 1e308, 0],
      [0, 1e308, 0],
    ],
    [1, 1],
  );
  check(
    "finite segments can overflow cumulative physical arclength",
    typeof tooLong === "string" && tooLong.includes("arclength"),
  );

  type Jet = IAutoMovieViewSectionField.IStationJet;
  const extents: Jet[] = Array.from({ length: 4 }, () => [8, 2, -1]);
  const shoulders: Jet[] = Array.from({ length: 4 }, () => [
    Math.SQRT2 - 1,
    0,
    0,
  ]);
  const field = AutoMovieEngineViewSectionField.prepare(extents, shoulders);
  check(
    "finite circular station derivatives admitted",
    field.kind === "prepared",
  );
  if (field.kind === "prepared")
    for (const phi of [0, -2 * Math.PI, 2 * Math.PI]) {
      const read = AutoMovieEngineViewSectionField.read(field, phi);
      check(
        "periodic radius and its physical station derivatives " + phi,
        !("kind" in read) && read[0] === 8 && read[1] === 2 && read[3] === -1,
      );
    }
  for (const value of [NaN, Infinity, -Infinity]) {
    const extent = AutoMovieEngineViewSectionField.prepare(
      [extents[0]!, [8, value, -1], ...extents.slice(2)],
      shoulders,
    );
    const shoulder = AutoMovieEngineViewSectionField.prepare(extents, [
      ...shoulders.slice(0, 3),
      [Math.SQRT2 - 1, 0, value],
    ]);
    check(
      "extent derivative refusal at actual quarter 1 " + value,
      extent.kind === "failure" && extent.detail.includes("extent 1"),
    );
    check(
      "shoulder derivative refusal at actual quarter 3 " + value,
      shoulder.kind === "failure" && shoulder.detail.includes("shoulder 3"),
    );
  }
  const sparseExtent = [...extents];
  delete sparseExtent[2];
  try {
    const hole = AutoMovieEngineViewSectionField.prepare(
      sparseExtent,
      shoulders,
    );
    check(
      "sparse extent field refused at its quarter",
      hole.kind === "failure" && hole.detail.includes("extent 2"),
    );
  } catch (error) {
    problems.push("sparse extent threw without an owner diagnostic: " + error);
  }

  const outline: IAutoMovieViewPart.IOutline = {
    knots: [
      { site: "first", station: 0, value: 2 },
      { site: "last", station: 2, value: 6 },
    ],
  };
  const line = AutoMovieEngineViewOutline.create(outline);
  check("finite natural line admitted", !("detail" in line));
  if (!("detail" in line)) {
    const midpoint = AutoMovieEngineViewOutline.at(line, 1);
    const extension = AutoMovieEngineViewOutline.at(line, 3);
    check(
      "finite natural midpoint and first derivative",
      typeof midpoint !== "string" &&
        midpoint.value === 4 &&
        midpoint.stationJet?.[0] === 2,
    );
    check(
      "finite tangent extension and copied knots",
      typeof extension !== "string" &&
        extension.value === 8 &&
        line.knots !== outline.knots &&
        line.knots[0] !== outline.knots[0],
    );
  }
  for (const value of [NaN, Infinity, -Infinity]) {
    const knot = outline.knots[0]!;
    for (const invalid of [
      { ...knot, station: value },
      { ...knot, value },
      { ...knot, jet: { first: value, second: null } },
    ]) {
      const bad = AutoMovieEngineViewOutline.create({
        knots: [invalid, outline.knots[1]!],
      });
      check(
        "named nonfinite knot refusal " + JSON.stringify(invalid),
        "detail" in bad &&
          bad.contract === "outline" &&
          bad.detail.includes("first") &&
          bad.detail.includes("finite"),
      );
    }
  }
  const huge = Number.MAX_VALUE / 4;
  const cubic = AutoMovieEngineViewOutline.create({
    knots: [
      { site: "left", station: 0, value: huge },
      { site: "middle", station: 1, value: -huge },
      { site: "right", station: 2, value: huge },
    ],
  });
  check(
    "overflowed natural coefficients are refused",
    "detail" in cubic &&
      cubic.contract === "outline" &&
      cubic.detail.includes("unrepresentable"),
  );
  TestValidator.equals("finite View source admission", problems, []);
}
