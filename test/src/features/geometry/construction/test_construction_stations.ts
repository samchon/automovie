import {
  type AutoMovieConstructionRealization,
  AutoMovieLoftChain,
  AutoMovieLoftStations,
  type IAutoMovieLoftChain,
  realizeAutoMovieConstruction,
} from "@automovie/engine";

import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A face's tessellation stations keep every flat band within the chord tolerance of its sections: between two consecutive stations the section at their midpoint departs from the straight band between them by no more than the tolerance, and every principal layer is a station.
 *
 * Scenarios:
 * 1. An ellipsoid of half axes 0.03, 0.02 and 0.05 m, its chain bisected to 0.1 mm and to 0.01 mm: every principal layer is a station, and at every interval the midpoint ring stands within the tolerance of the average of its end rings at 48 probe phases.
 * 2. Red: the 0.01 mm stations with every other interior station dropped leave an interval past that tolerance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the part, reads its chain, and calls `AutoMovieLoftStations.bisect` at two tolerances, reading each interval's midpoint ring against its end rings through `AutoMovieLoftChain.ring`. It catches a station list that skips a layer, stops refining before its tolerance, or leaves an interval it never examined; any bisection that meets the band rule passes.
 * @evidence contracts/development/testing.md#independent-expectations The stations' document (`AutoMovieLoftStations`): every principal layer is a mark, and an interval is split while its midpoint section departs from the straight band by more than the tolerance at any probe phase. The band rule is read here directly at 48 phases, with the rings from the chain's own reader, since the property is the band's departure from the chain's surface. The ellipsoid's curvature keeps every interval far from the recursion's depth bound at these tolerances.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: two tolerances ten times apart. Negative: the finer list thinned. The skin's sharing of boundaries belongs to `test_construction_operator_mesh` and `test_construction_operator_body`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_stations`; it realizes a made tree in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: An ellipsoid of half axes 0.03, 0.02 and 0.05 m, its chain bisected to 0.1 mm and to 0.01 mm: every principal layer is a station, and at...).
 */
export function test_construction_stations(): void {
  const failures: string[] = [];
  const real: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction(
      {
        name: "made",
        root: ConstructionShapes.ellipsoid(
          "egg",
          ConstructionShapes.DOWN,
          0.03,
          0.02,
          0.05,
        ),
      },
      { chord: 1e-4 },
    );
  const chain: IAutoMovieLoftChain = real.chains[0]!;
  const first: number = chain.layers[0]!.y;
  const last: number = chain.layers[chain.layers.length - 1]!.y;
  const probes: number[] = Array.from(
    { length: 48 },
    (_: unknown, i: number): number => (2 * Math.PI * i) / 48,
  );
  const band: (stations: readonly number[], tolerance: number) => string[] = (
    stations: readonly number[],
    tolerance: number,
  ): string[] => {
    const out: string[] = [];
    for (let i: number = 0; i + 1 < stations.length; i++) {
      const a: number = stations[i]!;
      const b: number = stations[i + 1]!;
      const ra: V3[] = AutoMovieLoftChain.ring(chain, a, probes);
      const rb: V3[] = AutoMovieLoftChain.ring(chain, b, probes);
      const rm: V3[] = AutoMovieLoftChain.ring(chain, (a + b) / 2, probes);
      const worst: number = Math.max(
        ...rm.map((p: V3, k: number): number =>
          Math.hypot(
            p[0] - (ra[k]![0] + rb[k]![0]) / 2,
            p[1] - (ra[k]![1] + rb[k]![1]) / 2,
            p[2] - (ra[k]![2] + rb[k]![2]) / 2,
          ),
        ),
      );
      if (!(worst <= tolerance))
        out.push(
          `interval ${a} to ${b} mm departs ${worst} mm from its band, over ${tolerance} mm`,
        );
    }
    return out;
  };
  for (const tolerance of [0.1, 0.01]) {
    const stations: number[] = AutoMovieLoftStations.bisect(
      chain,
      first,
      last,
      tolerance,
    );
    for (const l of chain.layers)
      if (!stations.includes(l.y))
        failures.push(`at ${tolerance} mm: layer ${l.y} mm is not a station`);
    failures.push(
      ...band(stations, tolerance).map(
        (f: string): string => `at ${tolerance} mm: ${f}`,
      ),
    );
  }
  const fine: number[] = AutoMovieLoftStations.bisect(chain, first, last, 0.01);
  const thinned: number[] = fine.filter(
    (_: number, i: number): boolean =>
      i === 0 || i === fine.length - 1 || i % 2 === 0,
  );
  if (band(thinned, 0.01).length === 0)
    failures.push("proof: the thinned stations keep every band within 0.01 mm");
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} station failures:\n${failures.join("\n")}`,
    );
}
