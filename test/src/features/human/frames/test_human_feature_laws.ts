import { nclose } from "../../internal/predicates";
import {
  AutoMovieHumanFeatureLaws as Laws,
  AutoMovieHumanFeatureTemplate as Template,
  AutoMovieHumanSegmentFrame as F,
} from "@automovie/human";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

/**
 * Every feature law makes its template by its definition: placed by its landmarks, sized by its shares of the person's length.
 *
 * The made person has a length of 1,000 mm for every scale, so a share of 0.012 is 12 mm. A law of one landmark is given the centre
 * [10, -200, 30], the outward direction [2, 0, 0] and the long direction [1, -4, 0], which is not square to it; a law of two landmarks
 * is given the ends [0, 0, 0] and [0, 0, 120] and the outward direction [1, 1, 0].
 *
 * Scenarios:
 * 1. A law of one landmark: the centre is the landmark; the long direction is the given one made square to the outward direction,
 *    `[0, -1, 0]`; the short direction is `outward x along = [0, 0, -1]`; `along x across` is the outward direction `[1, 0, 0]`; the
 *    half extents are the two shares times 1,000 and the height the third.
 * 2. A law of two landmarks: the centre is their midpoint `[0, 0, 60]`, the long direction `[0, 0, 1]`, the half length 60, the half
 *    width and the height its two shares times 1,000.
 * 3. The template's height is the law's at the centre and zero on its edge along both directions, for every law.
 * 4. At twice the length every extent and the height double and the directions are unchanged.
 * 5. The catalogue: every name stands in exactly one of the three lists; a mound's law has a positive height and a hollow's (the
 *    navel, the sternal notch, the retromalleolar hollow) a negative one; only a pad's height follows tissue when the template is
 *    carried to a person.
 * 6. A nonpositive length, a law of two landmarks given one, and a law of one landmark given no long direction are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production `template` on every law of the production table and reads the result through the template record's own `height` and `at`.
 * @evidence contracts/development/testing.md#independent-expectations Directions are hand cross products of the made datums; sizes are the table's shares times a round length; the midpoint and half length are hand sums.
 * @evidence contracts/development/testing.md#distinguishing-cases Both kinds of law, a long direction that is not square to the outward one, two lengths, mounds and hollows, three refusals; all findings are collected.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous pure arithmetic; no family, person or loft.
 * @evidence contracts/development/common.md#meaningful-documentation States the made datums and each scenario's numbers.
 */
export function test_human_feature_laws(): void {
  const failures: string[] = [];
  const close = (label: string, actual: number, expected: number): void => {
    if (!nclose(actual, expected, 1e-9)) failures.push(label + ": " + actual + " against " + expected);
  };
  const same = (label: string, actual: AutoMovieVector3Tuple, expected: AutoMovieVector3Tuple): void => {
    for (let c: number = 0; c < 3; ++c) close(label + "[" + c + "]", actual[c]!, expected[c]!);
  };
  const one: Laws.IDatums = { from: [10, -200, 30], outward: [2, 0, 0], along: [1, -4, 0] };
  const two: Laws.IDatums = { from: [0, 0, 0], to: [0, 0, 120], outward: [1, 1, 0] };
  const hollows: string[] = ["navel", "sternal-notch", "retromalleolar-hollow-medial"];

  for (const law of Laws.LAWS) {
    const spans: boolean = law.landmarks.length === 2;
    const made: Template.ITemplate = Laws.template(law, spans ? two : one, 1000);
    if (spans) {
      same(law.name + " centre", made.centre, [0, 0, 60]);
      same(law.name + " along", made.along, [0, 0, 1]);
      close(law.name + " half length", made.extent.along, 60);
    } else {
      same(law.name + " centre", made.centre, [10, -200, 30]);
      same(law.name + " along", made.along, [0, -1, 0]);
      same(law.name + " across", made.across, [0, 0, -1]);
      same(law.name + " normal", F.cross(made.along, made.across), [1, 0, 0]);
      close(law.name + " half extent along", made.extent.along, (law.along ?? Number.NaN) * 1000);
    }
    close(law.name + " half extent across", made.extent.across, law.across * 1000);
    close(law.name + " height", made.height, law.height * 1000);
    close(law.name + " height at the centre", Template.height(made, 0, 0), law.height * 1000);
    close(law.name + " height on the edge along", Template.height(made, made.extent.along, 0), 0);
    close(law.name + " height on the edge across", Template.height(made, 0, -made.extent.across), 0);

    const doubled: Template.ITemplate = Laws.template(law, spans ? two : one, 2000);
    close(law.name + " doubled across", doubled.extent.across, 2 * made.extent.across);
    close(law.name + " doubled height", doubled.height, 2 * made.height);
    same(law.name + " doubled along", doubled.along, made.along);
    if (!spans) close(law.name + " doubled along extent", doubled.extent.along, 2 * made.extent.along);

    if (hollows.includes(law.name) !== law.height < 0) failures.push(law.name + ": a hollow's height is negative and a mound's positive");
    const fuller: Template.ITemplate = Template.at(made, { along: 1, across: 1, tissue: 1.5 });
    close(law.name + " under tissue", fuller.height, made.height * (law.class === "pad" ? 1.5 : 1));
  }

  const names: string[] = [...Laws.LAWS, ...Laws.WALL, ...Laws.ABSENT].map((row: { name: string }): string => row.name);
  if (new Set(names).size !== names.length) failures.push("a feature stands in more than one list");
  for (const none of [...Laws.WALL, ...Laws.ABSENT]) if (none.why.length === 0) failures.push(none.name + " states no reason");

  const refused = (label: string, call: () => unknown): void => {
    try {
      call();
      failures.push(label + " was accepted");
    } catch {
      // Refused, as the law requires.
    }
  };
  const centred: Laws.ILaw = Laws.LAWS.find((law: Laws.ILaw): boolean => law.landmarks.length === 1)!;
  const spanned: Laws.ILaw = Laws.LAWS.find((law: Laws.ILaw): boolean => law.landmarks.length === 2)!;
  refused("a nonpositive length", (): unknown => Laws.template(centred, one, 0));
  refused("a law of two landmarks given one", (): unknown => Laws.template(spanned, one, 1000));
  refused("a law of one landmark given no long direction", (): unknown => Laws.template(centred, two, 1000));
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
