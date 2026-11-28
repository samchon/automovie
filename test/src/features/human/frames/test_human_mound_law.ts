import { AutoMovieHumanMoundLaw as Mound } from "@automovie/human";

import { nclose } from "../../internal/predicates";

/**
 * The mound law ties a mound's base radii and projection to its volume and shares a change of volume between them: little to the
 * base, the rest to the projection.
 *
 * Scenarios:
 * 1. A hemisphere of radius 60 mm (three radii and the projection all 60) has the volume `(2 / 3) pi 60^3`, the formula's own check.
 * 2. `projection` inverts `volume` on a made mound (radii 70, 75, 60, projection 50) within 1e-9 mm.
 * 3. The base's exponent is the slope of `ln diameter` on `ln volume` through the breast CT study's four group means
 *    ((324.7, 11.1), (467.9, 11.4), (803.1, 13.0), (1203.7, 13.7)), recomputed here by least squares: it rounds to the module's 0.17.
 * 4. A volume 1.2 times the prior's with no bound: every radius grows by `1.2^0.17` (3.1 %), the projection by more than a similar
 *    solid's `1.2^(1/3)` and by less than 1.2, and the volume is the asked one within 1e-6 of it: the projection takes most of the
 *    change, the base a little.
 * 5. The same with the lateral radius bounded at the prior's: it stays, the other two grow as before, the projection grows by more
 *    than in scenario 4, and the volume is still the asked one.
 * 6. A smaller volume shrinks every radius by its ratio to the power 0.17 and the projection by more than a similar solid's.
 * 7. A volume the bounded base cannot hold, a projection past two thirds of the radii's sum, and nonpositive inputs are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production volume, projection and mound on made mounds.
 * @evidence contracts/development/testing.md#independent-expectations The hemisphere's volume is the solid's closed form, not the formula under test; the exponent is recomputed from the published means; each grown mound is checked by putting it back into the volume and by inequalities against the similar solid and the plain ratio.
 * @evidence contracts/development/common.md#meaningful-documentation A hemisphere, inverted projection, recorded exponent, wider and narrower volumes, a fixed radius and physically impossible requests provide distinct checks.
 */
export function test_human_mound_law(): void {
  const failures: string[] = [];
  const close = (what: string, got: number, expected: number, tolerance: number): void => {
    if (!nclose(got, expected, tolerance)) failures.push(`${what}: ${got} against ${expected}`);
  };
  const refused = (what: string, bad: () => unknown): void => {
    let thrown: boolean = false;
    try {
      bad();
    } catch {
      thrown = true;
    }
    if (!thrown) failures.push(what + " was accepted");
  };

  // 1. The hemisphere.
  const R: number = 60;
  close("the hemisphere's volume", Mound.volume({ radii: { medial: R, lateral: R, inferior: R }, projection: R }), (2 / 3) * Math.PI * R ** 3, 1e-6);

  // 2. The inverse.
  const prior: Mound.IMound = { radii: { medial: 70, lateral: 75, inferior: 60 }, projection: 50 };
  const held: number = Mound.volume(prior);
  close("the inverse projection", Mound.projection(held, prior.radii), 50, 1e-9);

  // 3. The exponent from its source's four means, by least squares on the logarithms.
  const means: [number, number][] = [[324.7, 11.1], [467.9, 11.4], [803.1, 13.0], [1203.7, 13.7]];
  const xs: number[] = means.map(([v]: [number, number]): number => Math.log(v));
  const ys: number[] = means.map(([, d]: [number, number]): number => Math.log(d));
  const mean = (list: readonly number[]): number => list.reduce((a: number, b: number): number => a + b, 0) / list.length;
  const slope: number = xs.reduce((sum: number, x: number, k: number): number => sum + (x - mean(xs)) * (ys[k]! - mean(ys)), 0) / xs.reduce((sum: number, x: number): number => sum + (x - mean(xs)) ** 2, 0);
  close("the base's exponent against its source", Mound.BASE_EXPONENT, slope, 0.005);

  // 4. Growth: a little to the base, the rest to the projection.
  const base: number = 1.2 ** Mound.BASE_EXPONENT;
  const grown: Mound.IMound = Mound.mound(1.2 * held, prior);
  close("the grown medial radius", grown.radii.medial, 70 * base, 1e-9);
  close("the grown lateral radius", grown.radii.lateral, 75 * base, 1e-9);
  close("the grown inferior radius", grown.radii.inferior, 60 * base, 1e-9);
  if (!(grown.projection > 50 * Math.cbrt(1.2) && grown.projection < 50 * 1.2)) failures.push("the grown projection left its bracket: " + grown.projection);
  close("the grown volume", Mound.volume(grown), 1.2 * held, 1e-6 * held);

  // 5. A bounded base.
  const bounded: Mound.IMound = Mound.mound(1.2 * held, prior, { lateral: 75 });
  close("the bounded lateral radius", bounded.radii.lateral, 75, 1e-12);
  close("the free medial radius beside it", bounded.radii.medial, 70 * base, 1e-9);
  if (!(bounded.projection > grown.projection && bounded.projection < 50 * 1.2)) failures.push("the bounded mound's projection left its bracket: " + bounded.projection);
  close("the bounded volume", Mound.volume(bounded), 1.2 * held, 1e-6 * held);

  // 6. Shrinkage.
  const smaller: Mound.IMound = Mound.mound(0.5 * held, prior);
  close("the smaller inferior radius", smaller.radii.inferior, 60 * 0.5 ** Mound.BASE_EXPONENT, 1e-9);
  if (!(smaller.projection < 50 * Math.cbrt(0.5) && smaller.projection > 50 * 0.5)) failures.push("the smaller projection left its bracket: " + smaller.projection);
  close("the smaller volume", Mound.volume(smaller), 0.5 * held, 1e-6 * held);

  // 7. Refusals.
  refused("a volume the bounded base cannot hold", (): unknown => Mound.mound(40 * held, prior, { medial: 70, lateral: 75, inferior: 60 }));
  refused("a projection past the formula's range", (): unknown => Mound.volume({ radii: prior.radii, projection: 140 }));
  refused("a nonpositive volume", (): unknown => Mound.projection(0, prior.radii));
  refused("a nonpositive bound", (): unknown => Mound.mound(held, prior, { lateral: 0 }));
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
