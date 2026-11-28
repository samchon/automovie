import { AutoMovieHumanKnotRule as Rule } from "@automovie/human";

import { nclose } from "../../internal/predicates";

/**
 * The knot rule puts a family's knots at its run ends, its sites and its outlines' extrema, no two closer than the form's scale.
 *
 * Scenarios:
 * 1. A tube 200 mm long with one belly, `40 + 10 sin(pi s / 200)`: three knots, at 0, at the maximum 100 and at 200.
 * 2. Two runs, 0 to 200 and 200 to 500, the second with a belly at 300 and a waist at 420
 *    (`30 + 8 cos(2 pi (s - 300) / 240)` from 200 to 500): knots at 0, 100, 200, 300, 420 and 500. An extremum is compared within 1e-5 mm: beside a maximum of value `f` and bend
 *    `f''` the values within `sqrt(2 eps f / |f''|)` of it are one double, and for the first belly (`f = 50`, `f'' = 10 (pi / 200)^2`)
 *    that is 3e-6 mm, the finest any search on values can place it.
 * 3. A site 6 mm from the belly's maximum on a section of 40 mm reach at share 0.5 (least spacing 20 mm): the site is kept and the
 *    extremum beside it is left out; at share 0.1 (4 mm) both stand.
 * 4. A constant outline adds no knot; two outlines with the same extremum add it once.
 * 5. One run end, unordered runs, a site outside the runs and a nonpositive share are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production rule on made outlines and reads the returned stations and their bases.
 * @evidence contracts/development/testing.md#independent-expectations Each extremum's station is the closed form of the made sine or cosine; the thinning's expectation is the stated distance against the stated share of the stated reach.
 * @evidence contracts/development/common.md#meaningful-documentation Known extrema, preferred sites, duplicate and constant outlines, and malformed run arrays distinguish knot placement from its spacing policy.
 */
export function test_human_knot_rule(): void {
  const failures: string[] = [];
  const stations = (knots: readonly Rule.IKnot[]): number[] => knots.map((knot: Rule.IKnot): number => knot.station);
  const same = (what: string, got: readonly number[], expected: readonly number[]): void => {
    if (got.length !== expected.length || got.some((s: number, k: number): boolean => !nclose(s, expected[k]!, 1e-5))) failures.push(what + ": " + JSON.stringify(got) + " against " + JSON.stringify(expected));
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
  const belly = (s: number): number => 40 + 10 * Math.sin((Math.PI * s) / 200);
  const reach = (): number => 40;
  const base: Rule.IInput = { runs: [0, 200], sites: [], outlines: [belly], reach, share: 0.5, step: 2 };

  // 1. One belly.
  const one: Rule.IKnot[] = Rule.knots(base);
  same("one belly", stations(one), [0, 100, 200]);
  if (one[1]?.basis !== "extremum" || one[0]?.basis !== "run") failures.push("the bases of one belly's knots are wrong: " + JSON.stringify(one));

  // 2. Two runs: a belly on the first, a belly and a waist on the second.
  const second = (s: number): number => (s < 200 ? belly(s) : 30 + 8 * Math.cos((2 * Math.PI * (s - 300)) / 240));
  same("two runs", stations(Rule.knots({ ...base, runs: [0, 200, 500], outlines: [second] })), [0, 100, 200, 300, 420, 500]);

  // 3. A site beside an extremum.
  const near: Rule.IKnot[] = Rule.knots({ ...base, sites: [94] });
  same("a site within the spacing of an extremum", stations(near), [0, 94, 200]);
  if (near[1]?.basis !== "site") failures.push("the kept knot beside the extremum is not the site");
  same("the same at a finer spacing", stations(Rule.knots({ ...base, sites: [94], share: 0.1 })), [0, 94, 100, 200]);

  // 4. Nothing to add; nothing added twice.
  same("a constant outline", stations(Rule.knots({ ...base, outlines: [(): number => 40] })), [0, 200]);
  same("two outlines with one extremum", stations(Rule.knots({ ...base, outlines: [belly, (s: number): number => 2 * belly(s)] })), [0, 100, 200]);

  // 5. Refusals.
  refused("one run end", (): unknown => Rule.knots({ ...base, runs: [0] }));
  refused("unordered runs", (): unknown => Rule.knots({ ...base, runs: [0, 200, 100] }));
  refused("a site outside the runs", (): unknown => Rule.knots({ ...base, sites: [250] }));
  refused("a nonpositive share", (): unknown => Rule.knots({ ...base, share: 0 }));
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
