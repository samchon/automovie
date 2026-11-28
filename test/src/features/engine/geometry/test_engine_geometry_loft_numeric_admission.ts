import {
  AutoMovieEngineConstruction,
  AutoMovieEngineLoftAdmissionError,
  AutoMovieEngineLoftContract,
} from "@automovie/engine";
import type { IAutoMovieLoftWorldJetLocal } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Admit physical stations and three-dimensional ring coordinates before using
 * their ordered gaps and projected area. World placement evaluates the full
 * frame product rule and keeps numeric, overflow and foreign getter failures
 * observable at their respective boundaries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names borrowed valid geometry, analytic world derivatives, nonfinite inputs and failure precedence.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real station and ring checks and the public world-jet placement. Exercises nonfinite stations on either side, an otherwise valid projection with invalid height, each local partial, finite overflow and a later required getter.
 * @evidence contracts/development/testing.md#independent-expectations Three vertices form a right triangle in X/Z whatever their finite heights. The world derivatives follow from separately chosen axis motions and local coefficients, including the two first-derivative products in world ss and st.
 */
export function test_engine_geometry_loft_numeric_admission(): void {
  const stations: number[] = [-2, 0, 2];
  TestValidator.predicate(
    "a finite sequence on the exact minimum rise is borrowed",
    AutoMovieEngineLoftContract.stations("loft", stations, 2) === stations,
  );
  for (const [values, least, reason] of [
    [[0, Infinity], 2, "layer 1 has nonfinite station"],
    [[-Infinity, 0], 2, "layer 0 has nonfinite station"],
    [[NaN, 2], 2, "layer 0 has nonfinite station"],
    [[0, 2], Infinity, "positive finite least step"],
    [[0, 1], 2, "must rise by at least 2 mm"],
  ] as const)
    TestValidator.predicate(
      "station check identifies " + reason,
      throwsError(
        () => AutoMovieEngineLoftContract.stations("loft", values, least),
        ["loft", reason],
      ),
    );

  const ring: [number, number, number][] = [
    [0, 2, 0],
    [1, -1, 0],
    [0, 3, 1],
  ];
  TestValidator.predicate(
    "finite elevation does not affect the right triangle's horizontal area",
    AutoMovieEngineLoftContract.ring("loft", 4, ring) === ring,
  );
  for (const axis of [0, 1, 2] as const)
    for (const coordinate of [NaN, Infinity, -Infinity]) {
      const point: [number, number, number] = [...ring[0]!];
      point[axis] = coordinate;
      TestValidator.predicate(
        "world ring coordinate " + axis + " rejects " + coordinate,
        throwsError(
          () =>
            AutoMovieEngineLoftContract.ring("loft", 4, [
              point,
              ...ring.slice(1),
            ]),
          ["layer 4", "point 0", "finite world coordinates"],
        ),
      );
    }

  const local: IAutoMovieLoftWorldJetLocal = {
    p: [2, 3],
    s: [5, 7],
    t: [17, 19],
    ss: [11, 13],
    st: [23, 29],
    tt: [31, 37],
  };
  const frame: number[][] = [
    [10, 20, 30, 1, 0, 0, 0, 0, 1],
    [1, 2, 3, 0, 2, 0, 0, 3, 0],
    [4, 5, 6, 0, 0, 5, 7, 0, 0],
  ];
  const world = AutoMovieEngineConstruction.loftWorldJet(local, frame);
  TestValidator.equals("world p, s, t, ss, st and tt", world, {
    p: [12, 20, 33],
    s: [6, 15, 10],
    t: [17, 0, 19],
    ss: [36, 67, 29],
    st: [23, 91, 29],
    tt: [31, 0, 37],
  });
  for (const key of ["p", "s", "t", "ss", "st", "tt"] as const) {
    let error: unknown;
    try {
      AutoMovieEngineConstruction.loftWorldJet(
        { ...local, [key]: [NaN, local[key][1]] },
        frame,
      );
    } catch (caught) {
      error = caught;
    }
    TestValidator.predicate(
      "local " + key + " NaN uses the numeric admission error",
      error instanceof AutoMovieEngineLoftAdmissionError &&
        error.message.includes("nonfinite coordinate or derivative"),
    );
  }

  const scaled: number[][] = frame.map((row) => [...row]);
  scaled[0]![3] = 2;
  TestValidator.predicate(
    "finite multiplication overflow remains distinct even with an earlier NaN result",
    throwsError(
      () =>
        AutoMovieEngineConstruction.loftWorldJet(
          { ...local, p: [NaN, 3], t: [Number.MAX_VALUE, 19] },
          scaled,
        ),
      "The world total2 overflows binary64.",
    ),
  );

  const marker: Error = new Error("second phase component getter");
  const tangent: [number, number] = [...local.t];
  Object.defineProperty(tangent, 1, {
    get(): never {
      throw marker;
    },
  });
  let seen: unknown;
  try {
    AutoMovieEngineConstruction.loftWorldJet(
      { ...local, p: [NaN, 3], t: tangent },
      frame,
    );
  } catch (caught) {
    seen = caught;
  }
  TestValidator.predicate(
    "a required getter retains its exact error",
    seen === marker,
  );
}
