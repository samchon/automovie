import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftJet } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftJet";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";

/**
 * Repeated phases of one prepared station keep the complete surface jet.
 *
 * Scenarios:
 * 1. A quadratic axis and linear constant lift have known height and curvature.
 * 2. Independent point differences recover first, second and mixed derivatives.
 * 3. Distinct prepared stations remain independent, and out-of-range stations fail.
 * 4. A cloned straight axis is measurably wrong, while a known quadratic input delta changes actual curvature by 0.03.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the prepared station repeatedly and observes its points and six derivative triples. A deliberately erased quadratic curvature fails the same observation the prepared jet passes, while separate stations cannot reuse each other's point.
 * @evidence contracts/testing.md#independent-expectations The authored axis is (0.01s squared,s,0), the lift is 2+0.01s along world up and the section varies linearly in station. These give height 2+1.01s and second X derivative 0.02. Independent five-point first differences of the actual ring sampler are exact for its local cubic phase segments; central second and mixed differences supply the other derivatives. The 0.000001 first and 0.00005 second allowances cover floating-point cancellation at a 0.001 step.
 * @evidence contracts/testing.md#distinguishing-cases Covers phase reuse, three different phase positions, multiple stations in two intervals, both station ends, constant lift and an invalid station. Whole-person surface regularity and geometric identity remain with the anatomy tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit with one synthetic chain, no generated person, host, process, browser or GPU.
 */
export function test_human_loft_jet_station(): void {
  /** Every station and phase retains its own completion and measurement address. */
  const audit: HumanFixtureAudit = new HumanFixtureAudit(
    "quadratic-axis-linear-lift",
    "loft-station-jet",
  );
  /** The fixture has analytically authored axis, lift and section derivatives. */
  const input: IAutoMovieHumanLoftChain = specimen();
  for (const s of [0, 3.1, 7, 10.8, 19])
    audit.run(
      {
        scenario: "station preparation",
        chain: input.name,
        interval: s < 7 ? 0 : 1,
        station: s,
        phase: "not sampled",
        direction: "station domain",
        coordinates: null,
      },
      (): void => {
        /** One prepared closure must remain valid through every following phase. */
        const sample: (t: number) => AutoMovieHumanLoftJet.IJet =
          AutoMovieHumanLoftJet.station(input, s);
        for (const t of [0.4, 2.1, 4.7])
          audit.run(
            {
              scenario: "phase sample",
              chain: input.name,
              interval: s < 7 ? 0 : 1,
              station: s,
              phase: t,
              direction: "surface jet",
              coordinates: null,
            },
            (): void => {
              /** This is the production jet, whose coordinates accompany all differences. */
              const jet: AutoMovieHumanLoftJet.IJet = sample(t);
              audit.scope({
                scenario: "known lifted station",
                chain: input.name,
                interval: s < 7 ? 0 : 1,
                station: s,
                phase: t,
                coordinates: jet.p,
                direction: "world Y",
              });
              audit.measure(
                "known lifted station",
                jet.p[1],
                2 + 1.01 * s,
                1e-11,
                "mm",
              );
              audit.scope({
                scenario: "known axis curvature",
                chain: input.name,
                interval: s < 7 ? 0 : 1,
                station: s,
                phase: t,
                coordinates: jet.p,
                direction: "world X / station squared",
              });
              audit.measure(
                "known quadratic axis curvature",
                jet.ss[0],
                0.02,
                1e-11,
                "1/mm",
              );
              if (s === 0 || s === 19) return;

              /** Difference spacing balances local cubic exactness with roundoff. */
              const h: number = 0.001;
              /** The independent ring sampler does not consume the station jet. */
              const point: (
                ds: number,
                dt: number,
              ) => [number, number, number] = (
                ds: number,
                dt: number,
              ): [number, number, number] =>
                AutoMovieHumanLoftChain.sampler(input, s + ds)(t + dt);
              for (let axis: number = 0; axis < 3; axis++)
                audit.run(
                  {
                    scenario: "independent derivative differences",
                    chain: input.name,
                    interval: s < 7 ? 0 : 1,
                    station: s,
                    phase: t,
                    direction: ["world X", "world Y", "world Z"][axis],
                    coordinates: jet.p,
                    differenceStep: h,
                  },
                  (): void => {
                    /** Each axis owns its oracle calls, so another axis can complete after failure. */
                    const p: [number, number, number] = point(0, 0);
                    audit.measure(
                      "point on the declared ring",
                      jet.p[axis]!,
                      p[axis]!,
                      1e-11,
                      "mm",
                    );
                    audit.measure(
                      "station tangent",
                      jet.s[axis]!,
                      first(
                        (step: number): [number, number, number] =>
                          point(step, 0),
                        axis,
                        h,
                      ),
                      0.000001,
                      "mm/mm",
                    );
                    audit.measure(
                      "phase tangent",
                      jet.t[axis]!,
                      first(
                        (step: number): [number, number, number] =>
                          point(0, step),
                        axis,
                        h,
                      ),
                      0.000001,
                      "mm/rad",
                    );
                    audit.measure(
                      "station curvature",
                      jet.ss[axis]!,
                      (point(h, 0)[axis]! -
                        2 * p[axis]! +
                        point(-h, 0)[axis]!) /
                        (h * h),
                      0.00005,
                      "1/mm",
                    );
                    audit.measure(
                      "phase curvature",
                      jet.tt[axis]!,
                      (point(0, h)[axis]! -
                        2 * p[axis]! +
                        point(0, -h)[axis]!) /
                        (h * h),
                      0.00005,
                      "mm/rad^2",
                    );
                    audit.measure(
                      "mixed derivative",
                      jet.st[axis]!,
                      (point(h, h)[axis]! -
                        point(h, -h)[axis]! -
                        point(-h, h)[axis]! +
                        point(-h, -h)[axis]!) /
                        (4 * h * h),
                      0.00005,
                      "1/rad",
                    );
                  },
                );
            },
          );
      },
    );
  audit.run(
    {
      scenario: "prepared station independence",
      chain: input.name,
      station: [3, 13],
      phase: [1, 2],
      direction: "world Y",
      coordinates: null,
    },
    (): void => {
      /** Separate closures must not share mutable station constants. */
      const lower: (t: number) => AutoMovieHumanLoftJet.IJet =
        AutoMovieHumanLoftJet.station(input, 3);
      /** The second interval has a distinct height and section. */
      const upper: (t: number) => AutoMovieHumanLoftJet.IJet =
        AutoMovieHumanLoftJet.station(input, 13);
      audit.scope({
        scenario: "prepared station independence",
        chain: input.name,
        station: [3, 13],
        phase: [1, 2],
        direction: "world Y",
        coordinates: [lower(1).p, upper(1).p],
      });
      audit.measure(
        "independent station separation",
        upper(1).p[1] - lower(1).p[1],
        10.1,
        1e-11,
        "mm",
      );
      audit.measure(
        "earlier station remains independent",
        lower(2).p[1],
        5.03,
        1e-11,
        "mm",
      );
    },
  );
  audit.run(
    {
      scenario: "out-of-range refusal",
      chain: input.name,
      station: -1,
      phase: "not evaluated",
      direction: "station domain",
      coordinates: null,
    },
    (): void => {
      /** Admission must refuse the station for its domain, not an unrelated exception. */
      let refusal:
        | { category: string; reason: string; stack?: string }
        | undefined;
      try {
        AutoMovieHumanLoftJet.station(input, -1);
      } catch (error) {
        refusal =
          error instanceof Error
            ? {
                category: error.name,
                reason: error.message,
                stack: error.stack,
              }
            : { category: typeof error, reason: String(error) };
      }
      audit.scope({
        scenario: "out-of-range refusal",
        chain: input.name,
        station: -1,
        phase: "not evaluated",
        direction: "station domain",
        coordinates: null,
        refusal,
      });
      audit.category(
        "outside station refusal type",
        refusal?.category,
        "Error",
      );
      audit.check(
        "outside station refusal reason",
        refusal?.reason.includes("outside chain test") === true,
      );
    },
  );
  audit.run(
    {
      scenario: "removed quadratic axis negative control",
      chain: input.name,
      interval: 1,
      station: 7,
      phase: 0.4,
      direction: "world X / station squared",
      coordinates: null,
    },
    (): void => {
      /** A cloned straight axis removes the declared curvature in all three endpoint jets. */
      const straight: IAutoMovieHumanLoftChain = structuredClone(input);
      for (const layer of straight.layers) {
        layer.frame!.origin[0] = 0;
        layer.frameSlopes!.origin[0] = 0;
        layer.frameCurvatures!.origin[0] = 0;
      }
      /** Read the wrong shape through the same actual station producer as the normal case. */
      const actual: AutoMovieHumanLoftJet.IJet = AutoMovieHumanLoftJet.station(
        straight,
        7,
      )(0.4);
      audit.scope({
        scenario: "removed quadratic axis negative control",
        chain: straight.name,
        interval: 1,
        station: 7,
        phase: 0.4,
        direction: "world X / station squared",
        coordinates: actual.p,
      });
      audit.reject(
        "actual straight-axis curvature differs from the declared quadratic",
        actual.ss[0],
        0.02,
        1e-11,
        "1/mm",
      );
    },
  );
  audit.run(
    {
      scenario: "known curvature input delta",
      chain: input.name,
      interval: 0,
      station: 3.1,
      phase: 0.4,
      direction: "world X / station squared",
      coordinates: null,
    },
    (): void => {
      /** Raising the quadratic coefficient by 0.015 adds exactly 0.03 curvature. */
      const changed: IAutoMovieHumanLoftChain = structuredClone(input);
      for (const layer of changed.layers) {
        layer.frame!.origin[0] = 0.025 * layer.y * layer.y;
        layer.frameSlopes!.origin[0] = 0.05 * layer.y;
        layer.frameCurvatures!.origin[0] = 0.05;
      }
      /** Observe both real input shapes without modifying either prepared closure. */
      const actual: AutoMovieHumanLoftJet.IJet = AutoMovieHumanLoftJet.station(
        changed,
        3.1,
      )(0.4);
      /** The nominal curvature remains the analytic 0.02. */
      const nominal: AutoMovieHumanLoftJet.IJet = AutoMovieHumanLoftJet.station(
        input,
        3.1,
      )(0.4);
      audit.scope({
        scenario: "known curvature input delta",
        chain: changed.name,
        interval: 0,
        station: 3.1,
        phase: 0.4,
        direction: "world X / station squared",
        coordinates: actual.p,
        nominalCoordinates: nominal.p,
      });
      audit.measure(
        "changed quadratic curvature",
        actual.ss[0],
        0.05,
        1e-11,
        "1/mm",
      );
      audit.measure(
        "known curvature delta",
        actual.ss[0] - nominal.ss[0],
        0.03,
        1e-11,
        "1/mm",
      );
    },
  );
  audit.finish();
}

/** Five-point first difference cancels the local cubic's exact third-derivative error. */
function first(
  point: (step: number) => [number, number, number],
  axis: number,
  step: number,
): number {
  return (
    (-point(2 * step)[axis]! +
      8 * point(step)[axis]! -
      8 * point(-step)[axis]! +
      point(-2 * step)[axis]!) /
    (12 * step)
  );
}

/** A synthetic spline tube with analytically known axial and lift derivatives. */
function specimen(): IAutoMovieHumanLoftChain {
  const order: number = 8;
  return {
    name: "test",
    basis: "spline",
    order,
    rule: "polar",
    samples: 32,
    layers: [0, 7, 19].map(
      (s: number): IAutoMovieHumanLoftChain.ILayer => ({
        y: s,
        coefficients: Array.from(
          { length: 2 * order },
          (_: unknown, k: number): number =>
            k < order
              ? (10 + 0.03 * s) * Math.cos((2 * Math.PI * k) / order)
              : (8 - 0.02 * s) * Math.sin((2 * Math.PI * (k - order)) / order),
        ),
        slopes: Array.from(
          { length: 2 * order },
          (_: unknown, k: number): number =>
            k < order
              ? 0.03 * Math.cos((2 * Math.PI * k) / order)
              : -0.02 * Math.sin((2 * Math.PI * (k - order)) / order),
        ),
        curvatures: new Array<number>(2 * order).fill(0),
        frame: { origin: [0.01 * s * s, s, 0], u: [1, 0, 0], v: [0, 0, 1] },
        frameSlopes: { origin: [0.02 * s, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
        frameCurvatures: { origin: [0.02, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
        lift: new Array<number>(order).fill(2 + 0.01 * s),
        liftSlopes: new Array<number>(order).fill(0.01),
        liftCurvatures: new Array<number>(order).fill(0),
      }),
    ),
  };
}
