import {
  FamilyConicCaptureCatalog as Catalog,
} from "../../../reference-conics/FamilyConicCaptureCatalog";
import { nclose } from "../../internal/nclose";
import { AutoMovieSolidChain, AutoMovieSplineCurve } from "@automovie/engine";
import type {
  IAutoMovieLoftChain,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Bounded display sampling retains the exact endpoints owned by a real engine surface.
 *
 * Scenarios:
 * 1. A two-layer regular spline tube owns [0,3/7] mm; every one of the eight clock curves reaches both declared ends.
 * 2. The translated interval [-3/7,0] retains the same endpoint contract, and [0,1] is a simple passing counterpart.
 * 3. Three complete rings remain present; interior clock samples stay strictly ordered inside the owned domain.
 * 4. Actual engine Point0 accepts the declared ends before and after catalog creation; exterior trials remain refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Creates actual SolidChain surfaces from regular two-layer spline data, invokes public Catalog.create and inspects returned curves and unavailable evidence. No callback is replaced and no sampling helper is tested in isolation.
 * @evidence contracts/development/testing.md#independent-expectations The supplied frames define P_y(s,phi)=s exactly, so the literal owned bounds determine endpoint ordinates after mm-to-m conversion without repeating the catalog's address formula. Eight 96-point clocks and three 128-point rings are the retained display demand. Rational 3/7 is independent of Human measurements; exact endpoint checks and exterior refusal prevent a tolerance from redefining ownership.
 * @evidence contracts/development/testing.md#distinguishing-cases Rational, translated and unit intervals distinguish endpoint roundoff from general surface failure. Direct endpoint admission, exterior rejection, complete rings and strict interior order are passing counterparts; no renderer or anatomical claim is made.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous selected fixture uses small in-memory spline chains and the existing engine surface adapter; no Human producer, whole-tree realization, mesh, reference file, host or renderer runs.
 * @evidence contracts/development/common.md#meaningful-documentation Four scenarios name the inclusive-domain contract, independent linear-axis oracle, display budgets and unchanged guard.
 */
export function test_human_capture_catalog_endpoints(): void {
  const failures: string[] = [];
  const intervals: readonly (readonly [number, number])[] = [[0, 3 / 7], [-3 / 7, 0], [0, 1]];
  for (const [lo, hi] of intervals) {
    const chain: IAutoMovieLoftChain = tube(lo, hi);
    const surface: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(chain);
    if (surface === null || surface.point === undefined || surface.domain === undefined)
      throw new Error("The regular engine tube did not publish its owned Point0 surface");
    const point: NonNullable<IAutoMovieSolidSurface["point"]> = surface.point;
    TestValidator.predicate("the engine preserves the declared lower bound", nclose(surface.domain[0], lo, 0));
    TestValidator.predicate("the engine preserves the declared upper bound", nclose(surface.domain[1], hi, 0));
    TestValidator.predicate("the actual lower endpoint is admitted", nclose(point(lo, 0)[1], lo, 0));
    TestValidator.predicate("the actual upper endpoint is admitted", nclose(point(hi, 0)[1], hi, 0));

    const declared: Parameters<typeof Catalog.create>[0] = {
      sources: new Map<string, IAutoMovieViewPart>(),
    };
    const result: Catalog.IResult = Catalog.create(declared, [surface], []);
    const clocks: Catalog.IResult["curves"] = result.curves.filter((curve: Catalog.IResult["curves"][number]): boolean => curve.id.startsWith("operator.endpoint-tube.clock."));
    const rings: Catalog.IResult["curves"] = result.curves.filter((curve: Catalog.IResult["curves"][number]): boolean => curve.id.startsWith("operator.endpoint-tube.ring."));
    if (result.unavailable.length !== 0) failures.push(`${lo}..${hi}: valid surface display became unavailable: ${JSON.stringify(result.unavailable)}`);
    if (clocks.length !== 8) failures.push(`${lo}..${hi}: retained ${clocks.length} of eight clock curves`);
    if (rings.length !== 3 || rings.some((ring: Catalog.IResult["curves"][number]): boolean => ring.points.length !== 128)) failures.push(`${lo}..${hi}: complete rings changed`);
    for (const clock of clocks) {
      if (clock.points.length !== 96) failures.push(clock.id + " did not retain its complete display demand");
      const first: number | undefined = clock.points[0]?.[1];
      const last: number | undefined = clock.points.at(-1)?.[1];
      if (first === undefined || !nclose(first, lo / 1000, 0)) failures.push(clock.id + " lost its exact lower endpoint");
      if (last === undefined || !nclose(last, hi / 1000, 0)) failures.push(clock.id + " lost its exact upper endpoint");
      for (let j: number = 1; j < clock.points.length - 1; j++) {
        const value: number = clock.points[j]![1];
        if (!(value > lo / 1000 && value < hi / 1000 && value > clock.points[j - 1]![1])) failures.push(clock.id + " changed its strict interior station order");
      }
    }

    // The display consumer may not broaden the engine's inclusive ownership.
    for (const outside of [lo - Number.EPSILON, hi + Number.EPSILON]) {
      let refused: boolean = false;
      try { point(outside, 0); }
      catch { refused = true; }
      if (!refused) failures.push("Actual owned-domain guard accepted an exterior trial");
    }
    TestValidator.predicate("catalog leaves the lower endpoint available", nclose(point(lo, 0)[1], lo, 0));
    TestValidator.predicate("catalog leaves the upper endpoint available", nclose(point(hi, 0)[1], hi, 0));
  }
  TestValidator.predicate("retained display endpoint findings: " + failures.join("; "), failures.length === 0);
}

/** A regular constant section on a linear Y course; all derivatives are supplied as geometry input. */
function tube(lo: number, hi: number): IAutoMovieLoftChain {
  const count: number = 16;
  const coefficients: number[] = AutoMovieSplineCurve.interpolate(Array.from(
    { length: count },
    (_: unknown, k: number): [number, number] => [Math.cos(2 * Math.PI * k / count), Math.sin(2 * Math.PI * k / count)],
  ));
  return {
    name: "endpoint-tube",
    basis: "spline",
    order: count,
    rule: "polar",
    samples: count,
    orientation: 1,
    layers: [lo, hi].map((station: number): IAutoMovieLoftChain.ILayer => ({
      y: station,
      coefficients,
      slopes: new Array<number>(coefficients.length).fill(0),
      curvatures: new Array<number>(coefficients.length).fill(0),
      frame: { origin: [0, station, 0], u: [1, 0, 0], v: [0, 0, 1] },
      frameSlopes: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
      frameCurvatures: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
    })),
  };
}
