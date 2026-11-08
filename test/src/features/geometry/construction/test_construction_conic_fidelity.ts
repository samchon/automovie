import {
  type AutoMoviePolarSector,
  AutoMovieViewSection,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The ellipse shoulder preserves a generic thin ellipse's source section, rather than becoming concave in a fixed polar approximation.
 *
 * Scenarios:
 * 1. Symmetric boxes of aspect1/2/4/8/16/32/64, both orientations and three length scales, retain their four exact extreme guides and agree with the independent implicit ellipse at interior angles.
 * 2. Every observed polar curvature numerator is nonnegative to binary64 cancellation allowance. The independent exact ellipse has numerator rho^6/(a^2 b^2)>0; a concave interpolation cannot be accepted by changing the original box or shoulder.
 * 3. The maximum radius error stays within 1e-7 of the short half extent, the existing ViewSection approximation budget. This permits a controlled approximation while rejecting an aspect-specific exemption, weaker convexity test or specimen adjustment.
 * 4. A smooth [1,1+s,1,1] support family has one interior station tangent through the shared-curvature branch. It reads actual interior points rather than inferring surface smoothness from guide-curvature metadata. Final-loft conversion and its old cubic negative witness belong to test_construction_phase_fidelity.
 * 5. Tiny negative phases preserve their local distance to guide zero, including an active end correction; adding a full turn must not round that distance away and substitute a different raw quarter curvature.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds actual sections from box/ELLIPSE through ViewSection and observes its public polar jets, implicit positions, extreme guides and unaltered inputs. It also reads the actual interior radius on both sides of the smooth support-family transition.
 * @evidence contracts/testing.md#independent-expectations The ellipse radius is 1/sqrt(cos(phi)^2/a^2+sin(phi)^2/b^2); its independent Cartesian equation is x^2/a^2+y^2/b^2=1 and its curvature numerator is rho^6/(a^2 b^2). Radius budget 1e-7 times the short extent follows the existing approximation's stated target; 3e-7 bounds the consequent implicit residual. Negative curvature allowance 64epsilon*(rho^2+2rho_phi^2+abs(rho*rho_phiphi)) covers binary64 summation, not a shape relaxation. The station observer subtracts the independent exact ellipse and compares second-order one-sided slopes with 256epsilon/step summation allowance and 32step^2 truncation headroom on the stated near-unit family.
 * @evidence contracts/testing.md#distinguishing-cases Includes ordinary and thin aspects, reciprocal orientations, three scales, all four quadrants and negative phases through1e-100, with fixed original box/shoulder and independent formulas instead of the production fault predicate alone.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU geometry unit through --include construction_conic_fidelity; synthetic inputs only, no Human generation, process, renderer or external fixture.
 */
export function test_construction_conic_fidelity(): void {
  const failures: string[] = [];
  const shoulder: [number, number, number, number] = [
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
  ];
  for (const aspect of [1, 2, 4, 8, 16, 32, 64])
    for (const swap of [false, true])
      for (const scale of [0.001, 1, 1000]) {
        const a: number = scale * (swap ? aspect : 1);
        const b: number = scale * (swap ? 1 : aspect);
        const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of(
          { extents: [a, b, a, b] },
          shoulder,
        );
        let radiusError: number = 0;
        let implicitError: number = 0;
        let inverted: number = 0;
        let nonfinite: number = 0;
        for (let i: number = 0; i < 512; i++) {
          const phi: number = (2 * Math.PI * (i + 0.37)) / 512;
          const jet: AutoMoviePolarSector.Jet = AutoMovieViewSection.radius(
            section,
            phi,
          );
          if (jet.length !== 3 || !jet.every(Number.isFinite)) {
            nonfinite++;
            continue;
          }
          const [r, first, second]: AutoMoviePolarSector.Jet = jet;
          const cosine: number = Math.cos(phi);
          const sine: number = Math.sin(phi);
          const expected: number = 1 / Math.hypot(cosine / a, sine / b);
          radiusError = Math.max(radiusError, Math.abs(r - expected));
          implicitError = Math.max(
            implicitError,
            Math.abs(((r * cosine) / a) ** 2 + ((r * sine) / b) ** 2 - 1),
          );
          const turn: number = r * r + 2 * first * first - r * second;
          const allowance: number =
            64 *
            Number.EPSILON *
            (r * r + 2 * first * first + Math.abs(r * second));
          if (turn < -allowance) inverted++;
        }
        const short: number = Math.min(a, b);
        if (
          nonfinite !== 0 ||
          !nclose(radiusError, 0, 1e-7 * short) ||
          !nclose(implicitError, 0, 3e-7) ||
          inverted !== 0
        )
          failures.push(
            `aspect ${aspect}, swap ${swap}, scale ${scale}: radius error ${radiusError} (budget ${1e-7 * short}), implicit ${implicitError}, inward ${inverted}, nonfinite ${nonfinite}`,
          );
        for (let g: number = 0; g < 4; g++) {
          const radius: number = AutoMovieViewSection.radius(
            section,
            (g * Math.PI) / 2,
          )[0];
          const expected: number = g % 2 === 0 ? a : b;
          if (!nclose(radius, expected, 64 * Number.EPSILON * Math.max(a, b)))
            failures.push(
              `ellipse extreme ${g}: ${radius}, expected ${expected}`,
            );
        }
        if (
          section.box.extents[0] !== a ||
          section.box.extents[1] !== b ||
          !section.shoulders.every((r: number): boolean => r === Math.SQRT2 - 1)
        )
          failures.push("the ellipse input was altered");
      }

  // Curvature metadata alone need not be differentiable on a C2 surface.
  // This reader instead differentiates an actual interior radius after a
  // smooth original-support change, subtracting its smooth exact conic.
  const angle: number = Math.PI / 16;
  const correctionAt: (station: number) => number = (
    station: number,
  ): number => {
    const extents: [number, number, number, number] = [1, 1 + station, 1, 1];
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
      { extents },
      shoulder,
    );
    if (section.conics.failure !== null) {
      failures.push(
        `station transition admission ${station}: ${section.conics.failure}`,
      );
      return NaN;
    }
    return (
      AutoMovieViewSection.radius(section, angle)[0] -
      1 / Math.hypot(Math.cos(angle), Math.sin(angle) / (1 + station))
    );
  };
  for (const step of [1e-7, 5e-8, 2.5e-8]) {
    const middle: number = correctionAt(0);
    const left: number =
      (3 * middle - 4 * correctionAt(-step) + correctionAt(-2 * step)) /
      (2 * step);
    const right: number =
      (-3 * middle + 4 * correctionAt(step) - correctionAt(2 * step)) /
      (2 * step);
    const allowance: number = (256 * Number.EPSILON) / step + 32 * step * step;
    if (
      ![left, right].every(Number.isFinite) ||
      Math.abs(left - right) > allowance
    )
      failures.push(
        `interior source station tangent at ${step}: left ${left}, right ${right}, jump ${left - right}, allowance ${allowance}`,
      );
  }

  const asymmetric: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
    { extents: [20, 20, 20, 20] },
    [0.55, 0.4, 0.35, 0.25],
  );
  const firstWeight: number = 0.55 / (1 - 0.55);
  const lastWeight: number = 0.25 / (1 - 0.25);
  const kappa: number = Math.min(
    1 / (40 * firstWeight ** 2),
    1 / (40 * lastWeight ** 2),
  );
  const limit: AutoMoviePolarSector.Jet = [20, 0, 20 - 400 * kappa];
  for (const step of [1e-20, 1e-30, 1e-100]) {
    const actual: AutoMoviePolarSector.Jet = AutoMovieViewSection.radius(
      asymmetric,
      -step,
    );
    if (
      !actual.every(Number.isFinite) ||
      actual.some(
        (v: number, k: number): boolean => Math.abs(v - limit[k]!) > 1e-6 * 20,
      )
    )
      failures.push(
        `negative local phase ${step}: ${actual}, independent limit ${limit}`,
      );
  }

  TestValidator.predicate(
    `${failures.length} conic fidelity findings:\n${failures.join("\n")}`,
    (): boolean => failures.length === 0,
  );
}
