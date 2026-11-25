import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
} from "@automovie/engine";
import type {
  IAutoMovieLoftSectionConnect,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftSectionPhase,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanMammaryChart } from "./AutoMovieHumanMammaryChart";
import { AutoMovieHumanMammaryPlacement } from "./AutoMovieHumanMammaryPlacement";

/**
 * The anterior thorax owns the entire breast-bearing section and its
 * derivatives.
 */
export namespace AutoMovieHumanMammarySkin {
  /** Publish the two projecting areas as original sections of a single trunk. */
  export function of(
    host: IAutoMovieViewPart,
    plan: AutoMovieHumanMammaryPlacement.IPrepared,
    y: number,
  ): IAutoMovieViewPart {
    const admitted = AutoMovieLoftViewSource.create(host);
    if (
      admitted?.source === null ||
      admitted?.source === undefined ||
      host.originalSection !== undefined
    )
      throw new Error(
        "the mammary graph needs the unchanged trunk's original level sections",
      );
    const read = AutoMovieLoftViewRead.prepare(admitted.source);
    const values = (at: number) => {
      const result = read.values(at);
      if (typeof result === "string") throw new Error(result);
      return result;
    };
    const frame = (at: number) => {
      const original = host.axis.jet?.(at);
      if (original === null || original === undefined)
        throw new Error("the mammary graph needs the original level frame jet");
      const { u, v, origin } = original.value;
      if (u[0] !== 1 || v[2] !== 1 || origin[1] !== at)
        throw new Error(
          "the mammary graph needs the exact world-level trunk frame",
        );
      return original;
    };
    const origin = frame(y).value.origin;
    const cut = AutoMovieLoftSectionNative.point(values(y));
    const charts: AutoMovieHumanMammaryChart.IChart[] = plan.section(
      (phase) => {
        const p = cut(phase);
        return [origin[0] + p[0], origin[2] + p[1]];
      },
    );
    const pointAt = (station: number) => {
      const origin = host.axis.at(station).origin;
      const bare = AutoMovieLoftSectionNative.point(values(station));
      const lifts = charts.map((chart) => chart.pointAt(station));
      return (phase: number): [number, number] => {
        const p = bare(phase);
        const x = origin[0] + p[0];
        const projected = lifts.reduce((value, lift) => lift(phase, value), x);
        return projected === x ? p : [p[0] + (projected - x), p[1]];
      };
    };
    const phaseAt = (
      station: number,
      phase: number,
    ): IAutoMovieLoftSectionPhase => {
      const raw = AutoMovieLoftSectionNative.phase(values(station))(phase);
      const x = host.axis.at(station).origin[0];
      for (const chart of charts) {
        const h = chart.offset(station, phase, [
          x + raw.p[0],
          0,
          raw.t[0],
          0,
          0,
          raw.tt[0],
        ]);
        if (h !== null) {
          raw.p[0] += h[0];
          raw.t[0] += h[2];
          raw.tt[0] += h[5];
        }
      }
      return raw;
    };
    const jetAt = (station: number) => {
      const coefficients = read.jets(station);
      if (typeof coefficients === "string") throw new Error(coefficients);
      const native = AutoMovieLoftSectionNative.jet(coefficients);
      const axis = frame(station);
      return (phase: number): IAutoMovieLoftSectionJet => {
        const p = native(phase);
        for (const chart of charts) {
          const h = chart.offset(station, phase, [
            axis.value.origin[0] + p.p[0],
            axis.first.origin[0] + p.s[0],
            p.t[0],
            axis.second.origin[0] + p.ss[0],
            p.st[0],
            p.tt[0],
          ]);
          if (h !== null) {
            p.p[0] += h[0];
            p.s[0] += h[1];
            p.t[0] += h[2];
            p.ss[0] += h[3];
            p.st[0] += h[4];
            p.tt[0] += h[5];
          }
        }
        return p;
      };
    };
    const originalSection: IAutoMovieLoftSectionConnect.IOriginal = {
      name: `${host.name}.mammary`,
      domain: plan.domain,
      interior: true,
      point: (s, t) => pointAt(s)(t),
      pointAt,
      phase: phaseAt,
      jet: (s, t) => jetAt(s)(t),
      jetAt,
    };
    return { ...host, originalSection };
  }
}
