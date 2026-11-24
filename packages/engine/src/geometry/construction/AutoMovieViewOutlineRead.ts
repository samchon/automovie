import type { IAutoMovieViewOutline } from "@automovie/interface";

import { AutoMovieNaturalSpline } from "./AutoMovieNaturalSpline";
import { AutoMovieViewHermite } from "./AutoMovieViewHermite";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";

/** Value and qualified scalar jets of an already admitted original outline. */
export namespace AutoMovieViewOutlineRead {
  /** Scalar value without derivative work or a qualified-reading allocation. */
  export function value(
    outline: IAutoMovieViewOutline.IOutline,
    station: number,
  ): number | string {
    const x: number = AutoMovieViewParameter.at(outline.parameter, station);
    const y: number = valueAt(outline, station, x);
    return y;
  }

  /**
   * Original value, parameter jets and explicitly available physical station
   * jets.
   */
  export function at(
    outline: IAutoMovieViewOutline.IOutline,
    station: number,
  ): IAutoMovieViewOutline.IReading | string {
    const { bottom, top }: IAutoMovieViewOutline.IEnds = outline.ends;
    const x: number = AutoMovieViewParameter.at(outline.parameter, station);
    const pole: boolean = station === bottom || station === top;
    const polynomial: [number, number, number] | null = pole
      ? null
      : outline.hermite === undefined
        ? AutoMovieNaturalSpline.read(outline.spline, x)
        : AutoMovieViewHermite.read(outline.hermite, x);
    const value: number =
      polynomial === null ? valueAt(outline, station, x) : polynomial[0];
    const jet: [number, number] =
      polynomial !== null
        ? [polynomial[1], polynomial[2]]
        : outline.hermite === undefined
          ? AutoMovieNaturalSpline.derivative(outline.spline, x)
          : AutoMovieViewHermite.derivative(outline.hermite, x);
    const change: [number, number] | null = AutoMovieViewParameter.jet(
      outline.parameter,
      station,
    );
    let stationJet: [number, number] | null = null;
    let stationJetStatus: IAutoMovieViewOutline.IReading["stationJetStatus"] =
      pole ? "singular-pole" : "singular-parameter";
    if (change !== null && !pole) {
      stationJet = [
        jet[0] * change[0],
        jet[1] * change[0] * change[0] + jet[0] * change[1],
      ];
      stationJetStatus = "regular";
    }
    const [lo, hi]: readonly [number, number] = outline.domain;
    return {
      station,
      parameter: x,
      value,
      parameterJet: jet,
      stationJet,
      stationJetStatus,
      location: pole
        ? "pole"
        : change === null
          ? "parameter-endpoint"
          : station < lo || station > hi
            ? "extension"
            : station === lo || station === hi
              ? "endpoint"
              : "interior",
    };
  }

  /**
   * Preserve exact pole zeros and the admitted parameter's original polynomial
   * value.
   */
  function valueAt(
    outline: IAutoMovieViewOutline.IOutline,
    station: number,
    x: number,
  ): number {
    return station === outline.ends.bottom || station === outline.ends.top
      ? 0
      : outline.hermite === undefined
        ? AutoMovieNaturalSpline.evaluate(outline.spline, x)
        : AutoMovieViewHermite.value(outline.hermite, x);
  }
}
