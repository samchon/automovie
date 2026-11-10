import {
  AutoMovieConstructionKnownPort,
  AutoMovieLoftAdmissionError,
  type IAutoMovieConstructionKnownPortSource,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A known band consumes complete original fields through nonlinear C2 chart maps.
 *
 * Scenarios:
 * 1. Original fields (a,b,a²+b²+offset*(1+a+2b+ab)) use the actual map
 *    (a,b)=(u²,(1+u)v), so the independently known band is
 *    (u²,(1+u)v,u⁴+(1+u)²v²+h(v)*(1+u²+(2+2u+u²+u³)v)).
 *    Both rails and the entire interior check every total2 component.
 * 2. Point0 remains available when chart2 is unavailable; collapsed charts,
 *    incomplete neighboring domains and foreign errors retain explicit failure.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real KnownPort surface Point0 and total2 on both original rails and interior, including actual nonlinear map Hessians and all product-rule terms.
 * @evidence contracts/development/testing.md#independent-expectations Elementary differentiation of the displayed closed-form polynomial gives all six vectors, independently of the operator. Absolute2e-10mm component budget covers finite polynomial arithmetic; no mesh or boundary-jet reconstruction supplies expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Nonlinear chart mapping and interior field curvature distinguish true whole-field pullback from a boundary Taylor strip. Includes both rails, three interior transverse values, unavailable chart2 with valid Point0, rank zero, out-of-owned-field trials and original exception identity.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous construction_known_port CPU question owns made original functions and starts no Human construction, process, viewer or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Original fields (a,b,a²+b²+offset*(1+a+2b+ab)) use the actual map).
 */
export function test_construction_known_port(): void {
  const failures: string[] = [];
  const source: IAutoMovieConstructionKnownPortSource = made();
  const surface: IAutoMovieSolidSurface =
    AutoMovieConstructionKnownPort(source);
  for (const u of [0.2, 0.37, 0.83, 1])
    for (const v of [0, 0.11, 0.5, 0.89, 1]) {
      const h: number = 10 * v ** 3 - 15 * v ** 4 + 6 * v ** 5;
      const d: number = 30 * v ** 2 - 60 * v ** 3 + 30 * v ** 4;
      const dd: number = 60 * v - 180 * v ** 2 + 120 * v ** 3;
      const q: number = 2 + 2 * u + u * u + u ** 3;
      const dq: number = 2 + 2 * u + 3 * u * u;
      const r: number = 1 + u * u + q * v;
      const ru: number = 2 * u + dq * v;
      const expected: IAutoMovieSolidSurface.IJet = {
        p: [u * u, (1 + u) * v, u ** 4 + (1 + u) ** 2 * v * v + h * r],
        u: [2 * u, v, 4 * u ** 3 + 2 * (1 + u) * v * v + h * ru],
        v: [0, 1 + u, 2 * (1 + u) ** 2 * v + d * r + h * q],
        uu: [2, 0, 12 * u * u + 2 * v * v + h * (2 + (2 + 6 * u) * v)],
        uv: [0, 1, 4 * (1 + u) * v + d * ru + h * dq],
        vv: [0, 0, 2 * (1 + u) ** 2 + dd * r + 2 * d * q],
      };
      const actualKernel: IAutoMovieSolidSurface.IJet = surface.jet(v, u);
      const actual: IAutoMovieSolidSurface.IJet = {
        p: actualKernel.p,
        u: actualKernel.v,
        v: actualKernel.u,
        uu: actualKernel.vv,
        uv: actualKernel.uv,
        vv: actualKernel.uu,
      };
      for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
        vector(actual[key], expected[key], failures);
      vector(surface.point!(v, u), expected.p, failures);
    }
  const unavailable: IAutoMovieConstructionKnownPortSource = made();
  const original: IAutoMovieConstructionKnownPortSource.IMap =
    unavailable.maps.get("map")!;
  unavailable.maps = new Map([["map", { ...original, jet: (): null => null }]]);
  const value: IAutoMovieSolidSurface =
    AutoMovieConstructionKnownPort(unavailable);
  vector(value.point!(0.5, 0.5), [0.25, 0.75, 2.09375], failures);
  refuse((): unknown => value.jet(0.5, 0.5), failures, "unavailable map2");
  const collapsed: IAutoMovieConstructionKnownPortSource = made();
  const fixed: IAutoMovieConstructionKnownPortSource.IMap = {
    ...original,
    jet: (): IAutoMovieConstructionKnownPortSource.IJet => ({
      p: [0.5, 0.5],
      u: [0, 0],
      v: [0, 0],
      uu: [0, 0],
      uv: [0, 0],
      vv: [0, 0],
    }),
  };
  collapsed.maps = new Map([["map", fixed]]);
  refuse(
    (): unknown => AutoMovieConstructionKnownPort(collapsed).jet(0, 0.5),
    failures,
    "collapsed original map",
  );
  const outside: IAutoMovieConstructionKnownPortSource = made();
  outside.maps = new Map([
    ["map", { ...original, point: (): [number, number] => [2, 0] }],
  ]);
  refuse(
    (): unknown => AutoMovieConstructionKnownPort(outside).point!(0.5, 0.5),
    failures,
    "outside actual source",
  );
  const marker: Error = new Error("original map datum");
  const foreign: IAutoMovieConstructionKnownPortSource = made();
  foreign.maps = new Map([
    [
      "map",
      {
        ...original,
        jet: (): never => {
          throw marker;
        },
      },
    ],
  ]);
  let caught: unknown;
  try {
    AutoMovieConstructionKnownPort(foreign).jet(0.5, 0.5);
  } catch (error: unknown) {
    caught = error;
  }
  if (caught !== marker)
    failures.push("Original port-map exception lost identity.");
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Two original complete paraboloids and the same exact nonlinear chart correspondence. */
function made(): IAutoMovieConstructionKnownPortSource {
  const field: (offset: number) => IAutoMovieSolidSurface = (
    offset: number,
  ): IAutoMovieSolidSurface => ({
    name: `original.${offset}`,
    domain: [0, 1],
    orientation: 1,
    point: (a: number, b: number): [number, number, number] => [
      a,
      b,
      a * a + b * b + offset * (1 + a + 2 * b + a * b),
    ],
    jet: (a: number, b: number): IAutoMovieSolidSurface.IJet => ({
      p: [a, b, a * a + b * b + offset * (1 + a + 2 * b + a * b)],
      u: [1, 0, 2 * a + offset * (1 + b)],
      v: [0, 1, 2 * b + offset * (2 + a)],
      uu: [0, 0, 2],
      uv: [0, 0, offset],
      vv: [0, 0, 2],
    }),
  });
  const map: IAutoMovieConstructionKnownPortSource.IMap = {
    domain: [0.2, 1],
    transverse: [0, 1],
    point: (u: number, v: number): [number, number] => [u * u, (1 + u) * v],
    jet: (
      u: number,
      v: number,
    ): IAutoMovieConstructionKnownPortSource.IJet => ({
      p: [u * u, (1 + u) * v],
      u: [2 * u, v],
      v: [0, 1 + u],
      uu: [2, 0],
      uv: [0, 1],
      vv: [0, 0],
    }),
  };
  return {
    definition: {
      name: "original.band",
      domain: [0.2, 1],
      orientation: 1,
      parent: {
        field: "parent",
        map: "map",
        boundary: "parent.rail",
        material: "parent.material",
        binding: "parent.weights",
      },
      child: {
        field: "child",
        map: "map",
        boundary: "child.rail",
        material: "child.material",
        binding: "child.weights",
      },
    },
    fields: new Map([
      ["parent", field(0)],
      ["child", field(1)],
    ]),
    maps: new Map([["map", map]]),
  };
}

/** Explicit failure cannot become a successful substitute field. */
function refuse(job: () => unknown, failures: string[], label: string): void {
  try {
    job();
    failures.push(`${label} was accepted.`);
  } catch (error: unknown) {
    if (!(error instanceof AutoMovieLoftAdmissionError))
      failures.push(`${label} lost its admission error: ${String(error)}`);
  }
}

/** Compare original-map derivatives with the independent polynomial. */
function vector(
  actual: readonly number[],
  expected: readonly number[],
  failures: string[],
): void {
  if (
    actual.some(
      (value: number, index: number): boolean =>
        !nclose(value, expected[index]!, 2e-10),
    )
  )
    failures.push(`Band actual ${actual}, expected ${expected}.`);
}
