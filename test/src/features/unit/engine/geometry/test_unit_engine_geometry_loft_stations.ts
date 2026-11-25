import {
  AutoMovieLoftChain,
  AutoMovieLoftStations,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type { IAutoMovieLoftChain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionShapes } from "../../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * `AutoMovieLoftStations.bisect` keeps every flat band within its tolerance:
 * every principal layer is a station, and between two consecutive stations the
 * section at their midpoint departs from the average of their end rings by at
 * most the tolerance.
 *
 * Fixture: the chain of an ellipsoid of half axes 0.03, 0.02 and 0.05 m
 * (realized without its skin), read at 48 probe phases; its curvature keeps
 * every interval far from the recursion's depth bound.
 *
 * Scenarios:
 *
 * 1. At 0.1 and 0.01 mm every layer is a station and every interval's band rule
 *    holds.
 * 2. The 0.01 mm stations with every other interior station dropped leave an
 *    interval past 0.01 mm.
 */
export function test_unit_engine_geometry_loft_stations(): void {
  const chain: IAutoMovieLoftChain = realizeAutoMovieConstruction(
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
    { chord: 1e-4, skin: false },
  ).chains[0]!;
  const first: number = chain.layers[0]!.y;
  const last: number = chain.layers[chain.layers.length - 1]!.y;
  const probes: number[] = Array.from(
    { length: 48 },
    (_: unknown, i: number): number => (2 * Math.PI * i) / 48,
  );
  // The worst midpoint departure from the straight band over each interval, mm.
  const departures = (stations: readonly number[]): number[] =>
    stations.slice(1).map((b: number, i: number): number => {
      const a: number = stations[i]!;
      const ra: V3[] = AutoMovieLoftChain.ring(chain, a, probes);
      const rb: V3[] = AutoMovieLoftChain.ring(chain, b, probes);
      return Math.max(
        ...AutoMovieLoftChain.ring(chain, (a + b) / 2, probes).map(
          (p: V3, k: number): number =>
            Math.hypot(
              p[0] - (ra[k]![0] + rb[k]![0]) / 2,
              p[1] - (ra[k]![1] + rb[k]![1]) / 2,
              p[2] - (ra[k]![2] + rb[k]![2]) / 2,
            ),
        ),
      );
    });

  // 1.
  for (const tolerance of [0.1, 0.01]) {
    const stations: number[] = AutoMovieLoftStations.bisect(
      chain,
      first,
      last,
      tolerance,
    );
    TestValidator.equals(
      `${tolerance} layers are stations`,
      chain.layers
        .map((l: IAutoMovieLoftChain.ILayer): number => l.y)
        .filter((y: number): boolean => !stations.includes(y)),
      [],
    );
    TestValidator.predicate(
      `${tolerance} bands`,
      departures(stations).every((d: number): boolean => d <= tolerance),
    );
  }

  // 2.
  const fine: number[] = AutoMovieLoftStations.bisect(chain, first, last, 0.01);
  TestValidator.predicate(
    "thinned stations leave a band",
    departures(
      fine.filter(
        (_: number, i: number): boolean =>
          i === 0 || i === fine.length - 1 || i % 2 === 0,
      ),
    ).some((d: number): boolean => d > 0.01),
  );
}
