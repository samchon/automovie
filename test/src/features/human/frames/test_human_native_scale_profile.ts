import { nclose } from "../../internal/predicates";
import { AutoMovieHumanNativeScaleProfile as Profile } from "@automovie/human";
import type { AutoMovieVector2Tuple } from "@automovie/interface";

/**
 * The native scale profile reads the endpoint-flat quintic and its own station 2-jet, and composes into a handoff by the product rule.
 *
 * Scenarios:
 * 1. Between sites 0 and 30 mm (ratios [1, 1] to [1.1, 1.2]) the value, first and second derivative equal 1 + d(10t^3 - 15t^4 + 6t^5),
 *    d(30t^2 - 60t^3 + 30t^4)/30 and d(60t - 180t^2 + 120t^3)/900 per direction; before 0 and past 30 the value is held with zero jets;
 *    the jet's value is the call's value bit for bit; the breaks are the sites.
 * 2. Equal sites and `constant` report their constant value and zero jets; a varying profile reports none.
 * 3. A handoff from a constant 1.1 to a profile held at 0.9 between 40 and 80 mm reads 1.1 - 0.2w with w the quintic share, and its
 *    jets -0.2w' and -0.2w''; its breaks are the union of both scales' sites and the interval ends.
 * 4. `of` returns a carried scale itself and null for a plain function.
 * 5. Empty, unordered, nonpositive or nonfinite anchors and an empty handoff interval are refused.
 * 6. A scaling centre line through u = [0, 1, 0] and v = [1, 2, 1] at knots 0, 1, 2 is the natural cubic 1.5x - 0.5x^3 on [0, 1] and its
 *    mirror on [1, 2] (v the same plus 1): 0.6875, ±1.125 and -1.5 at 0.5 and 1.5, 1, 0 and -3 at 1; past its ends it continues along
 *    its end tangent, -1.5 with slope ±1.5 and no second derivative at -1 and 3. Its breaks are its knots; unordered, mismatched or
 *    single samples are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production profile, constant, handoff and guard on made anchors.
 * @evidence contracts/development/testing.md#independent-expectations The expanded quintic gives value and both derivatives. A constant target simplifies the handoff's chain rule. The centre-line control at [0, 1, 2] checks the natural-cubic value and jets against 1.5x − 0.5x³ on its first segment.
 * @evidence contracts/development/common.md#meaningful-documentation Quintic scale jets, constant profile recognition, handoff, profile ownership, invalid anchors and a natural-cubic centre line have distinct expectation cases.
 */
export function test_human_native_scale_profile(): void {
  const failures: string[] = [];
  const close = (what: string, got: number, expected: number, tolerance: number): void => {
    if (!nclose(got, expected, tolerance)) failures.push(`${what}: ${got} against ${expected}`);
  };

  // 1. The quintic between two sites, held outside them.
  const rise: AutoMovieVector2Tuple = [0.1, 0.2];
  const profile: Profile.IScale = Profile.create([
    [0, [1, 1]],
    [30, [1.1, 1.2]],
    [100, [1.1, 1.2]],
  ]);
  for (const s of [-5, 0, 3, 7.5, 15, 22.5, 27, 30, 50, 100, 120]) {
    const t: number = Math.min(1, Math.max(0, s / 30));
    const inside: boolean = s > 0 && s < 30;
    const h: number = 10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5;
    const h1: number = inside ? (30 * t ** 2 - 60 * t ** 3 + 30 * t ** 4) / 30 : 0;
    const h2: number = inside ? (60 * t - 180 * t ** 2 + 120 * t ** 3) / 900 : 0;
    const jet: Profile.IJet = profile.jet(s);
    const value: AutoMovieVector2Tuple = profile(s);
    for (const k of [0, 1] as const) {
      close(`profile value ${k} at ${s}`, value[k], 1 + rise[k] * h, 1e-14);
      close(`profile first ${k} at ${s}`, jet.first[k], rise[k] * h1, 1e-15);
      close(`profile second ${k} at ${s}`, jet.second[k], rise[k] * h2, 1e-15);
      if (!Object.is(jet.value[k], value[k])) failures.push(`profile jet value ${k} at ${s} is not the call's value`);
    }
  }
  if (JSON.stringify(profile.breaks) !== JSON.stringify([0, 30, 100])) failures.push("profile breaks are not its sites: " + JSON.stringify(profile.breaks));
  if (profile.constant !== null) failures.push("a varying profile reported a constant");

  // 2. Constant laws.
  const flat: Profile.IScale = Profile.create([
    [0, [1.1, 1.1]],
    [50, [1.1, 1.1]],
  ]);
  for (const scale of [flat, Profile.constant([1.1, 1.1])]) {
    if (scale.constant === null || scale.constant[0] !== 1.1 || scale.constant[1] !== 1.1) failures.push("a constant law did not report its value");
    for (const s of [-1, 25, 70]) {
      const jet: Profile.IJet = scale.jet(s);
      if (jet.value[0] !== 1.1 || jet.first[0] !== 0 || jet.second[1] !== 0) failures.push("a constant law has a nonzero jet at " + s);
    }
  }

  // 3. A handoff from a constant to a profile held past its last site.
  const held: Profile.IScale = Profile.create([
    [0, [1, 1]],
    [20, [0.9, 0.9]],
  ]);
  const handoff: Profile.IScale = Profile.handoff(Profile.constant([1.1, 1.1]), held, 40, 80);
  for (const s of [30, 40, 50, 60, 70, 80, 90]) {
    const t: number = Math.min(1, Math.max(0, (s - 40) / 40));
    const inside: boolean = s > 40 && s < 80;
    const w: number = 10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5;
    const w1: number = inside ? (30 * t ** 2 - 60 * t ** 3 + 30 * t ** 4) / 40 : 0;
    const w2: number = inside ? (60 * t - 180 * t ** 2 + 120 * t ** 3) / 1600 : 0;
    const jet: Profile.IJet = handoff.jet(s);
    close("handoff value at " + s, handoff(s)[0], 1.1 - 0.2 * w, 1e-14);
    close("handoff jet value at " + s, jet.value[1], 1.1 - 0.2 * w, 1e-14);
    close("handoff first at " + s, jet.first[0], -0.2 * w1, 1e-15);
    close("handoff second at " + s, jet.second[1], -0.2 * w2, 1e-15);
  }
  if (JSON.stringify(handoff.breaks) !== JSON.stringify([0, 20, 40, 80])) failures.push("handoff breaks are not the union: " + JSON.stringify(handoff.breaks));
  if (handoff.constant !== null) failures.push("a varying handoff reported a constant");

  // 4. The guard.
  if (Profile.of(profile) !== profile) failures.push("a carried scale was not recovered");
  if (Profile.of((): AutoMovieVector2Tuple => [1, 1]) !== null) failures.push("a plain scale was given a jet");

  // 5. Refusals.
  for (const [what, bad] of [
    ["empty", (): unknown => Profile.create([])],
    ["unordered", (): unknown => Profile.create([[10, [1, 1]], [10, [1, 1]]])],
    ["nonpositive", (): unknown => Profile.create([[0, [0, 1]]])],
    ["nonfinite", (): unknown => Profile.create([[NaN, [1, 1]]])],
    ["empty handoff", (): unknown => Profile.handoff(flat, flat, 5, 5)],
  ] as const) {
    let refused: boolean = false;
    try {
      bad();
    } catch {
      refused = true;
    }
    if (!refused) failures.push(what + " input was accepted");
  }

  // 6. A scaling centre line through knot samples.
  const centre: Profile.ICentre = Profile.centre([0, 1, 2], [0, 1, 0], [1, 2, 1]);
  for (const [s, value, slope, second] of [
    [0.5, 0.6875, 1.125, -1.5],
    [1, 1, 0, -3],
    [1.5, 0.6875, -1.125, -1.5],
    [-1, -1.5, 1.5, 0],
    [3, -1.5, -1.5, 0],
  ] as const) {
    const jet: Profile.IJet = centre.jet(s);
    close("centre u at " + s, jet.value[0], value, 1e-14);
    close("centre v at " + s, jet.value[1], 1 + value, 1e-14);
    close("centre u slope at " + s, jet.first[0], slope, 1e-14);
    close("centre v slope at " + s, jet.first[1], slope, 1e-14);
    close("centre u second at " + s, jet.second[0], second, 1e-13);
    close("centre v second at " + s, jet.second[1], second, 1e-13);
  }
  if (JSON.stringify(centre.breaks) !== JSON.stringify([0, 1, 2])) failures.push("centre breaks are not its knots: " + JSON.stringify(centre.breaks));
  for (const [what, bad] of [
    ["unordered centre knots", (): unknown => Profile.centre([0, 0], [0, 0], [0, 0])],
    ["mismatched centre samples", (): unknown => Profile.centre([0, 1], [0], [0, 0])],
    ["one centre knot", (): unknown => Profile.centre([0], [0], [0])],
  ] as const) {
    let refused: boolean = false;
    try {
      bad();
    } catch {
      refused = true;
    }
    if (!refused) failures.push(what + " were accepted");
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
