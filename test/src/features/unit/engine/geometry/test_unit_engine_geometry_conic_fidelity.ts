import { AutoMovieViewSection } from "@automovie/engine";
import type {
  IAutoMoviePolarSector,
  IAutoMovieViewSection,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

/**
 * `AutoMovieViewSection` keeps a generic thin ellipse's source section: the
 * ellipse shoulder (the circle's, sqrt 2 - 1) does not turn concave in a fixed
 * polar approximation.
 *
 * Scenarios:
 *
 * 1. Boxes of half extents a and b with aspect 1, 2, 4, 8, 16, 32 and 64, both
 *    orientations and scales 0.001, 1 and 1000: 512 interior angles all finite;
 *    the radius equals the exact ellipse's 1 / hypot(cos / a, sin / b) within
 *    1e-7 of the short half extent, satisfies the implicit equation (r cos /
 *    a)^2 + (r sin / b)^2 = 1 within 3e-7, and its polar curvature numerator
 *    r^2 + 2 r'^2 - r r'' is nonnegative to 64 epsilon of its size (the exact
 *    ellipse has rho^6 / (a^2 b^2) > 0).
 * 2. The four extreme guides read the half extents a, b, a, b within 64 epsilon of
 *    the larger, and the input box and shoulders are unchanged.
 * 3. For the support family [1, 1 + s, 1, 1] the interior radius at pi / 16, minus
 *    its exact conic, has equal one-sided station derivatives at s = 0 (steps
 *    1e-7, 5e-8, 2.5e-8, within 256 epsilon / step + 32 step^2).
 * 4. A section of half extents 20 with shoulders 0.55, 0.4, 0.35, 0.25 read at
 *    tiny negative phases 1e-20, 1e-30 and 1e-100 gives the limit jet (20, 0,
 *    20 - 400 kappa), with kappa the smaller of 1 / (40 w^2) over the two end
 *    weights w = 0.55 / 0.45 and 0.25 / 0.75, each component within 1e-6 x 20.
 */
export function test_unit_engine_geometry_conic_fidelity(): void {
  const k: number = Math.SQRT2 - 1;
  const shoulder: [number, number, number, number] = [k, k, k, k];
  const aspects: number[] = [1, 2, 4, 8, 16, 32, 64];
  const orientations: boolean[] = [false, true];
  const scales: number[] = [0.001, 1, 1000];
  for (const aspect of aspects)
    for (const swap of orientations)
      for (const scale of scales) {
        const a: number = scale * (swap ? aspect : 1);
        const b: number = scale * (swap ? 1 : aspect);
        const label: string = `aspect ${aspect} swap ${swap} scale ${scale}`;
        const section: IAutoMovieViewSection.ISection = AutoMovieViewSection.of(
          { extents: [a, b, a, b] },
          shoulder,
        );
        let radiusError: number = 0;
        let implicitError: number = 0;
        let inverted: number = 0;
        let nonfinite: number = 0;
        for (let i: number = 0; i < 512; i++) {
          const phi: number = (2 * Math.PI * (i + 0.37)) / 512;
          const jet: IAutoMoviePolarSector.Jet = AutoMovieViewSection.radius(
            section,
            phi,
          );
          if (jet.length !== 3) {
            nonfinite++;
            continue;
          }
          const [r, first, second]: IAutoMoviePolarSector.Jet = jet;
          const cosine: number = Math.cos(phi);
          const sine: number = Math.sin(phi);
          radiusError = Math.max(
            radiusError,
            Math.abs(r - 1 / Math.hypot(cosine / a, sine / b)),
          );
          implicitError = Math.max(
            implicitError,
            Math.abs(((r * cosine) / a) ** 2 + ((r * sine) / b) ** 2 - 1),
          );
          const turn: number = r * r + 2 * first * first - r * second;
          if (
            turn <
            -64 *
              Number.EPSILON *
              (r * r + 2 * first * first + Math.abs(r * second))
          )
            inverted++;
        }
        TestValidator.equals(`${label} nonfinite`, nonfinite, 0);
        TestValidator.predicate(
          `${label} radius`,
          nclose(radiusError, 0, 1e-7 * Math.min(a, b)),
        );
        TestValidator.predicate(
          `${label} implicit`,
          nclose(implicitError, 0, 3e-7),
        );
        TestValidator.equals(`${label} inward`, inverted, 0);
        for (let g: number = 0; g < 4; g++) {
          const radius: number = AutoMovieViewSection.radius(
            section,
            (g * Math.PI) / 2,
          )[0];
          TestValidator.predicate(
            `${label} extreme ${g}`,
            nclose(
              radius,
              g % 2 === 0 ? a : b,
              64 * Number.EPSILON * Math.max(a, b),
            ),
          );
        }
        TestValidator.equals(
          `${label} input extents`,
          [section.box.extents[0], section.box.extents[1]],
          [a, b],
        );
        TestValidator.predicate(
          `${label} input shoulders`,
          section.shoulders.every((r: number): boolean => r === k),
        );
      }

  const angle: number = Math.PI / 16;
  const correctionAt = (station: number): number => {
    const section: IAutoMovieViewSection.ISection = AutoMovieViewSection.bare(
      { extents: [1, 1 + station, 1, 1] },
      shoulder,
    );
    TestValidator.equals(`admission ${station}`, section.conics.failure, null);
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
    TestValidator.predicate(
      `station tangent ${step}`,
      Math.abs(left - right) <=
        (256 * Number.EPSILON) / step + 32 * step * step,
    );
  }

  const asymmetric: IAutoMovieViewSection.ISection = AutoMovieViewSection.bare(
    { extents: [20, 20, 20, 20] },
    [0.55, 0.4, 0.35, 0.25],
  );
  const kappa: number = Math.min(
    1 / (40 * (0.55 / (1 - 0.55)) ** 2),
    1 / (40 * (0.25 / (1 - 0.25)) ** 2),
  );
  const limit: IAutoMoviePolarSector.Jet = [20, 0, 20 - 400 * kappa];
  for (const step of [1e-20, 1e-30, 1e-100]) {
    const actual: IAutoMoviePolarSector.Jet = AutoMovieViewSection.radius(
      asymmetric,
      -step,
    );
    actual.forEach((v: number, i: number): void => {
      TestValidator.predicate(
        `negative phase ${step} component ${i}`,
        Math.abs(v - limit[i]!) <= 1e-6 * 20,
      );
    });
  }
}
