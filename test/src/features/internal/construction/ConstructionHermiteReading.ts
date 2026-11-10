import {
  AutoMovieViewHermite,
  AutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { nclose } from "../nclose";

/** Independent quintic and strict separate/combined source reading checks, owned by the existing source-lookup question. */
export namespace ConstructionHermiteReading {
  /** Exercise physical scaling, genuine knot jets, exact knots, tangent extensions and nonfinite direct queries without a speed assertion. */
  export function check(failures: string[]): void {
    for (const unit of [0.001, 1, 1000]) {
      const raw: IAutoMovieViewPart.IOutline = {
        knots: [
          { site: "start", station: 0, value: 1, jet: { first: 1, second: 4 } },
          {
            site: "end",
            station: unit,
            value: 2.5,
            jet: { first: 2.5, second: 8 },
          },
        ],
      };
      const source: ReturnType<typeof AutoMovieViewOutline.create> =
        AutoMovieViewOutline.create(raw);
      if ("detail" in source) throw new Error(source.detail);
      if (source.hermite === undefined)
        throw new Error("Requested quintic is absent");
      for (const t of [-1, 0, 0.125, 0.5, 0.875, 1, 2]) {
        const x: number = t * unit;
        const exact: [number, number, number] =
          t < 0
            ? [1 + t, 1, 0]
            : t > 1
              ? [2.5 + 2.5 * (t - 1), 2.5, 0]
              : [
                  1 + t + 2 * t * t - 3 * t ** 3 + t ** 4 + 0.5 * t ** 5,
                  1 + 4 * t - 9 * t * t + 4 * t ** 3 + 2.5 * t ** 4,
                  4 - 18 * t + 12 * t * t + 10 * t ** 3,
                ];
        const at: ReturnType<typeof AutoMovieViewOutline.at> =
          AutoMovieViewOutline.at(source, x);
        if (typeof at === "string" || at.stationJet === null)
          failures.push("Quintic qualified reading absent " + unit + "/" + t);
        else if (
          !(
            nclose(at.value, exact[0], 2e-11) &&
            nclose(at.stationJet[0], exact[1] / unit, 2e-11 / unit) &&
            nclose(
              at.stationJet[1],
              exact[2] / unit / unit,
              2e-11 / unit / unit,
            )
          )
        )
          failures.push("Independent quintic polynomial " + unit + "/" + t);
        same(source.hermite, x, failures);
      }

      // Nonfinite direct arithmetic remains separate from Outline's parameter admission.
      for (const x of [NaN, -Infinity, Infinity])
        same(source.hermite, x, failures);
    }

    // Unequal spans and a signed-zero start distinguish exact knot reads
    // from an extension or the neighbouring interval's rounded polynomial.
    const source: ReturnType<typeof AutoMovieViewOutline.create> =
      AutoMovieViewOutline.create({
        knots: [
          { site: "a", station: -2, value: -0, jet: { first: -3, second: 2 } },
          { site: "b", station: 0.5, value: 7, jet: { first: 2, second: -1 } },
          { site: "c", station: 4, value: -1, jet: { first: 0, second: 3 } },
        ],
      });
    if ("detail" in source) throw new Error(source.detail);
    if (source.hermite === undefined)
      throw new Error("Multi-span quintic is absent");
    for (const x of [-3, -2, -0, 0.5, 0.5000000000000001, 2.25, 4, 5, NaN])
      same(source.hermite, x, failures);
  }
}

/** Separate original APIs remain a strict binary64 oracle for the combined capability, including signed zero and NaN. */
function same(
  curve: AutoMovieViewHermite.ICurve,
  x: number,
  failures: string[],
): void {
  const combined: [number, number, number] = AutoMovieViewHermite.read(
    curve,
    x,
  );
  const value: number = AutoMovieViewHermite.value(curve, x);
  const derivative: [number, number] = AutoMovieViewHermite.derivative(
    curve,
    x,
  );
  if (
    !(
      Object.is(combined[0], value) &&
      Object.is(combined[1], derivative[0]) &&
      Object.is(combined[2], derivative[1])
    )
  )
    failures.push("Combined original quintic arithmetic " + x);
}
