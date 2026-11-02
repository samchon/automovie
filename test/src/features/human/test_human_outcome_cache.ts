import { AutoMovieHumanThoracicCrossing as Crossing } from "../../../../packages/human/src/generation/AutoMovieHumanThoracicCrossing";
import type { IAutoMovieHumanLoftChain as Chain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";
import { HumanOutcomeCache } from "../internal/HumanOutcomeCache";

/**
 * Immutable test consumers retain the actual native failure without repeating geometry work.
 *
 * Scenarios:
 * 1. A real finite spline crossing is computed once and shared without changing its source.
 * 2. Three independent consumers receive the identical native nonfinite-source error, each still failing.
 * 3. A different identity computes its actual known radius change once.
 * 4. Changed inputs under either a successful or failed identity refuse before another producer call.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls HumanOutcomeCache with actual spline endpoint evaluation and collects all consumer outcomes, producer counts, identities and native categories through the existing audit helper.
 * @evidence contracts/testing.md#independent-expectations An eight-control cardinal spline circle has independently authored radius ten after dividing by its known (4+2*cos(2*pi/N))/6 filter eigenvalue. A radius-eleven input must move the actual front crossing one millimetre. Exact object identity and literal operation counts answer cache behavior, not floating-point geometry.
 * @evidence contracts/testing.md#distinguishing-cases Includes real finite geometry, an actual NaN coefficient, repeated successful and failing consumers, a fresh changed identity and changed inputs under existing identities. Every consumer retains the failure; no missing result or substitute success is accepted.
 * @evidence contracts/testing.md#execution-ownership Synchronous portable CPU unit with resident geometry and operation-local caches. No method replacement, process, browser, GPU, whole person or global registry is used.
 */
export function test_human_outcome_cache(): void {
  const audit: HumanFixtureAudit = new HumanFixtureAudit("immutable-outcome", "real-spline-consumers");
  const cache: HumanOutcomeCache<Crossing.IReading> = new HumanOutcomeCache();
  const owner: Chain = circle(10);
  const input: object = { owner, station: 5, lateral: 0 };
  let normalCalls: number = 0;
  let failedCalls: number = 0;
  let deltaCalls: number = 0;
  let normal: Crossing.IReading | undefined;
  let firstError: unknown;
  audit.run({ scenario: "1 actual finite spline and repeated successful consumers", part: owner.name, station: 5, phase: 0 }, (): void => {
    const before: string = JSON.stringify(owner);
    for (const consumer of ["anatomy", "curve", "pose"]) {
      const reading: Crossing.IReading = cache.read("normal", input, (): Crossing.IReading => { normalCalls++; return Crossing.read(owner, 5, 0); });
      normal ??= reading;
      audit.scope({ scenario: "1 repeated actual value", consumer, coordinates: reading.crossings.map((point: Crossing.IPoint): number[] => point.point) });
      audit.check("same successful result object", reading === normal);
      audit.measure("independent front radius", Math.max(...reading.crossings.map((point: Crossing.IPoint): number => point.point[0])), 10, 1e-10, "mm");
    }
    audit.measure("normal producer calls", normalCalls, 1, 0, "calls");
    audit.category("source remains immutable", JSON.stringify(owner), before);
  });
  const invalid: Chain = circle(10);
  invalid.layers[0]!.coefficients[0] = NaN;
  const failedInput: object = { owner: invalid, station: 5, lateral: 0 };
  audit.run({ scenario: "2 actual invalid source reaches all consumers", part: invalid.name, station: 5, phase: 0, coordinates: "NaN spline coefficient" }, (): void => {
    let observedFailures: number = 0;
    for (const consumer of ["anatomy", "curve", "pose"]) {
      let failure: unknown;
      try { cache.read("invalid", failedInput, (): Crossing.IReading => { failedCalls++; return Crossing.read(invalid, 5, 0); }); }
      catch (error) { failure = error; observedFailures++; }
      firstError ??= failure;
      audit.scope({ scenario: "2 all independent consumers fail", consumer, category: failure instanceof Error ? failure.name : typeof failure, reason: failure instanceof Error ? failure.message : String(failure) });
      audit.check("same actual native error object", failure !== undefined && failure === firstError);
      audit.check("actual Error category", failure instanceof Error && failure.constructor === Error && failure.name === "Error");
      audit.category("intended geometric failure", failure instanceof Error ? failure.message : undefined, "A thoracic course evaluated a nonfinite source point");
    }
    audit.measure("failing producer calls", failedCalls, 1, 0, "calls");
    audit.measure("all consumers retain failures", observedFailures, 3, 0, "failures");
  });
  audit.run({ scenario: "3 independent input delta and identity", part: owner.name, station: 5, phase: 0 }, (): void => {
    const changed: Chain = circle(11);
    const reading: Crossing.IReading = cache.read("radius-eleven", { owner: changed, station: 5, lateral: 0 }, (): Crossing.IReading => { deltaCalls++; return Crossing.read(changed, 5, 0); });
    const observed: number = Math.max(...reading.crossings.map((point: Crossing.IPoint): number => point.point[0]));
    audit.measure("new identity executes", deltaCalls, 1, 0, "calls");
    audit.measure("actual radius input delta", observed - Math.max(...normal!.crossings.map((point: Crossing.IPoint): number => point.point[0])), 1, 1e-10, "mm");
  });
  for (const identity of ["normal", "invalid"])
    audit.run({ scenario: "4 immutable identity refuses changed input", identity, station: 6 }, (): void => {
      let caught: unknown;
      try { cache.read(identity, { owner: identity === "normal" ? owner : invalid, station: 6, lateral: 0 }, (): Crossing.IReading => { throw new Error("Changed-input producer must not execute"); }); }
      catch (error) { caught = error; }
      audit.check("intended mutation refusal category", caught instanceof Error && caught.constructor === Error);
      audit.category("intended mutation refusal reason", caught instanceof Error ? caught.message : undefined, "An immutable Human test input changed under a cached identity");
      audit.check("mutation refusal is not cached native geometry failure", caught !== firstError);
      audit.measure("successful producer count unchanged", normalCalls, 1, 0, "calls");
      audit.measure("failed producer count unchanged", failedCalls, 1, 0, "calls");
    });
  audit.finish();
}

/** An independently sized regular cardinal B-spline extrusion. */
function circle(radius: number): Chain {
  const order: number = 8;
  const eigenvalue: number = (4 + 2 * Math.cos(2 * Math.PI / order)) / 6;
  return { name: "diagnostic.circle", basis: "spline", order, samples: 32, rule: "polar", layers: [0, 10].map((y: number): Chain.ILayer => ({ y, coefficients: Array.from({ length: 2 * order }, (_: unknown, index: number): number => radius / eigenvalue * (index < order ? Math.cos(2 * Math.PI * index / order) : Math.sin(2 * Math.PI * (index - order) / order))), slopes: new Array<number>(2 * order).fill(0) })) };
}
