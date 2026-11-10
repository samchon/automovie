import {
  AutoMovieLoftChain,
  AutoMovieLoftCoefficientSource,
  AutoMovieLoftJet,
  AutoMovieStationHermite,
  AutoMovieViewAxis,
  AutoMovieViewLoft,
  AutoMovieViewSection,
  type IAutoMovieLoftChain,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A layer whose explicit interpolation data is visible to the test's copy/invalid-input scenarios. */
type Layer = IAutoMovieLoftChain.ILayer & {
  coefficientSource?: AutoMovieLoftCoefficientSource.ISource;
};

/**
 * Capped coefficient data retains its root/angle definition and honest singular station boundary.
 *
 * Scenarios:
 * 1. A bottom-root and top-root family have radius sqrt(distance) in their dimensionless physical station. Their values and both station derivatives are read before/between/at principal layers at three congruent scales, including virtual-pole spans.
 * 2. A two-pole family uses the independent three-knot natural cubic 3q/pi-4q^3/pi^3 on the first angle half, mirrored on the second. Added exact samples must retain that polynomial and its physical chain-rule jets.
 * 3. Pole values stay zero while physical derivative requests fail explicitly. Open/outside ends remain unowned, equal-value copies preserve the definition, missing/different maps are station boundaries, and invalid present derivative widths throw.
 * 4. The public ViewLoft producer consumes the same root/angle radial sources. Its actual Point and Jet readers reproduce the independent guide radius and both station derivatives inside the principal regular interval. Retained original caps own the complete authored endpoint domain; their axis-centred pole Point0 remains distinct from unavailable regular physical2.
 * 5. A made 0.01-scale coefficient displacement fails the same independent numeric reader.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises parameter-data producer and endpoint/weight consumers on prescribed coefficient arrays, then actual ViewLoft Point/Jet readers. Asserts values, both physical derivatives in the principal regular interval, complete authored cap ownership, true pole Point0 and explicit singular/invalid behavior.
 * @evidence contracts/development/testing.md#independent-expectations Closed-form root radii and an explicit angle cubic provide independent values/derivatives; direct control rows are prescribed cosine/sine multiples. The public producer receives those radial source knots and a constant ellipse shoulder; guide phase zero must read the same radius. Limits are 512 binary64 epsilons times the natural geometric/derivative scale, allowing only floating interpolation arithmetic. The observer rejects a deliberately displaced value. This does not establish exact fidelity of arbitrary source sections or geometric G2 at a true pole.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers bottom/top/both poles, virtual and interior spans, scales 0.001/1/1000, zero pole versus singular station jet, open/outside ownership, value copies, mixed maps and malformed present metadata. Existing diff/axes and view-pole tests retain their unchanged actual-realization expectations.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU operator test through --include construction_operator_pole_coefficients; it starts no process, Human generation, viewer or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A bottom-root and top-root family have radius sqrt(distance) in their dimensionless physical station. Their values and both station...).
 */
export function test_construction_operator_pole_coefficients(): void {
  const failures: string[] = [];
  for (const scale of [0.001, 1, 1000])
    for (const mode of ["bottom", "top", "both"] as const) {
      const parameter: AutoMovieConstructionOutlineParameter =
        mode === "both"
          ? { type: "angle", bottom: 0, top: 4 * scale }
          : {
              type: "root",
              end: mode,
              pole: mode === "bottom" ? 0 : 9 * scale,
            };
      const stations: number[] = (
        mode === "bottom" ? [1, 4, 9] : mode === "top" ? [0, 5, 8] : [1, 2, 3]
      ).map((value: number): number => value * scale);
      const raw: IAutoMovieLoftChain = made(stations, scale, mode);
      const prepared: IAutoMovieLoftChain | string =
        AutoMovieLoftCoefficientSource.prepare(raw, parameter);
      if (typeof prepared === "string") {
        failures.push(prepared);
        continue;
      }
      const samples: number[] = (
        mode === "bottom"
          ? [0, 0.0625, 1, 2.25, 4, 6.25, 9]
          : mode === "top"
            ? [0, 2.75, 5, 6.75, 8, 8.9375, 9]
            : [0, 0.01, 0.5, 1, 1.5, 2, 2.5, 3, 3.99, 4]
      ).map((value: number): number => value * scale);
      for (const station of samples) {
        const controls: AutoMovieLoftCoefficientSource.IControls | null =
          AutoMovieLoftCoefficientSource.controls(prepared, station);
        if (controls === null) {
          failures.push(
            `${mode}/${scale}/${station}: owned parameter span is absent`,
          );
          continue;
        }
        const expected: [number, number, number] = oracle(station, scale, mode);
        const pole: boolean =
          mode === "both"
            ? station === 0 || station === 4 * scale
            : station === (mode === "bottom" ? 0 : 9 * scale);
        for (const order of [0, 1, 2] as const) {
          if (pole && order !== 0) {
            if (
              !throws((): void => {
                AutoMovieLoftCoefficientSource.weights(controls, order);
              })
            )
              failures.push(
                `${mode}: pole fabricated derivative order ${order}`,
              );
            continue;
          }
          const values: number[] = AutoMovieStationHermite.combine(
            controls.a,
            controls.b,
            AutoMovieLoftCoefficientSource.weights(controls, order),
          );
          check(
            values,
            expected[order],
            scale,
            order,
            `${mode}/${station}`,
            failures,
          );
        }
      }

      // Numeric value copies preserve the complete explicit map and endpoint data.
      const clone: IAutoMovieLoftChain = structuredClone(prepared);
      const middle: number =
        (stations[0]! + stations[stations.length - 1]!) / 2;
      const copy: AutoMovieLoftCoefficientSource.IControls | null =
        AutoMovieLoftCoefficientSource.controls(clone, middle);
      if (copy === null) failures.push("value copy lost its pole coordinate");
      else
        check(
          AutoMovieStationHermite.combine(
            copy.a,
            copy.b,
            AutoMovieLoftCoefficientSource.weights(copy, 0),
          ),
          oracle(middle, scale, mode)[0],
          scale,
          0,
          "value copy",
          failures,
        );
      const outer: number[] =
        mode === "both"
          ? [-scale, 5 * scale]
          : mode === "bottom"
            ? [-scale, 10 * scale]
            : [-scale, 10 * scale];
      for (const station of outer)
        if (AutoMovieLoftCoefficientSource.controls(prepared, station) !== null)
          failures.push(
            `${mode}: outside/open station ${station} acquired a source span`,
          );

      // Explicit source removal is the continuation boundary's deliberate station-Hermite choice.
      const layers: Layer[] = clone.layers.map(
        (layer: IAutoMovieLoftChain.ILayer): Layer => ({ ...layer }),
      );
      delete layers[0]!.coefficientSource;
      if (
        AutoMovieLoftCoefficientSource.controls(
          { ...clone, layers },
          (stations[0]! + stations[1]!) / 2,
        ) !== null
      )
        failures.push(
          "missing source did not select the declared boundary mode",
        );
      if (mode === "bottom") {
        const alternate: IAutoMovieLoftChain | string =
          AutoMovieLoftCoefficientSource.prepare(
            { ...raw, pole: { end: "bottom", point: [0, -scale, 0] } },
            { type: "root", pole: -scale, end: "bottom" },
          );
        if (typeof alternate === "string") failures.push(alternate);
        else if (
          AutoMovieLoftCoefficientSource.controls(
            {
              ...prepared,
              layers: [
                prepared.layers[0]!,
                alternate.layers[1]!,
                ...prepared.layers.slice(2),
              ],
            },
            (stations[0]! + stations[1]!) / 2,
          ) !== null
        )
          failures.push(
            "different valid maps did not select the declared station boundary",
          );
      }
      const invalid: Layer = { ...prepared.layers[0]! };
      invalid.coefficientSource = { ...invalid.coefficientSource!, slopes: [] };
      if (
        !throws((): void => {
          AutoMovieLoftCoefficientSource.controls(
            { ...prepared, layers: [invalid, ...prepared.layers.slice(1)] },
            (stations[0]! + stations[1]!) / 2,
          );
        })
      )
        failures.push("invalid present parameter metadata silently fell back");
      consumer(scale, mode, failures);
    }
  const proof: string[] = [];
  const wrong: number[] = row(1);
  wrong[0]! += 0.01;
  check(wrong, 1, 1, 0, "made scalar displacement", proof);
  if (proof.length !== 1)
    failures.push("made coefficient displacement escaped the reader");
  TestValidator.predicate(
    `${failures.length} pole coefficient findings:\n${failures.join("\n")}`,
    failures.length === 0,
  );
}

/** Public scalar sources, loft preparation and final point/jet consumers share one independent radial family. */
function consumer(
  scale: number,
  mode: "bottom" | "top" | "both",
  failures: string[],
): void {
  const sites: number[] =
    mode === "bottom"
      ? [0, 1, 4, 9]
      : mode === "top"
        ? [0, 5, 8, 9]
        : [0, 2, 4];
  const stations: number[] = (mode === "both" ? [0, 1, 2, 3, 4] : sites).map(
    (station: number): number => station * scale,
  );
  const outline: (sign: number) => IAutoMovieViewPart.IOutline = (
    sign: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: sites.map(
      (station: number): IAutoMovieViewPart.IKnot => ({
        site: `${mode}.${station}`,
        station: station * scale,
        value: sign * oracle(station * scale, scale, mode)[0],
      }),
    ),
  });
  const part: IAutoMovieViewPart = {
    name: `actual.pole.${mode}`,
    axis: AutoMovieViewAxis.horizontal(),
    stations,
    front: { positive: outline(1), negative: outline(-1) },
    side: { positive: outline(1), negative: outline(-1) },
    fullness: {
      kind: "shoulder",
      shoulder: {
        knots: [stations[0]!, stations[stations.length - 1]!].map(
          (station: number): IAutoMovieViewPart.IKnot => ({
            site: `ellipse.${station}`,
            station,
            value: AutoMovieViewSection.ELLIPSE,
          }),
        ),
      },
    },
    pole: mode,
    order: 16,
    samples: 32,
  };
  const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
  if (
    result.chain === null ||
    result.surface === null ||
    result.diagnostics.length !== 0
  ) {
    failures.push(
      `actual ${mode}/${scale}: ${JSON.stringify(result.diagnostics)}`,
    );
    return;
  }
  const chain: IAutoMovieLoftChain = result.chain;
  const low: number = chain.layers[0]!.y;
  const high: number = chain.layers[chain.layers.length - 1]!.y;
  if (
    result.surface.domain?.[0] !== stations[0] ||
    result.surface.domain?.[1] !== stations[stations.length - 1]
  )
    failures.push("actual pole surface lost its original owned source domain");
  for (const pole of [chain.pole, chain.opposite])
    if (pole !== undefined) {
      const station: number =
        pole.end === "bottom" ? stations[0]! : stations[stations.length - 1]!;
      const origin: number[] = part.axis.at(station).origin;
      if (
        pole.point.some(
          (value: number, k: number): boolean => value !== origin[k],
        )
      )
        failures.push(
          "actual physical pole differs from its source axis endpoint",
        );
      const point: number[] = result.surface.point!(station, 0.37);
      if (
        point.some(
          (value: number, k: number): boolean =>
            !nclose(value, origin[k]!, 512 * Number.EPSILON * scale),
        )
      )
        failures.push(
          "actual pole Point0 differs from the original axis endpoint",
        );
      if (
        !throws((): void => {
          result.surface!.jet(station, 0.37);
        })
      )
        failures.push("actual pole invented finite regular physical2");
    }
  const queries: number[] = (
    mode === "bottom"
      ? [1, 2.25, 6.25, 9]
      : mode === "top"
        ? [0, 2.75, 6.75, 8]
        : [1, 1.5, 2, 2.5, 3]
  ).map((station: number): number => station * scale);
  for (const station of queries) {
    if (station < low || station > high) {
      failures.push(
        "actual consumer premise queried outside the regular domain",
      );
      continue;
    }
    const radius: [number, number, number] = oracle(station, scale, mode);
    const jet: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(chain, station, 0);
    const vectors: number[][] = [
      AutoMovieLoftChain.point(chain, station, 0),
      jet.p,
      jet.s,
      jet.ss,
    ];
    const expected: number[][] = [
      [radius[0], station, 0],
      [radius[0], station, 0],
      [radius[1], 1, 0],
      [radius[2], 0, 0],
    ];
    for (let index: number = 0; index < vectors.length; index++) {
      const order: number = Math.max(0, index - 1);
      const limit: number =
        512 *
        Number.EPSILON *
        Math.max(scale ** (1 - order), Math.abs(radius[order]!));
      if (
        !vectors[index]!.every((value: number, k: number): boolean =>
          nclose(value, expected[index]![k]!, limit),
        )
      )
        failures.push(
          `actual ${mode}/${scale}/${station} reader ${index}: ${vectors[index]}, expected ${expected[index]}`,
        );
    }
  }
}

/** Prescribed scalar control family; no production spline interpolation chooses these input values. */
function made(
  stations: number[],
  scale: number,
  mode: "bottom" | "top" | "both",
): IAutoMovieLoftChain {
  return {
    name: `pole.${mode}`,
    basis: "spline",
    order: 8,
    rule: "polar",
    samples: 32,
    layers: stations.map(
      (station: number): IAutoMovieLoftChain.ILayer => ({
        y: station,
        coefficients: row(oracle(station, scale, mode)[0]),
        slopes: new Array<number>(16).fill(0),
      }),
    ),
    pole: {
      end: mode === "top" ? "top" : "bottom",
      point: [0, mode === "top" ? 9 * scale : 0, 0],
    },
    ...(mode === "both"
      ? {
          opposite: {
            end: "top" as const,
            point: [0, 4 * scale, 0] as [number, number, number],
          },
        }
      : {}),
  };
}

/** Independent root/angle scalar value and first/second physical-station derivatives. */
function oracle(
  station: number,
  scale: number,
  mode: "bottom" | "top" | "both",
): [number, number, number] {
  const normalized: number = station / scale;
  if (mode !== "both") {
    const distance: number = mode === "bottom" ? normalized : 9 - normalized;
    if (distance === 0) return [0, Infinity, Infinity];
    return [
      scale * Math.sqrt(distance),
      (mode === "bottom" ? 1 : -1) / (2 * Math.sqrt(distance)),
      -1 / (4 * scale * distance ** 1.5),
    ];
  }
  if (normalized === 0 || normalized === 4) return [0, Infinity, Infinity];
  const angle: number = 2 * Math.asin(Math.sqrt(normalized / 4));
  const q: number = Math.min(angle, Math.PI - angle);
  const value: number = (3 * q) / Math.PI - (4 * q ** 3) / Math.PI ** 3;
  const first: number =
    (normalized <= 2 ? 1 : -1) * (3 / Math.PI - (12 * q * q) / Math.PI ** 3);
  const second: number = (-24 * q) / Math.PI ** 3;
  const product: number = normalized * (4 - normalized);
  return [
    scale * value,
    first / Math.sqrt(product),
    (second / product + (first * (normalized - 2)) / product ** 1.5) / scale,
  ];
}

/** Eight prescribed periodic control directions, scaled by the independent scalar radius. */
function row(radius: number): number[] {
  return [
    ...Array.from(
      { length: 8 },
      (_: unknown, k: number): number => radius * Math.cos((k * Math.PI) / 4),
    ),
    ...Array.from(
      { length: 8 },
      (_: unknown, k: number): number => radius * Math.sin((k * Math.PI) / 4),
    ),
  ];
}

/** Compare the direct coefficient row with the independent congruent control family. */
function check(
  values: readonly number[],
  radius: number,
  scale: number,
  order: 0 | 1 | 2,
  label: string,
  failures: string[],
): void {
  const expected: number[] = row(radius);
  const limit: number =
    512 * Number.EPSILON * Math.max(scale ** (1 - order), Math.abs(radius));
  values.forEach((value: number, k: number): void => {
    if (!nclose(value, expected[k]!, limit))
      failures.push(
        `${label} derivative ${order} control ${k}: ${value}, expected ${expected[k]}`,
      );
  });
}

/** An explicitly unavailable physical derivative or malformed present source must fail, not silently change interpolation. */
function throws(action: () => void): boolean {
  try {
    action();
    return false;
  } catch {
    return true;
  }
}
